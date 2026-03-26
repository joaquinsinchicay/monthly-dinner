'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult, Rotation, RotationWithProfile } from '@/types'

// ── generateRandomRotation ────────────────────────────────────────────────────
// El cliente calcula el shuffle y los meses (para preview antes de confirmar).
// Esta action solo inserta las entradas pre-computadas.
export async function generateRandomRotation(input: {
  group_id: string
  entries: { user_id: string; month: string }[]
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

  const rows = input.entries.map((e) => ({
    group_id: input.group_id,
    user_id: e.user_id,
    month: e.month,
  }))

  const { data: inserted, error } = await supabase
    .from('rotation')
    .insert(rows)
    .select('id, group_id, user_id, month, notified_at, created_at')

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
  user_id: string
  group_id: string
}): Promise<ActionResult<Rotation>> {
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
    return { success: false, error: 'Solo los admins pueden editar la rotación' }
  }

  const { data: updated, error } = await supabase
    .from('rotation')
    .update({ user_id: input.user_id })
    .eq('id', input.rotation_id)
    .eq('group_id', input.group_id)
    .select('id, group_id, user_id, month, notified_at, created_at')
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
    .select('id, group_id, user_id, month, notified_at, created_at, profiles(id, email, full_name, avatar_url, created_at, updated_at)')
    .eq('group_id', input.group_id)
    .order('month', { ascending: true })

  if (error) return { success: false, error: error.message }

  const rotation = (data ?? []).map((r) => ({
    ...r,
    profile: r.profiles as unknown as RotationWithProfile['profile'],
  }))

  return { success: true, data: rotation as RotationWithProfile[] }
}
