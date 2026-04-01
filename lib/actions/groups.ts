'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { t } from '@/lib/t'
import { getNextEventDates, toMonthKey } from '@/lib/utils/event-dates'
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
    return { success: false, error: t('common.notAuthenticated') }
  }

  const name = input.name?.trim()

  if (!name) {
    return { success: false, error: t('errors.groups.nameRequired') }
  }

  if (!VALID_FREQUENCIES.includes(input.frequency)) {
    return { success: false, error: t('errors.groups.invalidFrequency') }
  }

  if (
    !input.meeting_day_of_week ||
    !(VALID_DAYS_OF_WEEK as readonly string[]).includes(input.meeting_day_of_week)
  ) {
    return { success: false, error: t('errors.groups.dayRequired') }
  }

  // Validar meeting_week según frecuencia (US-00c cascada)
  if (input.frequency === 'semanal') {
    if (input.meeting_week !== undefined) {
      return { success: false, error: t('errors.groups.weekNotRequiredForSemanal') }
    }
  } else if (input.frequency === 'mensual') {
    if (
      input.meeting_week === undefined ||
      ![1, 2, 3, 4, 5].includes(input.meeting_week)
    ) {
      return { success: false, error: t('errors.groups.weekRequiredForMensual') }
    }
  } else if (input.frequency === 'quincenal') {
    if (
      input.meeting_week === undefined ||
      ![1, 2].includes(input.meeting_week)
    ) {
      return { success: false, error: t('errors.groups.weekRequiredForQuincenal') }
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
      error: t('errors.groups.duplicateName', { name: existing.name }),
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
    return { success: false, error: t('errors.groups.createFailed') }
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
    return { success: false, error: t('errors.groups.createFailed') }
  }

  // Generar los próximos 3 eventos automáticamente (US-03 Scenario 11)
  try {
    const eventDates = getNextEventDates(
      group.frequency,
      group.meeting_week ?? null,
      group.meeting_day_of_week!,
      new Date(),
      3,
    )

    const eventSlots = eventDates.map(date => ({
      group_id: group.id,
      organizer_id: null,
      month: toMonthKey(date),
      status: 'pending' as const,
    }))

    const { error: eventsError } = await supabase
      .from('events')
      .insert(eventSlots)

    if (eventsError) {
      console.error('[createGroup] Error al generar eventos automáticos:', JSON.stringify(eventsError, null, 2))
      // No revertimos el grupo — se creó correctamente. Los eventos pueden regenerarse.
    }
  } catch (err) {
    console.error('[createGroup] Excepción al calcular fechas de eventos:', err)
  }

  revalidatePath('/dashboard')

  return { success: true, data: group }
}

export async function isGroupConfigured(groupId: string): Promise<ActionResult<boolean>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: t('common.notAuthenticated') }

  // Condición 1: al menos 2 miembros
  const { count: memberCount } = await supabase
    .from('members')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', groupId)

  if ((memberCount ?? 0) < 2) return { success: true, data: false }

  // Condición 2: rotación configurada (al menos 1 fila)
  const { count: rotationCount } = await supabase
    .from('rotation')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', groupId)

  return { success: true, data: (rotationCount ?? 0) > 0 }
}
