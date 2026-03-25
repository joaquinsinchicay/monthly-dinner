'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAttendanceDetails } from '@/lib/actions/attendances'
import type { AttendanceDetails, AttendanceMember } from '@/lib/actions/attendances'

interface Props {
  eventId: string
  groupId: string
}

// Scenario: Compartir resumen — genera texto listo para copiar
function buildShareText(details: AttendanceDetails): string {
  const lines: string[] = ['🍽️ Resumen de la cena\n']
  if (details.va.length > 0) {
    lines.push(`✅ Van (${details.va.length}): ${details.va.map((m) => m.name).join(', ')}`)
  }
  if (details.tal_vez.length > 0) {
    lines.push(`🤔 Tal vez (${details.tal_vez.length}): ${details.tal_vez.map((m) => m.name).join(', ')}`)
  }
  if (details.no_va.length > 0) {
    lines.push(`❌ No van (${details.no_va.length}): ${details.no_va.map((m) => m.name).join(', ')}`)
  }
  if (details.sin_responder.length > 0) {
    lines.push(`⏳ Sin responder (${details.sin_responder.length}): ${details.sin_responder.map((m) => m.name).join(', ')}`)
  }
  return lines.join('\n')
}

function MemberList({ members, label, colorClass }: {
  members: AttendanceMember[]
  label: string
  colorClass: string
}) {
  if (members.length === 0) return null
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
        {label} ({members.length})
      </p>
      <div className="flex flex-wrap gap-1.5">
        {members.map((m) => (
          <span
            key={m.id}
            className={`rounded-full px-3 py-1 text-xs font-medium ${colorClass}`}
          >
            {m.name}
          </span>
        ))}
      </div>
    </div>
  )
}

// Scenario: Resumen completo visible — Para el organizador, muestra nombres por categoría.
// Scenario: Todos confirmaron — sin_responder vacío → badge "Todos respondieron".
// Scenario: Compartir resumen — botón genera texto formateado para copiar.
// Actualización en tiempo real via supabase.channel() — mismo patrón que AttendanceSummary.
export default function AttendanceSummaryDetailed({ eventId, groupId }: Props) {
  const [details, setDetails] = useState<AttendanceDetails | null>(null)
  const [copied, setCopied] = useState(false)
  const [, startTransition] = useTransition()

  async function fetchDetails() {
    startTransition(async () => {
      const result = await getAttendanceDetails(eventId, groupId)
      if (result.success) setDetails(result.data)
    })
  }

  useEffect(() => {
    fetchDetails()

    // Realtime: re-fetch cuando cambian las confirmaciones
    const supabase = createClient()
    const channel = supabase
      .channel(`attendances-detailed-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendances',
          filter: `event_id=eq.${eventId}`,
        },
        () => fetchDetails()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, groupId])

  function handleShare() {
    if (!details) return
    const text = buildShareText(details)
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!details) {
    return (
      <div className="mt-4">
        <p className="text-sm text-[#585f6c]">Cargando confirmaciones…</p>
      </div>
    )
  }

  const allResponded = details.sin_responder.length === 0
  const totalConfirmed = details.va.length + details.no_va.length + details.tal_vez.length

  return (
    <div className="mt-4 space-y-3">

      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
          Confirmaciones
        </p>
        {/* Scenario: Todos confirmaron — badge indicativo */}
        {allResponded && totalConfirmed > 0 ? (
          <span className="rounded-full bg-[#6ffbbe] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.05em] text-[#006242]">
            Todos respondieron
          </span>
        ) : (
          totalConfirmed > 0 && (
            <span className="text-[11px] text-[#585f6c]">
              {totalConfirmed}/{details.total_members} respondieron
            </span>
          )
        )}
      </div>

      {totalConfirmed === 0 && details.sin_responder.length === 0 ? (
        <p className="text-sm text-[#585f6c]">Nadie en el grupo todavía.</p>
      ) : totalConfirmed === 0 ? (
        <p className="text-sm text-[#585f6c]">Nadie confirmó todavía.</p>
      ) : null}

      {/* Scenario: Resumen completo visible — Van, No van, Tal vez con nombres */}
      <MemberList members={details.va} label="Van" colorClass="bg-[#6ffbbe] text-[#006242]" />
      <MemberList members={details.tal_vez} label="Tal vez" colorClass="bg-[#dce2f3] text-[#004ac6]" />
      <MemberList members={details.no_va} label="No van" colorClass="bg-[#ffdad6] text-[#ba1a1a]" />

      {/* Scenario: Sin responder — solo visible cuando no todos confirmaron */}
      {!allResponded && details.sin_responder.length > 0 && (
        <MemberList
          members={details.sin_responder}
          label="Sin responder"
          colorClass="bg-[#f0ede9] text-[#585f6c]"
        />
      )}

      {/* Scenario: Compartir resumen */}
      {totalConfirmed > 0 && (
        <button
          onClick={handleShare}
          className="mt-1 w-full rounded-full bg-[#f0ede9] py-2 text-sm font-semibold text-[#1c1b1b] transition-colors hover:bg-[#ebe7e3]"
        >
          {copied ? '¡Copiado!' : 'Compartir resumen'}
        </button>
      )}

      {/* Indicador live */}
      <div className="flex items-center gap-1.5 pt-1">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#004ac6] opacity-40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#004ac6]" />
        </span>
        <span className="text-[10px] text-[#585f6c]">En vivo</span>
      </div>
    </div>
  )
}
