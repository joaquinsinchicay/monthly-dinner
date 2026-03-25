'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Group } from '@/types'

const VALID_FREQUENCIES = ['mensual', 'quincenal', 'semanal'] as const
const VALID_DAYS_OF_WEEK = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'] as const

export async function createGroup(input: {
  name: string
  frequency: 'mensual' | 'quincenal' | 'semanal'
  meeting_day_of_week?: string
  meeting_day_of_month?: number
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

  // Validar consistencia de día según frecuencia (US-00c)
  if (input.frequency === 'mensual') {
    if (
      input.meeting_day_of_month === undefined ||
      input.meeting_day_of_month < 1 ||
      input.meeting_day_of_month > 31
    ) {
      return { success: false, error: 'El día del mes es obligatorio para frecuencia mensual (1–31)' }
    }
    if (input.meeting_day_of_week !== undefined) {
      return { success: false, error: 'No se puede especificar día de la semana para frecuencia mensual' }
    }
  } else {
    // semanal | quincenal
    if (
      !input.meeting_day_of_week ||
      !(VALID_DAYS_OF_WEEK as readonly string[]).includes(input.meeting_day_of_week)
    ) {
      return { success: false, error: 'El día de la semana es obligatorio' }
    }
    if (input.meeting_day_of_month !== undefined) {
      return { success: false, error: 'No se puede especificar día del mes para frecuencia semanal o quincenal' }
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

  const insertPayload =
    input.frequency === 'mensual'
      ? { name, created_by: user.id, frequency: input.frequency, meeting_day_of_month: input.meeting_day_of_month }
      : { name, created_by: user.id, frequency: input.frequency, meeting_day_of_week: input.meeting_day_of_week }

  // INSERT separado del SELECT para evitar que INSERT...RETURNING evalúe
  // groups: select members antes de que el trigger inserte la membresía.
  const { error: insertError } = await supabase.from('groups').insert(insertPayload)

  if (insertError) {
    console.error('[createGroup] Supabase insert error:', JSON.stringify(insertError, null, 2))
    return { success: false, error: 'No se pudo crear el grupo. Intentá de nuevo.' }
  }

  const { data: group, error: selectError } = await supabase
    .from('groups')
    .select('id, name, frequency, meeting_day_of_week, meeting_day_of_month, created_by, created_at, updated_at')
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
