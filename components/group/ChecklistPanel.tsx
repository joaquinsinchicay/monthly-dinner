'use client'

import { useState, useTransition, useEffect } from 'react'
import { toggleChecklistItem, getOrCreateChecklist } from '@/lib/actions/checklist'
import { t } from '@/lib/t'
import type { ChecklistItem } from '@/lib/actions/checklist'

interface Props {
  eventId: string
  isOrganizer: boolean
  initialItems: ChecklistItem[]
}

// Scenario: Checklist disponible al ser asignado — items ordenados cronológicamente + progreso.
// Scenario: Tarea completada — tachada, progreso actualizado, se habilita la siguiente tarea.
// Scenario: Checklist no disponible para no organizadores — mensaje explicativo.
// Scenario: Retomar checklist incompleto — progreso guardado, pendientes resaltados.
export default function ChecklistPanel({ eventId, isOrganizer, initialItems }: Props) {
  const [items, setItems] = useState<ChecklistItem[]>(initialItems)
  const [pending, startTransition] = useTransition()
  const [loadError, setLoadError] = useState<string | null>(null)

  // Load checklist on mount if empty (handles first-time creation)
  useEffect(() => {
    if (!isOrganizer) return
    if (items.length > 0) return

    getOrCreateChecklist(eventId).then((result) => {
      if (result.success) {
        setItems(result.data)
      } else {
        setLoadError(result.error)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, isOrganizer])

  // Scenario: Checklist no disponible para no organizadores
  if (!isOrganizer) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
          {t('group.checklist.eyebrow')}
        </p>
        <p
          className="mt-1 font-serif text-[22px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
          style={{ fontFamily: 'DM Serif Display, serif' }}
        >
          {t('group.checklist.notOrganizerTitle')}
        </p>
        <p className="mt-2 text-sm text-[#585f6c]">
          {t('group.checklist.notOrganizerBody')}
        </p>
      </div>
    )
  }

  const doneCount = items.filter((i) => i.status === 'done').length
  const total = items.length
  const progressPct = total > 0 ? Math.round((doneCount / total) * 100) : 0
  const allDone = total > 0 && doneCount === total

  function handleToggle(item: ChecklistItem, isDone: boolean) {
    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, status: isDone ? 'done' : 'pending', completed_at: isDone ? new Date().toISOString() : null }
          : i
      )
    )

    startTransition(async () => {
      const result = await toggleChecklistItem(item.id, isDone)
      if (!result.success) {
        // Revert on error
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: item.status, completed_at: item.completed_at } : i
          )
        )
      }
    })
  }

  if (loadError) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)]">
        <p className="text-sm text-[#585f6c]">{loadError}</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)]">

      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
            {t('group.checklist.eyebrow')}
          </p>
          <p
            className="mt-1 font-serif text-[22px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
            style={{ fontFamily: 'DM Serif Display, serif' }}
          >
            {allDone ? t('group.checklist.titleDone') : t('group.checklist.titlePending')}
          </p>
        </div>

        {/* Progress badge */}
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${
            allDone
              ? 'bg-[#dcfce7] text-[#166534]'
              : 'bg-[#f0ede9] text-[#585f6c]'
          }`}
        >
          {doneCount}/{total}
        </span>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-[#f0ede9]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* Task list */}
      <div className="space-y-2">
        {items.map((item, idx) => {
          const isDone = item.status === 'done'
          // Scenario: Tarea completada — se habilita la siguiente tarea (secuencial)
          const isEnabled = idx === 0 || items[idx - 1].status === 'done'

          return (
            <button
              key={item.id}
              type="button"
              disabled={!isEnabled || pending}
              onClick={() => handleToggle(item, !isDone)}
              className={`w-full rounded-xl px-4 py-3 text-left transition-opacity ${
                isEnabled ? 'opacity-100' : 'cursor-not-allowed opacity-40'
              } ${isDone ? 'bg-[#f0ede9]' : 'bg-[#f6f3f2]'}`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox visual */}
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    isDone
                      ? 'border-[#004ac6] bg-[#004ac6]'
                      : isEnabled
                        ? 'border-[#c4bfbc] bg-white'
                        : 'border-[#ddd9d5] bg-[#f0ede9]'
                  }`}
                >
                  {isDone && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                      <path
                        d="M1 4L3.5 6.5L9 1"
                        stroke="white"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  {/* Label — tachado si done */}
                  <p
                    className={`text-sm font-medium leading-snug ${
                      isDone
                        ? 'text-[#9b9490] line-through'
                        : isEnabled
                          ? 'text-[#1c1b1b]'
                          : 'text-[#9b9490]'
                    }`}
                  >
                    {item.label}
                  </p>

                  {/* Description — solo si habilitada y no terminada */}
                  {item.description && isEnabled && !isDone && (
                    <p className="mt-0.5 text-xs text-[#585f6c]">{item.description}</p>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* All done message */}
      {allDone && (
        <p className="mt-4 text-center text-sm text-[#585f6c]">
          {t('group.checklist.allDoneMessage')}
        </p>
      )}
    </div>
  )
}
