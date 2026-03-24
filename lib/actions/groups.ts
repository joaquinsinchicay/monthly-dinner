'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Group } from '@/types'

export async function createGroup(
  formData: FormData
): Promise<ActionResult<Group>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'No autenticado' }
  }

  const name = (formData.get('name') as string)?.trim()

  if (!name) {
    return { success: false, error: 'El nombre del grupo es obligatorio' }
  }

  // Verificar nombre duplicado del mismo usuario (Scenario: Nombre duplicado del mismo usuario)
  const { data: existing } = await supabase
    .from('groups')
    .select('id, name')
    .eq('created_by', user.id)
    .ilike('name', name)
    .maybeSingle()

  if (existing) {
    return {
      success: false,
      error: `Ya tenés un grupo llamado "${existing.name}". Probá con un nombre diferente.`,
    }
  }

  // Crear el grupo — el trigger on_group_created inserta al creador como admin
  // y on_group_created_invitation genera el link de invitación automáticamente.
  // INSERT separado del SELECT para evitar que INSERT...RETURNING evalúe
  // groups: select members antes de que el trigger inserte la membresía.
  const { error: insertError } = await supabase
    .from('groups')
    .insert({ name, created_by: user.id })

  if (insertError) {
    console.error('[createGroup] Supabase insert error:', JSON.stringify(insertError, null, 2))
    return { success: false, error: 'No se pudo crear el grupo. Intentá de nuevo.' }
  }

  const { data: group, error: selectError } = await supabase
    .from('groups')
    .select('id, name, created_by, created_at, updated_at')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (selectError || !group) {
    console.error('[createGroup] Supabase select after insert error:', JSON.stringify(selectError, null, 2))
    return { success: false, error: 'No se pudo crear el grupo. Intentá de nuevo.' }
  }

  revalidatePath('/dashboard')

  return { success: true, data: group }
}
