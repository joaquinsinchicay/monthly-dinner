'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

export interface OrganizerInfo {
  userId: string
  fullName: string | null
  avatarUrl: string | null
  month: string // 'YYYY-MM-DD' — primer día del mes
}

// Retorna el organizador asignado para el próximo mes del grupo.
// Retorna null si la rotación del próximo mes aún no fue asignada.
export async function getNextOrganizer(
  groupId: string
): Promise<ActionResult<OrganizerInfo | null>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado' }

  const now = new Date()
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
    .toISOString()
    .split('T')[0]

  const { data, error } = await supabase
    .from('rotation')
    .select('user_id, month, profiles(full_name, avatar_url)')
    .eq('group_id', groupId)
    .eq('month', nextMonth)
    .maybeSingle()

  if (error) {
    return { success: false, error: 'No se pudo obtener el próximo organizador.' }
  }

  if (!data) {
    return { success: true, data: null }
  }

  const profile = (data.profiles as unknown) as { full_name: string | null; avatar_url: string | null } | null

  return {
    success: true,
    data: {
      userId: data.user_id,
      fullName: profile?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      month: data.month,
    },
  }
}

// Retorna el organizador asignado para el mes actual del grupo.
// Retorna null si la rotación aún no fue configurada para este mes.
export async function getCurrentOrganizer(
  groupId: string
): Promise<ActionResult<OrganizerInfo | null>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado' }

  // Primer día del mes actual — formato requerido por la columna `month` (date)
  const now = new Date()
  const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .split('T')[0]

  const { data, error } = await supabase
    .from('rotation')
    .select('user_id, month, profiles(full_name, avatar_url)')
    .eq('group_id', groupId)
    .eq('month', month)
    .maybeSingle()

  if (error) {
    return { success: false, error: 'No se pudo obtener el organizador del mes.' }
  }

  if (!data) {
    // Scenario: Sin organizador asignado — rotación no configurada para este mes
    return { success: true, data: null }
  }

  const profile = (data.profiles as unknown) as { full_name: string | null; avatar_url: string | null } | null

  return {
    success: true,
    data: {
      userId: data.user_id,
      fullName: profile?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      month: data.month,
    },
  }
}
