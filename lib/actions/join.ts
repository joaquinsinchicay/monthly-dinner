'use server'

import { createClient } from '@/lib/supabase/server'
import { getInvitationLinkStatus } from '@/types'
import type { ActionResult } from '@/types'

interface InvitationLinkRow {
  id: string
  group_id: string
  group_name: string
  expires_at: string
  revoked_at: string | null
}

interface JoinResult {
  groupId: string
}

export async function joinGroup(token: string): Promise<ActionResult<JoinResult>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Debés iniciar sesión para unirte al grupo.' }
  }

  // Validar el token con RPC security definer (bypasea RLS — el invitado no es miembro aún)
  const { data: rows, error: rpcError } = await supabase
    .rpc('get_invitation_link_by_token', { p_token: token })

  if (rpcError || !rows || rows.length === 0) {
    // Scenario: Link expirado o inválido — token no existe
    return {
      success: false,
      error: 'El link de invitación no es válido. Pedile uno nuevo al administrador del grupo.',
    }
  }

  const link = rows[0] as InvitationLinkRow
  const status = getInvitationLinkStatus(link)

  // Scenario: Link expirado o inválido — token expirado o revocado
  if (status !== 'active') {
    return {
      success: false,
      error:
        status === 'expired'
          ? 'El link de invitación expiró. Pedile uno nuevo al administrador del grupo.'
          : 'El link de invitación fue revocado. Pedile uno nuevo al administrador del grupo.',
    }
  }

  // Scenario: Usuario ya miembro del grupo — no duplicar membresía
  const { data: existing } = await supabase
    .from('members')
    .select('id')
    .eq('group_id', link.group_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    // Ya es miembro — redirigir al panel sin error
    return { success: true, data: { groupId: link.group_id } }
  }

  // Insertar membresía — RLS "members: insert self" permite si auth.uid() = user_id
  const { error: insertError } = await supabase
    .from('members')
    .insert({ group_id: link.group_id, user_id: user.id, role: 'member' })

  if (insertError) {
    return {
      success: false,
      error: 'No se pudo unirte al grupo. Intentá de nuevo.',
    }
  }

  return { success: true, data: { groupId: link.group_id } }
}

// Obtener datos del grupo por token (para mostrar nombre en la página pública)
// Usa la misma RPC — accesible también para usuarios no autenticados (anon key)
export async function getGroupByToken(
  token: string
): Promise<ActionResult<{ groupId: string; groupName: string } | null>> {
  const supabase = createClient()

  const { data: rows, error } = await supabase
    .rpc('get_invitation_link_by_token', { p_token: token })

  if (error) {
    return { success: false, error: 'No se pudo verificar el link.' }
  }

  if (!rows || rows.length === 0) {
    return { success: true, data: null }
  }

  const link = rows[0] as InvitationLinkRow
  const status = getInvitationLinkStatus(link)

  if (status !== 'active') {
    return { success: true, data: null }
  }

  return {
    success: true,
    data: { groupId: link.group_id, groupName: link.group_name },
  }
}
