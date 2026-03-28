'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AttendanceCounts } from '@/lib/actions/events'
import { t } from '@/lib/t'

interface Props {
  eventId: string
  initialCounts: AttendanceCounts
}

// Scenario: Actualización en tiempo real — el contador se actualiza sin recargar.
// Requiere habilitar en Supabase:
//   alter publication supabase_realtime add table attendances;
export default function AttendanceSummary({ eventId, initialCounts }: Props) {
  const [counts, setCounts] = useState<AttendanceCounts>(initialCounts)

  useEffect(() => {
    const supabase = createClient()

    async function fetchCounts() {
      const { data } = await supabase
        .from('attendances')
        .select('status')
        .eq('event_id', eventId)

      if (data) {
        setCounts({
          va: data.filter((r) => r.status === 'va').length,
          no_va: data.filter((r) => r.status === 'no_va').length,
          tal_vez: data.filter((r) => r.status === 'tal_vez').length,
        })
      }
    }

    // Scenario: Actualización en tiempo real
    const channel = supabase
      .channel(`attendances-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendances',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          // Re-fetch on any INSERT/UPDATE/DELETE
          fetchCounts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId])

  const total = counts.va + counts.no_va + counts.tal_vez

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
          {t('group.attendanceSummary.title')}
        </p>
        {total > 0 && (
          <span className="text-[11px] text-[#585f6c]">{total} respuesta{total !== 1 ? 's' : ''}</span>
        )}
      </div>

      {total === 0 ? (
        <p className="text-sm text-[#585f6c]">{t('group.attendanceSummary.nooneYet')}</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {/* Va */}
          <div className="rounded-xl bg-[#f0ede9] px-3 py-2 text-center">
            <p className="text-[18px] font-semibold text-[#1c1b1b]">{counts.va}</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">{t('group.attendanceSummary.labels.va')}</p>
          </div>

          {/* Tal vez */}
          <div className="rounded-xl bg-[#f0ede9] px-3 py-2 text-center">
            <p className="text-[18px] font-semibold text-[#1c1b1b]">{counts.tal_vez}</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">{t('group.attendanceSummary.labels.tal_vez')}</p>
          </div>

          {/* No va */}
          <div className="rounded-xl bg-[#f0ede9] px-3 py-2 text-center">
            <p className="text-[18px] font-semibold text-[#1c1b1b]">{counts.no_va}</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">{t('group.attendanceSummary.labels.no_va')}</p>
          </div>
        </div>
      )}

      {/* Indicador de live — pulso cuando hay subscripción activa */}
      <div className="flex items-center gap-1.5 pt-1">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#004ac6] opacity-40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#004ac6]" />
        </span>
        <span className="text-[10px] text-[#585f6c]">{t('group.attendanceSummary.liveBadge')}</span>
      </div>
    </div>
  )
}
