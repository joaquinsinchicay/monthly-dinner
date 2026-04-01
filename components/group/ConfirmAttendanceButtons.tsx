'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { upsertAttendance } from '@/lib/actions/attendances'
import type { AttendanceStatus } from '@/lib/actions/attendances'
import { t } from '@/lib/t'

interface Props {
  eventId: string
  currentStatus: AttendanceStatus | null
  eventClosed: boolean
}

const OPTIONS: { status: AttendanceStatus; label: string; selectedClass: string }[] = [
  {
    status: 'va',
    label: t('group.attendance.options.va'),
    selectedClass: 'bg-[#6ffbbe] text-[#006242]',
  },
  {
    status: 'tal_vez',
    label: t('group.attendance.options.tal_vez'),
    selectedClass: 'bg-[#dce2f3] text-[#004ac6]',
  },
  {
    status: 'no_va',
    label: t('group.attendance.options.no_va'),
    selectedClass: 'bg-[#ffdad6] text-[#ba1a1a]',
  },
]

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  va: t('group.attendance.options.va'),
  tal_vez: t('group.attendance.options.tal_vez'),
  no_va: t('group.attendance.options.no_va'),
}

// Scenario: Confirmación después del evento — muestra estado como solo lectura.
function ReadOnlyBadge({ status }: { status: AttendanceStatus | null }) {
  if (!status) {
    return (
      <p className="text-sm text-[#585f6c]">{t('group.attendance.noAnswerBeforeClose')}</p>
    )
  }
  const opt = OPTIONS.find((o) => o.status === status)
  return (
    <span
      className={`inline-block rounded-full px-4 py-1.5 text-sm font-semibold ${opt?.selectedClass ?? ''}`}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

export default function ConfirmAttendanceButtons({
  eventId,
  currentStatus,
  eventClosed,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [optimisticStatus, setOptimisticStatus] = useState<AttendanceStatus | null>(
    currentStatus
  )

  // Scenario: Confirmación después del evento — solo lectura, sin botones
  if (eventClosed) {
    return (
      <div className="mt-4">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
          {t('group.attendance.yourAnswer')}
        </p>
        <ReadOnlyBadge status={optimisticStatus} />
      </div>
    )
  }

  function handleSelect(status: AttendanceStatus) {
    if (isPending) return
    setError(null)
    setOptimisticStatus(status)
    startTransition(async () => {
      const result = await upsertAttendance(eventId, status)
      if (!result.success) {
        setError(result.error)
        setOptimisticStatus(currentStatus) // revert optimistic update
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="mt-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
        {optimisticStatus ? t('group.attendance.yourAnswer') : t('group.attendance.question')}
      </p>

      {/* Scenario: Confirmación exitosa / Cambio de estado / Tal vez */}
      <div className="flex gap-2">
        {OPTIONS.map(({ status, label, selectedClass }) => {
          const isSelected = optimisticStatus === status
          return (
            <button
              key={status}
              onClick={() => handleSelect(status)}
              disabled={isPending}
              className={[
                'flex-1 rounded-full py-2 text-sm font-semibold transition-colors',
                isSelected
                  ? selectedClass
                  : 'bg-[#f0ede9] text-[#585f6c] hover:bg-[#ebe7e3]',
                isPending ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}
            >
              {label}
            </button>
          )
        })}
      </div>

      {error && (
        <p className="mt-2 text-xs text-[#ba1a1a]">{error}</p>
      )}
    </div>
  )
}
