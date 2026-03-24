'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

export type AttendanceStatus = 'va' | 'no_va' | 'tal_vez'

export interface UserAttendance {
  id: string
  status: AttendanceStatus
  updated_at: string
}

// Scenario: Confirmación exitosa — INSERT cuando no hay fila previa.
// Scenario: Cambio de estado — UPDATE cuando ya existe, via upsert.
// Scenario: Estado "Tal vez" — mismo flujo, status distinto.
// Scenario: Confirmación después del evento — rechaza si status = 'closed'.
export async function upsertAttendance(
  eventId: string,
  status: AttendanceStatus
): Promise<ActionResult<void>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado' }

  // Scenario: Confirmación después del evento — validar que el evento no está cerrado
  const { data: event } = await supabase
    .from('events')
    .select('status')
    .eq('id', eventId)
    .maybeSingle()

  if (!event) return { success: false, error: 'Evento no encontrado.' }
  if (event.status === 'closed') {
    return { success: false, error: 'No se puede modificar la asistencia de un evento cerrado.' }
  }

  // UPSERT — INSERT o UPDATE según constraint unique (event_id, member_id)
  const { error } = await supabase
    .from('attendances')
    .upsert(
      {
        event_id: eventId,
        member_id: user.id,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'event_id,member_id' }
    )

  if (error) {
    return { success: false, error: 'No se pudo guardar tu confirmación. Intentá de nuevo.' }
  }

  return { success: true, data: undefined }
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
