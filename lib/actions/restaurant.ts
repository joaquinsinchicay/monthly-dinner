'use server'

import { createClient } from '@/lib/supabase/server'
import { t } from '@/lib/t'
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

export interface Attendee {
  id: string
  name: string
}

export interface RestaurantHistoryEntryWithNames extends RestaurantHistoryEntry {
  attendees: Attendee[]
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

  if (!user) return { success: false, error: t('common.notAuthenticated') }

  // Obtener el evento y validar organizador + estado
  const { data: event } = await supabase
    .from('events')
    .select('id, group_id, organizer_id, status, event_date')
    .eq('id', eventId)
    .maybeSingle()

  if (!event) return { success: false, error: t('errors.restaurant.eventNotFound') }
  if (event.organizer_id !== user.id) {
    return { success: false, error: t('errors.restaurant.notOrganizer') }
  }
  if (event.status === 'closed') {
    return { success: false, error: t('errors.restaurant.alreadyClosed') }
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
    return { success: false, error: t('errors.restaurant.historyFailed') }
  }

  // UPDATE events.status = 'closed'
  const { error: closeError } = await supabase
    .from('events')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('id', eventId)
    .eq('organizer_id', user.id)
    .neq('status', 'closed')

  if (closeError) {
    return { success: false, error: t('errors.restaurant.closeFailed') }
  }

  // US-13: auto-asignar organizador del próximo mes (security definer bypasea RLS)
  await supabase.rpc('assign_next_rotation', { p_group_id: event.group_id })

  return { success: true, data: { closed: true } }
}

// Scenario: Historial con registros — lista ordenada por fecha con nombre, fecha y asistentes.
// Scenario: Historial vacío — devuelve array vacío.
// Requiere política RLS "profiles: select group members" (migración US-10).
export async function getRestaurantHistory(
  groupId: string
): Promise<ActionResult<RestaurantHistoryEntryWithNames[]>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: t('common.notAuthenticated') }

  const { data: rows, error } = await supabase
    .from('restaurant_history')
    .select('id, event_id, group_id, name, visited_at, attendee_ids, created_by, created_at')
    .eq('group_id', groupId)
    .order('visited_at', { ascending: false })

  if (error) return { success: false, error: t('errors.restaurant.getHistoryFailed') }

  const entries = rows ?? []
  if (entries.length === 0) return { success: true, data: [] }

  // Resolver nombres de asistentes: colectar todos los UUIDs únicos y hacer un solo SELECT
  const allIds = Array.from(new Set(entries.flatMap((e) => e.attendee_ids as string[])))

  const profileMap: Record<string, string> = {}
  if (allIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', allIds)

    for (const p of profiles ?? []) {
      profileMap[p.id] = p.full_name ?? 'Miembro'
    }
  }

  const enriched: RestaurantHistoryEntryWithNames[] = entries.map((e) => ({
    ...e,
    attendee_ids: e.attendee_ids as string[],
    attendees: (e.attendee_ids as string[]).map((id) => ({
      id,
      name: profileMap[id] ?? 'Miembro',
    })),
  }))

  return { success: true, data: enriched }
}
