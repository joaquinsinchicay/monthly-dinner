'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

export type AttendanceStatus = 'va' | 'no_va' | 'tal_vez'

export interface UserAttendance {
  id: string
  status: AttendanceStatus
  updated_at: string
}

// Retorna la confirmación del usuario autenticado para un evento, o null si no confirmó.
// Scenario: Notificación recibida con acción directa — detectar si el miembro ya confirmó.
// Scenario: Recordatorio por falta de respuesta — la ausencia de fila determina el reminder.
export async function getUserAttendance(
  eventId: string
): Promise<ActionResult<UserAttendance | null>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado' }

  const { data, error } = await supabase
    .from('attendances')
    .select('id, status, updated_at')
    .eq('event_id', eventId)
    .eq('member_id', user.id)
    .maybeSingle()

  if (error) return { success: false, error: 'No se pudo obtener la confirmación.' }

  return { success: true, data: data ?? null }
}
