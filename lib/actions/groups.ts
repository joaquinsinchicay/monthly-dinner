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
  const { data: existing, error: dupError } = await supabase
    .from('groups')
    .select('id, name')
    .eq('created_by', user.id)
    .ilike('name', name)
    .maybeSingle()

  if (dupError) {
    console.error('[createGroup] Supabase duplicate check error:', JSON.stringify(dupError, null, 2))
  }

  if (existing) {
    return {
      success: false,
      error: `Ya tenés un grupo llamado "${existing.name}". Probá con un nombre diferente.`,
    }
  }

  // Crear el grupo — el trigger on_group_created inserta al creador como admin
  // y on_group_created_invitation genera el link de invitación automáticamente
  const { data: group, error } = await supabase
    .from('groups')
    .insert({ name, created_by: user.id })
    .select('id, name, created_by, created_at, updated_at')
    .single()

  if (error || !group) {
    console.error('[createGroup] Supabase insert error:', JSON.stringify(error, null, 2))
    return { success: false, error: 'No se pudo crear el grupo. Intentá de nuevo.' }
  }

  revalidatePath('/dashboard')

  return { success: true, data: group }
}
