'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

export interface ChecklistItem {
  id: string
  event_id: string
  template_id: string | null
  label: string
  description: string | null
  status: 'pending' | 'done'
  order_index: number
  completed_at: string | null
  created_at: string
}

// Scenario: Checklist disponible al ser asignado — si no hay items los crea desde templates globales.
// Scenario: Retomar checklist incompleto — si ya existen items los devuelve con el progreso guardado.
export async function getOrCreateChecklist(
  eventId: string
): Promise<ActionResult<ChecklistItem[]>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado' }

  // Verificar que el usuario es el organizador del evento
  const { data: event } = await supabase
    .from('events')
    .select('id, organizer_id')
    .eq('id', eventId)
    .maybeSingle()

  if (!event) return { success: false, error: 'Evento no encontrado.' }
  if (event.organizer_id !== user.id) {
    return { success: false, error: 'Solo el organizador puede ver el checklist.' }
  }

  // Scenario: Retomar checklist incompleto — devolver items existentes
  const { data: existing, error: fetchError } = await supabase
    .from('checklist_items')
    .select('id, event_id, template_id, label, description, status, order_index, completed_at, created_at')
    .eq('event_id', eventId)
    .order('order_index')

  if (fetchError) return { success: false, error: 'No se pudo obtener el checklist.' }

  if (existing && existing.length > 0) {
    return { success: true, data: existing as ChecklistItem[] }
  }

  // Scenario: Checklist disponible al ser asignado — crear desde templates globales
  const { data: templates, error: templatesError } = await supabase
    .from('checklist_templates')
    .select('id, label, description, order_index')
    .eq('global', true)
    .order('order_index')

  if (templatesError || !templates || templates.length === 0) {
    return { success: false, error: 'No se encontraron templates para el checklist.' }
  }

  const toInsert = templates.map((t) => ({
    event_id: eventId,
    template_id: t.id,
    label: t.label,
    description: t.description ?? null,
    order_index: t.order_index,
    status: 'pending' as const,
  }))

  const { error: insertError } = await supabase.from('checklist_items').insert(toInsert)

  if (insertError) return { success: false, error: 'No se pudo crear el checklist.' }

  // SELECT separado del INSERT para evitar race con RLS
  const { data: created, error: createdError } = await supabase
    .from('checklist_items')
    .select('id, event_id, template_id, label, description, status, order_index, completed_at, created_at')
    .eq('event_id', eventId)
    .order('order_index')

  if (createdError) return { success: false, error: 'No se pudo obtener el checklist creado.' }

  return { success: true, data: (created ?? []) as ChecklistItem[] }
}

// Scenario: Tarea completada — actualiza status y completed_at; revertible (pending).
export async function toggleChecklistItem(
  itemId: string,
  done: boolean
): Promise<ActionResult<void>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado' }

  const { error } = await supabase
    .from('checklist_items')
    .update({
      status: done ? 'done' : 'pending',
      completed_at: done ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)

  if (error) return { success: false, error: 'No se pudo actualizar la tarea.' }

  return { success: true, data: undefined }
}
