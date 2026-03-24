'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

export interface PollOption {
  id: string
  poll_id: string
  label: string
  created_at: string
}

export interface Poll {
  id: string
  event_id: string
  group_id: string
  created_by: string
  status: 'open' | 'closed'
  closes_at: string
  closed_at: string | null
  created_at: string
}

export interface PollWithOptions extends Poll {
  options: PollOption[]
}

export interface PollVotesResult {
  counts: Record<string, number>   // optionId → vote count
  total: number
  userVoteOptionId: string | null  // null = no votó
}

// Retorna conteos de votos por opción y el voto del usuario actual.
// Scenario: Voto registrado — porcentajes iniciales.
// Scenario: Cambio de voto — re-fetch tras realtime event.
// Scenario: Resultado final — conteos cuando la votación cerró.
export async function getPollVotes(
  pollId: string
): Promise<ActionResult<PollVotesResult>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado' }

  const { data: votes, error } = await supabase
    .from('poll_votes')
    .select('option_id, user_id')
    .eq('poll_id', pollId)

  if (error) return { success: false, error: 'No se pudo obtener los votos.' }

  const rows = votes ?? []
  const counts: Record<string, number> = {}
  for (const row of rows) {
    counts[row.option_id] = (counts[row.option_id] ?? 0) + 1
  }

  const userVote = rows.find((r) => r.user_id === user.id)

  return {
    success: true,
    data: {
      counts,
      total: rows.length,
      userVoteOptionId: userVote?.option_id ?? null,
    },
  }
}

// Scenario: Voto registrado — INSERT cuando no hay voto previo.
// Scenario: Cambio de voto dentro del plazo — UPSERT actualiza el voto existente.
// Scenario: Intento de votar fuera del plazo — rechaza si closed o closes_at en el pasado.
export async function castVote(
  pollId: string,
  optionId: string
): Promise<ActionResult<void>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado' }

  // Validar que la votación existe y está abierta
  const { data: poll } = await supabase
    .from('polls')
    .select('status, closes_at')
    .eq('id', pollId)
    .maybeSingle()

  if (!poll) return { success: false, error: 'Votación no encontrada.' }

  // Scenario: Intento de votar fuera del plazo
  const isClosed = poll.status === 'closed' || new Date(poll.closes_at) <= new Date()
  if (isClosed) {
    return { success: false, error: 'La votación ya cerró. No se puede emitir o cambiar el voto.' }
  }

  // UPSERT — INSERT o UPDATE según constraint unique (poll_id, user_id)
  const { error } = await supabase
    .from('poll_votes')
    .upsert(
      {
        poll_id: pollId,
        option_id: optionId,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'poll_id,user_id' }
    )

  if (error) return { success: false, error: 'No se pudo registrar el voto. Intentá de nuevo.' }

  return { success: true, data: undefined }
}

// Retorna la votación del evento con sus opciones, o null si no existe.
export async function getPollWithOptions(
  eventId: string
): Promise<ActionResult<PollWithOptions | null>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado' }

  const { data: poll, error } = await supabase
    .from('polls')
    .select('id, event_id, group_id, created_by, status, closes_at, closed_at, created_at')
    .eq('event_id', eventId)
    .maybeSingle()

  if (error) return { success: false, error: 'No se pudo obtener la votación.' }
  if (!poll) return { success: true, data: null }

  const { data: options } = await supabase
    .from('poll_options')
    .select('id, poll_id, label, created_at')
    .eq('poll_id', poll.id)
    .order('created_at')

  return { success: true, data: { ...poll, options: options ?? [] } }
}

// Scenario: Votación creada exitosamente — INSERT poll + options, status='open'.
// Scenario: Menos de 2 opciones — validación server-side.
// Scenario: Fecha de cierre en el pasado — closes_at debe ser futuro.
// Scenario: Solo una votación activa por evento — check previo al INSERT.
export async function createPoll(
  eventId: string,
  groupId: string,
  options: string[],
  closesAt: string
): Promise<ActionResult<PollWithOptions>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado' }

  // Validar que el usuario es el organizador del evento
  const { data: event } = await supabase
    .from('events')
    .select('organizer_id')
    .eq('id', eventId)
    .maybeSingle()

  if (!event) return { success: false, error: 'Evento no encontrado.' }
  if (event.organizer_id !== user.id) {
    return { success: false, error: 'Solo el organizador puede abrir la votación.' }
  }

  // Scenario: Menos de 2 opciones
  const validOptions = options.map((o) => o.trim()).filter(Boolean)
  if (validOptions.length < 2) {
    return { success: false, error: 'Se necesitan al menos 2 opciones para abrir la votación.' }
  }

  // Scenario: Fecha de cierre en el pasado
  const closesAtDate = new Date(closesAt)
  if (isNaN(closesAtDate.getTime()) || closesAtDate <= new Date()) {
    return { success: false, error: 'La fecha de cierre debe ser en el futuro.' }
  }

  // Scenario: Solo una votación activa por evento
  const { data: existing } = await supabase
    .from('polls')
    .select('id')
    .eq('event_id', eventId)
    .maybeSingle()

  if (existing) {
    return {
      success: false,
      error: 'Ya existe una votación para este evento. Podés editarla desde el panel.',
    }
  }

  // INSERT poll — separado del SELECT (patrón establecido, evita RETURNING race con RLS)
  const { error: pollError } = await supabase.from('polls').insert({
    event_id: eventId,
    group_id: groupId,
    created_by: user.id,
    closes_at: closesAtDate.toISOString(),
  })

  if (pollError) return { success: false, error: 'No se pudo crear la votación. Intentá de nuevo.' }

  // SELECT poll recién creado
  const { data: poll, error: selectError } = await supabase
    .from('polls')
    .select('id, event_id, group_id, created_by, status, closes_at, closed_at, created_at')
    .eq('event_id', eventId)
    .single()

  if (selectError || !poll) {
    return { success: false, error: 'Votación creada pero no se pudo obtener los datos.' }
  }

  // INSERT opciones
  const { error: optError } = await supabase
    .from('poll_options')
    .insert(validOptions.map((label) => ({ poll_id: poll.id, label })))

  if (optError) return { success: false, error: 'No se pudieron guardar las opciones.' }

  // SELECT opciones
  const { data: pollOptions } = await supabase
    .from('poll_options')
    .select('id, poll_id, label, created_at')
    .eq('poll_id', poll.id)
    .order('created_at')

  return { success: true, data: { ...poll, options: pollOptions ?? [] } }
}
