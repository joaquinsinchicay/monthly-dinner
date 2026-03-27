'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { t } from '@/lib/t'
import { getInvitationLinkStatus } from '@/types'
import type { ActionResult, InvitationLink } from '@/types'

// Obtener el link activo del grupo (el más reciente no revocado ni expirado)
export async function getActiveInvitationLink(
  groupId: string
): Promise<ActionResult<InvitationLink | null>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: t('common.notAuthenticated') }

  const { data: links, error } = await supabase
    .from('invitation_links')
    .select('id, group_id, token, created_by, expires_at, revoked_at, created_at')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: t('errors.invitationLinks.getLinksError') }

  const active = (links ?? []).find(
    (l) => getInvitationLinkStatus(l) === 'active'
  ) ?? null

  return { success: true, data: active }
}

// Generar un nuevo link de invitación (admin only — validado por RLS)
export async function generateInvitationLink(
  groupId: string
): Promise<ActionResult<InvitationLink>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: t('common.notAuthenticated') }

  const { data: link, error } = await supabase
    .from('invitation_links')
    .insert({ group_id: groupId, created_by: user.id })
    .select('id, group_id, token, created_by, expires_at, revoked_at, created_at')
    .single()

  if (error || !link) {
    return { success: false, error: t('errors.invitationLinks.generateFailed') }
  }

  revalidatePath('/dashboard')

  return { success: true, data: link }
}

// Revocar un link activo (admin only — validado por RLS)
export async function revokeInvitationLink(
  linkId: string
): Promise<ActionResult<void>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: t('common.notAuthenticated') }

  const { error } = await supabase
    .from('invitation_links')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', linkId)

  if (error) {
    return { success: false, error: t('errors.invitationLinks.revokeFailed') }
  }

  revalidatePath('/dashboard')

  return { success: true, data: undefined }
}
