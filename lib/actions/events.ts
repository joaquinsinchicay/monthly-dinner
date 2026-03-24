'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Event } from '@/types'

// Primer día del mes actual — formato 'YYYY-MM-DD'
function currentMonth(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .split('T')[0]
}

// Retorna el evento del mes actual para el grupo, o null si no existe.
export async function getCurrentEvent(
  groupId: string
): Promise<ActionResult<Event | null>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado' }

  const { data, error } = await supabase
    .from('events')
    .select('id, group_id, organizer_id, month, status, event_date, place, description, notified_at, closed_at, created_at, updated_at')
    .eq('group_id', groupId)
    .eq('month', currentMonth())
    .maybeSingle()

  if (error) return { success: false, error: 'No se pudo obtener el evento del mes.' }

  return { success: true, data: data ?? null }
}

// Scenario: Creación exitosa — solo el organizador del mes puede crear.
// Scenario: Evento ya existente en el mes — unique constraint devuelve error específico.
// Scenario: Campos obligatorios vacíos — event_date requerida.
export async function createEvent(
  groupId: string,
  formData: FormData
): Promise<ActionResult<Event>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado' }

  // Validar que el usuario es el organizador del mes actual
  const month = currentMonth()
  const { data: rotation } = await supabase
    .from('rotation')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('month', month)
    .maybeSingle()

  if (!rotation || rotation.user_id !== user.id) {
    return { success: false, error: 'Solo el organizador del mes puede crear el evento.' }
  }

  // Scenario: Campos obligatorios vacíos
  const eventDate = (formData.get('event_date') as string)?.trim()
  if (!eventDate) {
    return { success: false, error: 'La fecha del evento es obligatoria.' }
  }

  const place = (formData.get('place') as string)?.trim() || null
  const description = (formData.get('description') as string)?.trim() || null

  // Scenario: Evento ya existente en el mes — detectar antes de insert
  const { data: existing } = await supabase
    .from('events')
    .select('id')
    .eq('group_id', groupId)
    .eq('month', month)
    .maybeSingle()

  if (existing) {
    return {
      success: false,
      error: 'Ya existe un evento para este mes. Podés editarlo desde el panel.',
    }
  }

  // INSERT separado del SELECT — evitar race condition con RETURNING (ver technical-decisions.md)
  const { error: insertError } = await supabase
    .from('events')
    .insert({
      group_id: groupId,
      organizer_id: user.id,
      month,
      event_date: eventDate,
      place,
      description,
      status: 'pending',
    })

  if (insertError) {
    return { success: false, error: 'No se pudo crear el evento. Intentá de nuevo.' }
  }

  const { data: event, error: selectError } = await supabase
    .from('events')
    .select('id, group_id, organizer_id, month, status, event_date, place, description, notified_at, closed_at, created_at, updated_at')
    .eq('group_id', groupId)
    .eq('month', month)
    .single()

  if (selectError || !event) {
    return { success: false, error: 'Evento creado pero no se pudo obtener los datos.' }
  }

  return { success: true, data: event }
}

// Scenario: Edición posterior — solo el organizador puede editar, y el evento no debe estar cerrado.
// organizer_id es inmutable — validación en server action, RLS no lo garantiza en UPDATE.
export async function updateEvent(
  eventId: string,
  formData: FormData
): Promise<ActionResult<Event>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado' }

  // Verificar que el evento existe, no está cerrado y el usuario es el organizador
  const { data: existing } = await supabase
    .from('events')
    .select('id, organizer_id, status, group_id, month')
    .eq('id', eventId)
    .maybeSingle()

  if (!existing) return { success: false, error: 'Evento no encontrado.' }
  if (existing.organizer_id !== user.id) {
    return { success: false, error: 'Solo el organizador puede editar el evento.' }
  }
  if (existing.status === 'closed') {
    return { success: false, error: 'No se puede editar un evento cerrado.' }
  }

  const eventDate = (formData.get('event_date') as string)?.trim()
  if (!eventDate) {
    return { success: false, error: 'La fecha del evento es obligatoria.' }
  }

  const place = (formData.get('place') as string)?.trim() || null
  const description = (formData.get('description') as string)?.trim() || null

  const { error: updateError } = await supabase
    .from('events')
    .update({
      event_date: eventDate,
      place,
      description,
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    // organizer_id no se actualiza — inmutabilidad garantizada en server action
    .eq('organizer_id', user.id)
    .neq('status', 'closed')

  if (updateError) {
    return { success: false, error: 'No se pudo guardar los cambios. Intentá de nuevo.' }
  }

  const { data: event } = await supabase
    .from('events')
    .select('id, group_id, organizer_id, month, status, event_date, place, description, notified_at, closed_at, created_at, updated_at')
    .eq('id', eventId)
    .single()

  return { success: true, data: event! }
}
