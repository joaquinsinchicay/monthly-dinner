'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { publishAndCreateEvent } from '@/lib/actions/events'
import { t } from '@/lib/t'

interface Props {
  groupId: string
  pendingEventId?: string  // si hay un evento pending auto-generado, se ignora en la action (la action lo busca por mes/grupo)
}

export default function CreateEventModal({ groupId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleOpen() {
    setError(null)
    setOpen(true)
  }

  function handleClose() {
    if (isPending) return
    setOpen(false)
    setError(null)
  }

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await publishAndCreateEvent(groupId, formData)

      if (!result.success) {
        setError(result.error)
        return
      }

      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      {/* Trigger */}
      <button
        onClick={handleOpen}
        className="mt-5 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(0,74,198,0.25)] transition-opacity"
      >
        {t('group.eventPanel.organizeButton')}
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={handleClose}
          />

          {/* Panel */}
          <div className="relative w-full max-w-[480px] rounded-2xl bg-[rgba(252,249,248,0.88)] backdrop-blur-[16px] p-6 shadow-[0px_20px_60px_-12px_rgba(28,27,27,0.3)]">

            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
              {t('group.eventPanel.eyebrow')}
            </p>
            <p
              className="mt-1 mb-5 font-serif text-[22px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
              style={{ fontFamily: 'DM Serif Display, serif' }}
            >
              {t('group.eventPanel.createTitle')}
            </p>

            <form action={handleSubmit} className="space-y-4">

              {/* event_date — obligatoria */}
              <div>
                <label
                  htmlFor="modal_event_date"
                  className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]"
                >
                  {t('group.eventForm.dateLabel')}
                </label>
                <input
                  id="modal_event_date"
                  name="event_date"
                  type="date"
                  required
                  className="mt-2 w-full rounded-xl bg-[#f0ede9] px-4 py-3 text-sm text-[#1c1b1b] focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
                />
              </div>

              {/* place — opcional */}
              <div>
                <label
                  htmlFor="modal_place"
                  className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]"
                >
                  {t('group.eventForm.placeLabel')}{' '}
                  <span className="normal-case font-normal">{t('group.eventForm.placeLabelOptional')}</span>
                </label>
                <input
                  id="modal_place"
                  name="place"
                  type="text"
                  placeholder={t('group.eventForm.placePlaceholder')}
                  className="mt-2 w-full rounded-xl bg-[#f0ede9] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-[#9ba3b0] focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
                />
              </div>

              {/* description — opcional */}
              <div>
                <label
                  htmlFor="modal_description"
                  className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]"
                >
                  {t('group.eventForm.descriptionLabel')}{' '}
                  <span className="normal-case font-normal">{t('group.eventForm.placeLabelOptional')}</span>
                </label>
                <textarea
                  id="modal_description"
                  name="description"
                  rows={3}
                  placeholder={t('group.eventForm.descriptionPlaceholder')}
                  className="mt-2 w-full resize-none rounded-xl bg-[#f0ede9] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-[#9ba3b0] focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
                />
              </div>

              {/* Error inline */}
              {error && (
                <p className="text-sm text-[#ba1a1a]">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isPending}
                  className="flex-1 rounded-full bg-[#ede9e8] py-3 text-sm font-semibold text-[#1c1b1b] transition-opacity disabled:opacity-60"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(0,74,198,0.25)] transition-opacity disabled:opacity-60"
                >
                  {isPending ? t('group.eventForm.submitCreating') : t('group.eventForm.submitCreate')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
