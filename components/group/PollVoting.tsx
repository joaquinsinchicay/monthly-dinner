'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getPollVotes, castVote } from '@/lib/actions/polls'
import type { PollWithOptions, PollVotesResult } from '@/lib/actions/polls'

interface Props {
  poll: PollWithOptions
}

function isPollOpen(poll: PollWithOptions): boolean {
  return poll.status === 'open' && new Date(poll.closes_at) > new Date()
}

function PercentageBar({ count, total, selected }: { count: number; total: number; selected: boolean }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[#f0ede9]">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
            selected ? 'bg-[#004ac6]' : 'bg-[#c3c6d7]'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-[11px] font-semibold text-[#585f6c]">{pct}%</span>
    </div>
  )
}

// Scenario: Voto registrado — muestra opciones seleccionables + porcentajes.
// Scenario: Cambio de voto dentro del plazo — misma UI, botón cambia la selección.
// Scenario: Intento de votar fuera del plazo — UI read-only con resultado final.
// Scenario: Miembro que no votó antes del cierre — resultado final + badge "No participaste".
// Realtime: suscripción a poll_votes — re-fetch en cada INSERT/UPDATE/DELETE.
export default function PollVoting({ poll }: Props) {
  const [votesResult, setVotesResult] = useState<PollVotesResult | null>(null)
  const [optimisticVote, setOptimisticVote] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const open = isPollOpen(poll)

  async function fetchVotes() {
    const result = await getPollVotes(poll.id)
    if (result.success) {
      setVotesResult(result.data)
      setOptimisticVote(result.data.userVoteOptionId)
    }
  }

  useEffect(() => {
    fetchVotes()

    // Realtime: actualizar porcentajes cuando cualquier miembro vota
    // Requiere: alter publication supabase_realtime add table poll_votes;
    const supabase = createClient()
    const channel = supabase
      .channel(`poll-votes-${poll.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'poll_votes',
          filter: `poll_id=eq.${poll.id}`,
        },
        () => fetchVotes()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poll.id])

  function handleVote(optionId: string) {
    if (!open || isPending) return
    setError(null)
    setOptimisticVote(optionId)
    startTransition(async () => {
      const result = await castVote(poll.id, optionId)
      if (!result.success) {
        setError(result.error)
        setOptimisticVote(votesResult?.userVoteOptionId ?? null) // revert
      }
      // fetchVotes se dispara via realtime — no hace falta llamarlo explícitamente
    })
  }

  const counts = votesResult?.counts ?? {}
  const total = votesResult?.total ?? 0
  const userVoted = optimisticVote !== null

  // Scenario: Miembro que no votó antes del cierre
  const didNotParticipate = !open && !userVoted && votesResult !== null

  return (
    <div className="mt-4 space-y-2">

      {/* Resultado final / en curso */}
      {poll.options.map((opt) => {
        const isSelected = optimisticVote === opt.id
        const count = counts[opt.id] ?? 0
        const canClick = open && !isPending

        return (
          <div key={opt.id}>
            <button
              onClick={() => handleVote(opt.id)}
              disabled={!canClick}
              className={[
                'w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors',
                isSelected
                  ? 'bg-[#dce2f3] text-[#004ac6]'
                  : open
                    ? 'bg-[#f6f3f2] text-[#1c1b1b] hover:bg-[#f0ede9]'
                    : 'bg-[#f6f3f2] text-[#1c1b1b]',
                !canClick ? 'cursor-default' : 'cursor-pointer',
              ].join(' ')}
            >
              <div className="flex items-center justify-between">
                <span>{opt.label}</span>
                {(userVoted || !open) && (
                  <span className="text-[11px] font-semibold text-[#585f6c]">
                    {count} {count === 1 ? 'voto' : 'votos'}
                  </span>
                )}
              </div>
              {/* Scenario: porcentajes visibles después de votar o al cerrar */}
              {(userVoted || !open) && (
                <PercentageBar count={count} total={total} selected={isSelected} />
              )}
            </button>
          </div>
        )
      })}

      {error && (
        <p className="rounded-xl bg-[#ffdad6] px-4 py-2.5 text-sm text-[#ba1a1a]">{error}</p>
      )}

      {/* Scenario: Miembro que no votó antes del cierre */}
      {didNotParticipate && (
        <p className="rounded-xl bg-[#f0ede9] px-4 py-2.5 text-sm text-[#585f6c]">
          No participaste en esta votación.
        </p>
      )}

      {/* Indicador live — solo cuando la votación está abierta */}
      {open && (
        <div className="flex items-center gap-1.5 pt-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#004ac6] opacity-40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#004ac6]" />
          </span>
          <span className="text-[10px] text-[#585f6c]">En vivo</span>
        </div>
      )}

      {/* Prompt de acción cuando la votación está abierta y el usuario no votó */}
      {open && !userVoted && (
        <p className="text-xs text-[#585f6c]">Seleccioná tu opción preferida.</p>
      )}
    </div>
  )
}
