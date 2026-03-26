'use server'

// NOTE — RLS audit (schema.sql verificado):
// ✅ UPDATE en groups WHERE id: cubierto por "groups: update admin"
// ✅ UPDATE en invitation_links WHERE group_id: cubierto por "invitation_links: update admin"
// ⚠️  UPDATE en members WHERE group_id para admin: NO existe política "update admin".
//    Solo existe "members: update own" (WHERE auth.uid() = user_id).
//    updateMemberRole hace UPDATE SET role — esto fallará para un admin actualizando a otro miembro.
//    Para producción, se necesita agregar una política: members: update admin.
//    Por ahora la acción verifica el rol manualmente y depende de que RLS permita el update.
//    Solución recomendada en schema.sql:
//      create policy "members: update admin"
//        on members for update
//        using (
//          exists (
//            select 1 from members m2
//            where m2.group_id = members.group_id
//              and m2.user_id  = auth.uid()
//              and m2.role     = 'admin'
//          )
//        );
// ⚠️  UPDATE en rotation WHERE group_id para admin: NO existe política "update admin".
//    Solo existe "rotation: update admin" — sí, EXISTE (verificado en schema.sql línea 340).
//    ✅ rotation: update admin cubierto.

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, MemberRole } from '@/types'

// ACTION 1 — updateGroupName
export async function updateGroupName(
  input: { group_id: string; name: string }
): Promise<ActionResult<{ id: string; name: string }>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado' }

  const name = input.name?.trim()
  if (!name) return { success: false, error: 'El nombre no puede estar vacío' }

  // Verificar que el usuario es admin del grupo
  const { data: membership } = await supabase
    .from('members')
    .select('role')
    .eq('group_id', input.group_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership || membership.role !== 'admin') {
    return { success: false, error: 'Solo los admins pueden modificar el grupo' }
  }

  const { data: group, error } = await supabase
    .from('groups')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', input.group_id)
    .select('id, name')
    .single()

  if (error || !group) {
    return { success: false, error: 'No se pudo actualizar el nombre. Intentá de nuevo.' }
  }

  revalidatePath(`/dashboard/${input.group_id}/settings`)
  revalidatePath(`/dashboard/${input.group_id}`)

  return { success: true, data: { id: group.id, name: group.name } }
}

// ACTION 2 — updateMemberRole
export async function updateMemberRole(
  input: { group_id: string; member_id: string; role: MemberRole }
): Promise<ActionResult<{ id: string; role: string }>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado' }

  // Verificar que el usuario es admin del grupo
  const { data: myMembership } = await supabase
    .from('members')
    .select('role')
    .eq('group_id', input.group_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!myMembership || myMembership.role !== 'admin') {
    return { success: false, error: 'Solo los admins pueden cambiar roles' }
  }

  // Si estamos degradando a 'member', verificar que no sea el único admin
  if (input.role === 'member') {
    const { count: adminCount } = await supabase
      .from('members')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', input.group_id)
      .eq('role', 'admin')

    if ((adminCount ?? 0) <= 1) {
      return { success: false, error: 'Debe haber al menos un admin en el grupo' }
    }
  }

  const { data: updated, error } = await supabase
    .from('members')
    .update({ role: input.role })
    .eq('id', input.member_id)
    .eq('group_id', input.group_id)
    .select('id, role')
    .single()

  if (error || !updated) {
    return { success: false, error: 'No se pudo actualizar el rol. Intentá de nuevo.' }
  }

  revalidatePath(`/dashboard/${input.group_id}/settings`)

  return { success: true, data: { id: updated.id, role: updated.role } }
}

// ACTION 3 — removeMember
export async function removeMember(
  input: { group_id: string; user_id: string }
): Promise<ActionResult> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado' }

  // No puede eliminar a sí mismo
  if (input.user_id === user.id) {
    return { success: false, error: 'No podés eliminarte a vos mismo del grupo' }
  }

  // Verificar que el usuario autenticado es admin del grupo
  const { data: myMembership } = await supabase
    .from('members')
    .select('role')
    .eq('group_id', input.group_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!myMembership || myMembership.role !== 'admin') {
    return { success: false, error: 'Solo los admins pueden eliminar miembros' }
  }

  // Obtener el member record del usuario a eliminar
  const { data: targetMember } = await supabase
    .from('members')
    .select('id, role')
    .eq('group_id', input.group_id)
    .eq('user_id', input.user_id)
    .eq('is_guest', false)
    .maybeSingle()

  if (!targetMember) {
    return { success: false, error: 'Miembro no encontrado en este grupo' }
  }

  // Si el miembro a eliminar es admin, verificar que quede al menos 1 admin
  if (targetMember.role === 'admin') {
    const { count: adminCount } = await supabase
      .from('members')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', input.group_id)
      .eq('role', 'admin')

    if ((adminCount ?? 0) <= 1) {
      return { success: false, error: 'No podés eliminar al único admin del grupo' }
    }
  }

  // Limpiar attendances del miembro en este grupo
  await supabase
    .from('attendances')
    .delete()
    .eq('member_id', targetMember.id)

  // Limpiar poll_votes del miembro en este grupo
  // (poll_votes usa user_id, filtrado por polls de este grupo via subquery)
  const { data: groupPolls } = await supabase
    .from('polls')
    .select('id')
    .eq('group_id', input.group_id)

  if (groupPolls && groupPolls.length > 0) {
    const pollIds = groupPolls.map((p) => p.id)
    await supabase
      .from('poll_votes')
      .delete()
      .eq('user_id', input.user_id)
      .in('poll_id', pollIds)
  }

  // Limpiar rotation futura del miembro en este grupo
  await supabase
    .from('rotation')
    .delete()
    .eq('group_id', input.group_id)
    .eq('user_id', input.user_id)
    .gte('month', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))

  // Eliminar el miembro
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', targetMember.id)
    .eq('group_id', input.group_id)

  if (error) {
    return { success: false, error: 'No se pudo eliminar el miembro. Intentá de nuevo.' }
  }

  revalidatePath(`/dashboard/${input.group_id}/settings`)
  revalidatePath(`/dashboard/${input.group_id}`)

  return { success: true, data: undefined }
}

// ACTION 4 — reorderRotation
// US-11c: uses ordered_rotation_ids (entry IDs) instead of ordered_user_ids
// to support accountless rotation slots (user_id may be null).
export async function reorderRotation(
  input: { group_id: string; ordered_rotation_ids: string[] }
): Promise<ActionResult<{ id: string; order_index: number }[]>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado' }

  // Verificar que el usuario es admin del grupo
  const { data: membership } = await supabase
    .from('members')
    .select('role')
    .eq('group_id', input.group_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership || membership.role !== 'admin') {
    return { success: false, error: 'Solo los admins pueden reordenar la rotación' }
  }

  // NOTE: `month` (date) is the ordering key — unique(group_id, month) enforced in DB.
  // Strategy: fetch existing records sorted by month, extract those months as the
  // canonical slot list, then reassign months to rotation entries in the new order.
  const { data: existing, error: fetchError } = await supabase
    .from('rotation')
    .select('id, month')
    .eq('group_id', input.group_id)
    .order('month', { ascending: true })

  if (fetchError || !existing) {
    return { success: false, error: 'No se pudo obtener la rotación. Intentá de nuevo.' }
  }

  if (existing.length === 0) {
    return { success: true, data: [] }
  }

  // The sorted months are the canonical slots — we preserve them, just reassign which
  // rotation entry gets which slot based on the new order.
  const sortedMonths = existing.map((r) => r.month)

  const updates: Array<{ id: string; month: string; order_index: number }> = []

  for (let i = 0; i < input.ordered_rotation_ids.length; i++) {
    const rotationId = input.ordered_rotation_ids[i]
    const assignedMonth = sortedMonths[i]
    if (!assignedMonth) continue
    updates.push({ id: rotationId, month: assignedMonth, order_index: i })
  }

  // Perform updates sequentially to respect unique(group_id, month) constraint.
  // Use a temporary sentinel month first to free up months before reassigning.
  const SENTINEL_PREFIX = '1900-0'
  for (let i = 0; i < updates.length; i++) {
    await supabase
      .from('rotation')
      .update({ month: `${SENTINEL_PREFIX}${i + 1}-01` })
      .eq('id', updates[i].id)
  }

  const results: { id: string; order_index: number }[] = []

  for (const upd of updates) {
    const { data: updated, error: updateError } = await supabase
      .from('rotation')
      .update({ month: upd.month })
      .eq('id', upd.id)
      .select('id, month')
      .single()

    if (updateError || !updated) {
      return { success: false, error: 'No se pudo guardar el orden. Intentá de nuevo.' }
    }

    results.push({ id: updated.id, order_index: upd.order_index })
  }

  revalidatePath(`/dashboard/${input.group_id}/settings`)

  return {
    success: true,
    data: results.sort((a, b) => a.order_index - b.order_index),
  }
}
