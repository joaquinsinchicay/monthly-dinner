'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

export interface PollOption {
  id: string
  poll_id: string
  label: string
  created_at: string
}

export interface Poll {
  id: string
  event_id: string
  group_id: string
  created_by: string
  status: 'open' | 'closed'
  closes_at: string
  closed_at: string | null
  created_at: string
}

export interface PollWithOptions extends Poll {
  options: PollOption[]
}

// Retorna la votación del evento con sus opciones, o null si no existe.
export async function getPollWithOptions(
  eventId: string
): Promise<ActionResult<PollWithOptions | null>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado' }

  const { data: poll, error } = await supabase
    .from('polls')
    .select('id, event_id, group_id, created_by, status, closes_at, closed_at, created_at')
    .eq('event_id', eventId)
    .maybeSingle()

  if (error) return { success: false, error: 'No se pudo obtener la votación.' }
  if (!poll) return { success: true, data: null }

  const { data: options } = await supabase
    .from('poll_options')
    .select('id, poll_id, label, created_at')
    .eq('poll_id', poll.id)
    .order('created_at')

  return { success: true, data: { ...poll, options: options ?? [] } }
}

// Scenario: Votación creada exitosamente — INSERT poll + options, status='open'.
// Scenario: Menos de 2 opciones — validación server-side.
// Scenario: Fecha de cierre en el pasado — closes_at debe ser futuro.
// Scenario: Solo una votación activa por evento — check previo al INSERT.
export async function createPoll(
  eventId: string,
  groupId: string,
  options: string[],
  closesAt: string
): Promise<ActionResult<PollWithOptions>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado' }

  // Validar que el usuario es el organizador del evento
  const { data: event } = await supabase
    .from('events')
    .select('organizer_id')
    .eq('id', eventId)
    .maybeSingle()

  if (!event) return { success: false, error: 'Evento no encontrado.' }
  if (event.organizer_id !== user.id) {
    return { success: false, error: 'Solo el organizador puede abrir la votación.' }
  }

  // Scenario: Menos de 2 opciones
  const validOptions = options.map((o) => o.trim()).filter(Boolean)
  if (validOptions.length < 2) {
    return { success: false, error: 'Se necesitan al menos 2 opciones para abrir la votación.' }
  }

  // Scenario: Fecha de cierre en el pasado
  const closesAtDate = new Date(closesAt)
  if (isNaN(closesAtDate.getTime()) || closesAtDate <= new Date()) {
    return { success: false, error: 'La fecha de cierre debe ser en el futuro.' }
  }

  // Scenario: Solo una votación activa por evento
  const { data: existing } = await supabase
    .from('polls')
    .select('id')
    .eq('event_id', eventId)
    .maybeSingle()

  if (existing) {
    return {
      success: false,
      error: 'Ya existe una votación para este evento. Podés editarla desde el panel.',
    }
  }

  // INSERT poll — separado del SELECT (patrón establecido, evita RETURNING race con RLS)
  const { error: pollError } = await supabase.from('polls').insert({
    event_id: eventId,
    group_id: groupId,
    created_by: user.id,
    closes_at: closesAtDate.toISOString(),
  })

  if (pollError) return { success: false, error: 'No se pudo crear la votación. Intentá de nuevo.' }

  // SELECT poll recién creado
  const { data: poll, error: selectError } = await supabase
    .from('polls')
    .select('id, event_id, group_id, created_by, status, closes_at, closed_at, created_at')
    .eq('event_id', eventId)
    .single()

  if (selectError || !poll) {
    return { success: false, error: 'Votación creada pero no se pudo obtener los datos.' }
  }

  // INSERT opciones
  const { error: optError } = await supabase
    .from('poll_options')
    .insert(validOptions.map((label) => ({ poll_id: poll.id, label })))

  if (optError) return { success: false, error: 'No se pudieron guardar las opciones.' }

  // SELECT opciones
  const { data: pollOptions } = await supabase
    .from('poll_options')
    .select('id, poll_id, label, created_at')
    .eq('poll_id', poll.id)
    .order('created_at')

  return { success: true, data: { ...poll, options: pollOptions ?? [] } }
}
