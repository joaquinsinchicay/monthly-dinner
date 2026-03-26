'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Group } from '@/types'

const VALID_FREQUENCIES = ['mensual', 'quincenal', 'semanal'] as const
const VALID_DAYS_OF_WEEK = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'] as const

export async function createGroup(input: {
  name: string
  frequency: 'mensual' | 'quincenal' | 'semanal'
  meeting_day_of_week: 'lunes' | 'martes' | 'miércoles' | 'jueves' | 'viernes' | 'sábado' | 'domingo'
  meeting_week?: number
}): Promise<ActionResult<Group>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'No autenticado' }
  }

  const name = input.name?.trim()

  if (!name) {
    return { success: false, error: 'El nombre del grupo es obligatorio' }
  }

  if (!VALID_FREQUENCIES.includes(input.frequency)) {
    return { success: false, error: 'La frecuencia seleccionada no es válida' }
  }

  if (
    !input.meeting_day_of_week ||
    !(VALID_DAYS_OF_WEEK as readonly string[]).includes(input.meeting_day_of_week)
  ) {
    return { success: false, error: 'El día de la semana es obligatorio' }
  }

  // Validar meeting_week según frecuencia (US-00c cascada)
  if (input.frequency === 'semanal') {
    if (input.meeting_week !== undefined) {
      return { success: false, error: 'La frecuencia semanal no requiere semana del mes' }
    }
  } else if (input.frequency === 'mensual') {
    if (
      input.meeting_week === undefined ||
      ![1, 2, 3, 4, 5].includes(input.meeting_week)
    ) {
      return { success: false, error: 'La frecuencia mensual requiere seleccionar la semana del mes (1° a Última)' }
    }
  } else if (input.frequency === 'quincenal') {
    if (
      input.meeting_week === undefined ||
      ![1, 2].includes(input.meeting_week)
    ) {
      return { success: false, error: 'La frecuencia quincenal requiere seleccionar "1° y 3°" o "2° y 4°"' }
    }
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

  const insertPayload = {
    name,
    created_by: user.id,
    frequency: input.frequency,
    meeting_day_of_week: input.meeting_day_of_week,
    meeting_week: input.meeting_week ?? null,
  }

  // INSERT separado del SELECT para evitar que INSERT...RETURNING evalúe
  // groups: select members antes de que el trigger inserte la membresía.
  const { error: insertError } = await supabase.from('groups').insert(insertPayload)

  if (insertError) {
    console.error('[createGroup] Supabase insert error:', JSON.stringify(insertError, null, 2))
    return { success: false, error: 'No se pudo crear el grupo. Intentá de nuevo.' }
  }

  const { data: group, error: selectError } = await supabase
    .from('groups')
    .select('id, name, frequency, meeting_week, meeting_day_of_week, created_by, created_at, updated_at')
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
