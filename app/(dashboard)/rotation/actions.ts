'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult, Rotation, RotationWithProfile } from '@/types'

// ── generateRandomRotation ────────────────────────────────────────────────────
// El cliente calcula el shuffle y los meses (para preview antes de confirmar).
// Esta action solo inserta las entradas pre-computadas.
// Soporta miembros con y sin cuenta (US-11c).
export async function generateRandomRotation(input: {
  group_id: string
  entries: {
    member_id: string
    user_id: string | null
    display_name: string | null
    month: string
  }[]
}): Promise<ActionResult<Rotation[]>> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { data: member } = await supabase
    .from('members')
    .select('role')
    .eq('group_id', input.group_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member || member.role !== 'admin') {
    return { success: false, error: 'Solo los admins pueden generar la rotación' }
  }

  if (!input.entries || input.entries.length === 0) {
    return { success: false, error: 'No hay entradas para insertar' }
  }

  // Validate: each entry must have user_id OR display_name
  const invalid = input.entries.some((e) => !e.user_id && !e.display_name)
  if (invalid) {
    return { success: false, error: 'Cada entrada debe tener user_id o display_name' }
  }

  const rows = input.entries.map((e) => ({
    group_id: input.group_id,
    member_id: e.member_id,
    user_id: e.user_id ?? null,
    display_name: e.user_id ? null : e.display_name,
    month: e.month,
  }))

  const { data: inserted, error } = await supabase
    .from('rotation')
    .insert(rows)
    .select('id, group_id, user_id, member_id, display_name, month, notified_at, created_at')

  if (error) {
    const isDuplicate = error.code === '23505'
    return {
      success: false,
      error: isDuplicate
        ? 'Ya existe una rotación para alguno de esos meses. Recargá la página e intentá de nuevo.'
        : error.message,
    }
  }

  revalidatePath(`/dashboard/${input.group_id}/settings`)
  return { success: true, data: inserted as Rotation[] }
}

// ── updateRotationEntry ───────────────────────────────────────────────────────
export async function updateRotationEntry(input: {
  rotation_id: string
  group_id: string
  member_id: string
  user_id: string | null
  display_name: string | null
}): Promise<ActionResult<Rotation>> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  if (!input.user_id && !input.display_name) {
    return { success: false, error: 'Se requiere user_id o display_name' }
  }

  const { data: member } = await supabase
    .from('members')
    .select('role')
    .eq('group_id', input.group_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member || member.role !== 'admin') {
    return { success: false, error: 'Solo los admins pueden editar la rotación' }
  }

  const { data: updated, error } = await supabase
    .from('rotation')
    .update({
      member_id: input.member_id,
      user_id: input.user_id ?? null,
      display_name: input.user_id ? null : input.display_name,
    })
    .eq('id', input.rotation_id)
    .eq('group_id', input.group_id)
    .select('id, group_id, user_id, member_id, display_name, month, notified_at, created_at')
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath(`/dashboard/${input.group_id}/settings`)
  return { success: true, data: updated as Rotation }
}

// ── getFullRotation ───────────────────────────────────────────────────────────
export async function getFullRotation(input: {
  group_id: string
}): Promise<ActionResult<RotationWithProfile[]>> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { data, error } = await supabase
    .from('rotation')
    .select('id, group_id, user_id, member_id, display_name, month, notified_at, created_at, profiles(id, email, full_name, avatar_url, created_at, updated_at)')
    .eq('group_id', input.group_id)
    .order('month', { ascending: true })

  if (error) return { success: false, error: error.message }

  const rotation = (data ?? []).map((r) => ({
    ...r,
    profile: r.profiles as unknown as RotationWithProfile['profile'],
  }))

  return { success: true, data: rotation as RotationWithProfile[] }
}

// ── linkAccountToRotationSlot ─────────────────────────────────────────────────
// US-11c: Vincula una cuenta real a un slot de rotación sin cuenta.
export async function linkAccountToRotationSlot(input: {
  rotation_id: string
  user_id: string
}): Promise<ActionResult<Rotation>> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  // Get the rotation entry to extract group_id
  const { data: slot, error: slotError } = await supabase
    .from('rotation')
    .select('id, group_id, user_id')
    .eq('id', input.rotation_id)
    .single()

  if (slotError || !slot) return { success: false, error: 'Slot de rotación no encontrado' }

  // Validate caller is admin of the group
  const { data: adminMember } = await supabase
    .from('members')
    .select('role')
    .eq('group_id', slot.group_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!adminMember || adminMember.role !== 'admin') {
    return { success: false, error: 'Solo los admins pueden vincular cuentas a la rotación' }
  }

  // Validate target user_id is a member of the group
  const { data: targetMember } = await supabase
    .from('members')
    .select('id')
    .eq('group_id', slot.group_id)
    .eq('user_id', input.user_id)
    .maybeSingle()

  if (!targetMember) {
    return { success: false, error: 'El usuario no pertenece a este grupo' }
  }

  // Validate target user_id is not already in another rotation slot in this group
  const { data: existingSlot } = await supabase
    .from('rotation')
    .select('id')
    .eq('group_id', slot.group_id)
    .eq('user_id', input.user_id)
    .neq('id', input.rotation_id)
    .maybeSingle()

  if (existingSlot) {
    return { success: false, error: 'Este miembro ya está asignado a otro mes en la rotación' }
  }

  const { data: updated, error } = await supabase
    .from('rotation')
    .update({ user_id: input.user_id, display_name: null, member_id: targetMember.id })
    .eq('id', input.rotation_id)
    .select('id, group_id, user_id, member_id, display_name, month, notified_at, created_at')
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath(`/dashboard/${slot.group_id}/settings`)
  return { success: true, data: updated as Rotation }
}

// ── getUnlinkedMembers ────────────────────────────────────────────────────────
// US-11c: Retorna miembros del grupo con cuenta cuyo user_id no está en ningún
// slot de rotación del grupo — candidatos disponibles para vincular.
export async function getUnlinkedMembers(input: {
  group_id: string
}): Promise<ActionResult<{ member_id: string; user_id: string; full_name: string | null; avatar_url: string | null }[]>> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  // Get all user_ids already in rotation for this group
  const { data: rotationSlots } = await supabase
    .from('rotation')
    .select('user_id')
    .eq('group_id', input.group_id)
    .not('user_id', 'is', null)

  const linkedUserIds = (rotationSlots ?? [])
    .map((r) => r.user_id)
    .filter(Boolean) as string[]

  // Get members with accounts not already in rotation
  const { data: membersRaw, error } = await supabase
    .from('members')
    .select('id, user_id, profiles(full_name, avatar_url)')
    .eq('group_id', input.group_id)
    .eq('is_guest', false)
    .not('user_id', 'is', null)

  if (error) return { success: false, error: error.message }

  const unlinked = (membersRaw ?? [])
    .filter((m) => m.user_id && !linkedUserIds.includes(m.user_id))
    .map((m) => {
      const profile = m.profiles as unknown as { full_name: string | null; avatar_url: string | null } | null
      return {
        member_id: m.id,
        user_id: m.user_id as string,
        full_name: profile?.full_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
      }
    })

  return { success: true, data: unlinked }
}
