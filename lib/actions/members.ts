'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Member } from '@/types'

// Agrega un miembro guest al grupo (sin cuenta).
// Solo admins del grupo pueden ejecutar esta acción.
export async function addGuestMember(
  input: { group_id: string; display_name: string }
): Promise<ActionResult<Member>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado' }

  // Validar que el usuario autenticado sea admin del grupo
  const { data: adminCheck } = await supabase
    .from('members')
    .select('id')
    .eq('group_id', input.group_id)
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle()

  if (!adminCheck) return { success: false, error: 'No tenés permisos para agregar miembros' }

  const name = input.display_name.trim()
  if (!name) return { success: false, error: 'El nombre es obligatorio' }
  if (name.length > 80) return { success: false, error: 'El nombre no puede superar los 80 caracteres' }

  const { data, error } = await supabase
    .from('members')
    .insert({
      group_id: input.group_id,
      user_id: null,
      role: 'member',
      is_guest: true,
      display_name: name,
    })
    .select('id, group_id, user_id, role, is_guest, display_name, joined_at')
    .single()

  if (error || !data) {
    return { success: false, error: 'No se pudo agregar el miembro. Intentá de nuevo.' }
  }

  revalidatePath(`/dashboard/${input.group_id}/settings`)

  return {
    success: true,
    data: {
      id: data.id,
      group_id: data.group_id,
      user_id: data.user_id,
      role: data.role as 'member' | 'admin',
      is_guest: data.is_guest,
      display_name: data.display_name,
      joined_at: data.joined_at,
    },
  }
}

// Elimina un miembro guest del grupo.
// Solo admins del grupo pueden ejecutar esta acción.
export async function deleteGuestMember(
  input: { group_id: string; member_id: string }
): Promise<ActionResult<void>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado' }

  // Validar que el usuario autenticado sea admin del grupo
  const { data: adminCheck } = await supabase
    .from('members')
    .select('id')
    .eq('group_id', input.group_id)
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle()

  if (!adminCheck) return { success: false, error: 'No tenés permisos para eliminar miembros' }

  // Validar que el miembro a eliminar existe, es guest y pertenece al grupo
  const { data: guestCheck } = await supabase
    .from('members')
    .select('id')
    .eq('id', input.member_id)
    .eq('group_id', input.group_id)
    .eq('is_guest', true)
    .maybeSingle()

  if (!guestCheck) return { success: false, error: 'Miembro guest no encontrado en este grupo' }

  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', input.member_id)
    .eq('group_id', input.group_id)
    .eq('is_guest', true)

  if (error) {
    return { success: false, error: 'No se pudo eliminar el miembro. Intentá de nuevo.' }
  }

  revalidatePath(`/dashboard/${input.group_id}/settings`)

  return { success: true, data: undefined }
}
