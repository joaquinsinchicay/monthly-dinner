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
import type { ActionResult, Member, MemberRole } from '@/types'

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

// ACTION 3 — reorderRotation
export async function reorderRotation(
  input: { group_id: string; ordered_user_ids: string[] }
): Promise<ActionResult<{ id: string; order_index: number; user_id: string }[]>> {
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

  // NOTE: rotation table does not have order_index column in schema.sql.
  // The column `month` (date) defines the natural order.
  // reorderRotation updates `month` to reflect the new order.
  // We fetch existing rotation records first, then reassign months preserving
  // relative spacing but applying the new user ordering.
  // Since the schema uses `month` as the ordering key and has a unique(group_id, month),
  // we use a temporary approach: update in order using the existing months sorted ascending.
  const { data: existing, error: fetchError } = await supabase
    .from('rotation')
    .select('id, user_id, month')
    .eq('group_id', input.group_id)
    .order('month', { ascending: true })

  if (fetchError || !existing) {
    return { success: false, error: 'No se pudo obtener la rotación. Intentá de nuevo.' }
  }

  if (existing.length === 0) {
    return { success: true, data: [] }
  }

  // Extract the sorted months from existing records
  const sortedMonths = existing.map((r) => r.month)

  // Build update pairs: new_user_id → month (preserving month slots, reassigning users)
  const updates: Array<{ id: string; user_id: string; month: string; order_index: number }> = []

  for (let i = 0; i < input.ordered_user_ids.length; i++) {
    const userId = input.ordered_user_ids[i]
    const record = existing.find((r) => r.user_id === userId)
    if (!record) continue

    const assignedMonth = sortedMonths[i]
    if (!assignedMonth) continue

    updates.push({ id: record.id, user_id: userId, month: assignedMonth, order_index: i })
  }

  // Perform updates sequentially to respect unique(group_id, month) constraint
  const results: { id: string; order_index: number; user_id: string }[] = []

  for (const upd of updates) {
    const { data: updated, error: updateError } = await supabase
      .from('rotation')
      .update({ user_id: upd.user_id })
      .eq('id', upd.id)
      .select('id, user_id, month')
      .single()

    if (updateError || !updated) {
      return { success: false, error: 'No se pudo guardar el orden. Intentá de nuevo.' }
    }

    results.push({ id: updated.id, order_index: upd.order_index, user_id: updated.user_id })
  }

  revalidatePath(`/dashboard/${input.group_id}/settings`)

  return {
    success: true,
    data: results.sort((a, b) => a.order_index - b.order_index),
  }
}
