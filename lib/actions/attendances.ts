'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

export type AttendanceStatus = 'va' | 'no_va' | 'tal_vez'

export interface UserAttendance {
  id: string
  status: AttendanceStatus
  updated_at: string
}

// Scenario: Confirmación exitosa — INSERT cuando no hay fila previa.
// Scenario: Cambio de estado — UPDATE cuando ya existe, via upsert.
// Scenario: Estado "Tal vez" — mismo flujo, status distinto.
// Scenario: Confirmación después del evento — rechaza si status = 'closed'.
export async function upsertAttendance(
  eventId: string,
  status: AttendanceStatus
): Promise<ActionResult<void>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado' }

  // Scenario: Confirmación después del evento — validar que el evento no está cerrado
  const { data: event } = await supabase
    .from('events')
    .select('status')
    .eq('id', eventId)
    .maybeSingle()

  if (!event) return { success: false, error: 'Evento no encontrado.' }
  if (event.status === 'closed') {
    return { success: false, error: 'No se puede modificar la asistencia de un evento cerrado.' }
  }

  // UPSERT — INSERT o UPDATE según constraint unique (event_id, member_id)
  const { error } = await supabase
    .from('attendances')
    .upsert(
      {
        event_id: eventId,
        member_id: user.id,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'event_id,member_id' }
    )

  if (error) {
    return { success: false, error: 'No se pudo guardar tu confirmación. Intentá de nuevo.' }
  }

  return { success: true, data: undefined }
}

export interface AttendanceMember {
  id: string
  name: string
}

export interface AttendanceDetails {
  va: AttendanceMember[]
  no_va: AttendanceMember[]
  tal_vez: AttendanceMember[]
  sin_responder: AttendanceMember[]
  total_members: number
}

// Scenario: Resumen completo visible — names por estado + sin_responder.
// Scenario: Todos confirmaron — sin_responder.length === 0.
// Requiere política RLS "profiles: select group members" activa en Supabase.
export async function getAttendanceDetails(
  eventId: string,
  groupId: string
): Promise<ActionResult<AttendanceDetails>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado' }

  // Confirmaciones del evento con nombre del miembro
  const { data: attendances, error: aError } = await supabase
    .from('attendances')
    .select('member_id, status, profiles(full_name)')
    .eq('event_id', eventId)

  if (aError) return { success: false, error: 'No se pudo obtener las confirmaciones.' }

  // Todos los miembros del grupo (para calcular sin_responder)
  const { data: members, error: mError } = await supabase
    .from('members')
    .select('user_id, profiles(full_name)')
    .eq('group_id', groupId)

  if (mError) return { success: false, error: 'No se pudo obtener los miembros del grupo.' }

  function toMember(
    userId: string,
    profile: unknown
  ): AttendanceMember {
    const p = profile as { full_name: string | null } | null
    return { id: userId, name: p?.full_name ?? 'Miembro' }
  }

  const rows = attendances ?? []
  const confirmedIds = new Set(rows.map((r) => r.member_id))

  return {
    success: true,
    data: {
      va: rows
        .filter((r) => r.status === 'va')
        .map((r) => toMember(r.member_id, r.profiles)),
      no_va: rows
        .filter((r) => r.status === 'no_va')
        .map((r) => toMember(r.member_id, r.profiles)),
      tal_vez: rows
        .filter((r) => r.status === 'tal_vez')
        .map((r) => toMember(r.member_id, r.profiles)),
      sin_responder: (members ?? [])
        .filter((m) => !confirmedIds.has(m.user_id))
        .map((m) => toMember(m.user_id, m.profiles)),
      total_members: (members ?? []).length,
    },
  }
}

// Retorna la confirmación del usuario autenticado para un evento, o null si no confirmó.
// Scenario: Notificación recibida con acción directa — detectar si el miembro ya confirmó.
// Scenario: Recordatorio por falta de respuesta — la ausencia de fila determina el reminder.
export async function getUserAttendance(
  eventId: string
): Promise<ActionResult<UserAttendance | null>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado' }

  const { data, error } = await supabase
    .from('attendances')
    .select('id, status, updated_at')
    .eq('event_id', eventId)
    .eq('member_id', user.id)
    .maybeSingle()

  if (error) return { success: false, error: 'No se pudo obtener la confirmación.' }

  return { success: true, data: data ?? null }
}
