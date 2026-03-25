'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

export interface RestaurantHistoryEntry {
  id: string
  event_id: string
  group_id: string
  name: string | null
  visited_at: string
  attendee_ids: string[]
  created_by: string
  created_at: string
}

export type CloseEventResult =
  | { closed: true }
  | { closed: false; alreadyVisited: { name: string; visited_at: string } }

// Scenario: Restaurante cargado al cerrar evento.
// Scenario: Restaurante ya en el historial — devuelve alreadyVisited si !force.
// Scenario: Cierre sin restaurante — restaurantName=null, name queda null en history.
export async function closeEvent(
  eventId: string,
  restaurantName: string | null,
  force: boolean = false
): Promise<ActionResult<CloseEventResult>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado' }

  // Obtener el evento y validar organizador + estado
  const { data: event } = await supabase
    .from('events')
    .select('id, group_id, organizer_id, status, event_date')
    .eq('id', eventId)
    .maybeSingle()

  if (!event) return { success: false, error: 'Evento no encontrado.' }
  if (event.organizer_id !== user.id) {
    return { success: false, error: 'Solo el organizador puede cerrar el evento.' }
  }
  if (event.status === 'closed') {
    return { success: false, error: 'El evento ya está cerrado.' }
  }

  // Scenario: Restaurante ya en el historial — check duplicado (case-insensitive)
  if (restaurantName && !force) {
    const trimmed = restaurantName.trim()
    const { data: existing } = await supabase
      .from('restaurant_history')
      .select('name, visited_at')
      .eq('group_id', event.group_id)
      .ilike('name', trimmed)
      .maybeSingle()

    if (existing) {
      return {
        success: true,
        data: {
          closed: false,
          alreadyVisited: { name: existing.name!, visited_at: existing.visited_at },
        },
      }
    }
  }

  // Snapshot de asistentes confirmados con 'va'
  const { data: attendances } = await supabase
    .from('attendances')
    .select('member_id')
    .eq('event_id', eventId)
    .eq('status', 'va')

  const attendeeIds = (attendances ?? []).map((a) => a.member_id)

  // visited_at = event_date del evento, o fecha actual como fallback
  const visitedAt = event.event_date ?? new Date().toISOString().split('T')[0]

  // INSERT restaurant_history (name nullable — Scenario: Cierre sin restaurante)
  const { error: historyError } = await supabase.from('restaurant_history').insert({
    event_id: eventId,
    group_id: event.group_id,
    name: restaurantName ? restaurantName.trim() : null,
    visited_at: visitedAt,
    attendee_ids: attendeeIds,
    created_by: user.id,
  })

  if (historyError) {
    return { success: false, error: 'No se pudo guardar el historial. Intentá de nuevo.' }
  }

  // UPDATE events.status = 'closed'
  const { error: closeError } = await supabase
    .from('events')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('id', eventId)
    .eq('organizer_id', user.id)
    .neq('status', 'closed')

  if (closeError) {
    return { success: false, error: 'No se pudo cerrar el evento. Intentá de nuevo.' }
  }

  return { success: true, data: { closed: true } }
}

// Retorna el historial de restaurantes del grupo, ordenado por fecha descendente.
export async function getRestaurantHistory(
  groupId: string
): Promise<ActionResult<RestaurantHistoryEntry[]>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado' }

  const { data, error } = await supabase
    .from('restaurant_history')
    .select('id, event_id, group_id, name, visited_at, attendee_ids, created_by, created_at')
    .eq('group_id', groupId)
    .order('visited_at', { ascending: false })

  if (error) return { success: false, error: 'No se pudo obtener el historial.' }

  return { success: true, data: data ?? [] }
}
