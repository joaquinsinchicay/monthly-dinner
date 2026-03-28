'use server'

import { createClient } from '@/lib/supabase/server'
import { t } from '@/lib/t'
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
// Scenario: Admin confirma por guest — pasar member_id del guest (members.id).
export async function upsertAttendance(
  eventId: string,
  status: AttendanceStatus,
  guestMemberId?: string  // solo admins pueden pasar esto para confirmar por un guest
): Promise<ActionResult<void>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: t('common.notAuthenticated') }

  // Validar que el evento existe y no está cerrado
  const { data: event } = await supabase
    .from('events')
    .select('status, group_id')
    .eq('id', eventId)
    .maybeSingle()

  if (!event) return { success: false, error: t('errors.attendances.eventNotFound') }
  if (event.status === 'closed') {
    return { success: false, error: t('errors.attendances.closedEvent') }
  }

  let targetMemberId: string

  if (guestMemberId) {
    // Flujo admin → guest: validar que quien llama sea admin del grupo
    const { data: adminCheck } = await supabase
      .from('members')
      .select('id')
      .eq('group_id', event.group_id)
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!adminCheck) {
      return { success: false, error: t('errors.attendances.notAdminForGuest') }
    }

    // Validar que el member_id es guest y pertenece al grupo del evento
    const { data: guestMember } = await supabase
      .from('members')
      .select('id')
      .eq('id', guestMemberId)
      .eq('group_id', event.group_id)
      .eq('is_guest', true)
      .maybeSingle()

    if (!guestMember) {
      return { success: false, error: t('errors.attendances.guestNotFound') }
    }

    targetMemberId = guestMember.id
  } else {
    // Flujo normal: el usuario confirma por sí mismo — buscar su members.id
    const { data: selfMember } = await supabase
      .from('members')
      .select('id')
      .eq('group_id', event.group_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!selfMember) {
      return { success: false, error: t('errors.attendances.notMember') }
    }

    targetMemberId = selfMember.id
  }

  const { error } = await supabase
    .from('attendances')
    .upsert(
      {
        event_id: eventId,
        member_id: targetMemberId,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'event_id,member_id' }
    )

  if (error) {
    return { success: false, error: t('errors.attendances.saveFailed') }
  }

  return { success: true, data: undefined }
}

export interface AttendanceMember {
  id: string
  name: string
  is_guest?: boolean
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
// Soporta guests: join a través de members → profiles (LEFT JOIN para guests sin perfil).
export async function getAttendanceDetails(
  eventId: string,
  groupId: string
): Promise<ActionResult<AttendanceDetails>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: t('common.notAuthenticated') }

  // Confirmaciones del evento — join a través de members para soportar guests
  const { data: attendances, error: aError } = await supabase
    .from('attendances')
    .select(`
      member_id,
      status,
      members (
        id,
        is_guest,
        display_name,
        profiles (
          full_name
        )
      )
    `)
    .eq('event_id', eventId)

  if (aError) return { success: false, error: t('errors.attendances.confirmationsFetchFailed') }

  // Todos los miembros del grupo (para calcular sin_responder)
  const { data: members, error: mError } = await supabase
    .from('members')
    .select('id, is_guest, display_name, profiles(full_name)')
    .eq('group_id', groupId)

  if (mError) return { success: false, error: t('errors.attendances.membersFetchFailed') }

  function toMember(memberId: string, memberData: unknown): AttendanceMember {
    const m = memberData as {
      id: string
      is_guest: boolean
      display_name: string | null
      profiles: { full_name: string | null } | null
    } | null

    if (m?.is_guest && m.display_name) {
      return { id: memberId, name: m.display_name, is_guest: true }
    }
    return {
      id: memberId,
      name: (m?.profiles as { full_name: string | null } | null)?.full_name ?? 'Miembro',
      is_guest: false,
    }
  }

  const rows = attendances ?? []
  const confirmedIds = new Set(rows.map((r) => r.member_id))

  return {
    success: true,
    data: {
      va: rows
        .filter((r) => r.status === 'va')
        .map((r) => toMember(r.member_id, r.members)),
      no_va: rows
        .filter((r) => r.status === 'no_va')
        .map((r) => toMember(r.member_id, r.members)),
      tal_vez: rows
        .filter((r) => r.status === 'tal_vez')
        .map((r) => toMember(r.member_id, r.members)),
      sin_responder: (members ?? [])
        .filter((m) => !confirmedIds.has(m.id))
        .map((m) => {
          const p = m.profiles as unknown as { full_name: string | null } | null
          if (m.is_guest && m.display_name) {
            return { id: m.id, name: m.display_name, is_guest: true }
          }
          return { id: m.id, name: p?.full_name ?? 'Miembro', is_guest: false }
        }),
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

  if (!user) return { success: false, error: t('common.notAuthenticated') }

  // Obtener el members.id del usuario para buscar su attendance
  // Primero necesitamos el group_id del evento
  const { data: event } = await supabase
    .from('events')
    .select('group_id')
    .eq('id', eventId)
    .maybeSingle()

  if (!event) return { success: false, error: t('errors.attendances.eventNotFound') }

  const { data: memberRow } = await supabase
    .from('members')
    .select('id')
    .eq('group_id', event.group_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!memberRow) return { success: true, data: null }

  const { data, error } = await supabase
    .from('attendances')
    .select('id, status, updated_at')
    .eq('event_id', eventId)
    .eq('member_id', memberRow.id)
    .maybeSingle()

  if (error) return { success: false, error: t('errors.attendances.fetchFailed') }

  return { success: true, data: data ?? null }
}
