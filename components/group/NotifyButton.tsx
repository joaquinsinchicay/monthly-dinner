'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { publishEvent } from '@/lib/actions/events'

interface Props {
  eventId: string
}

// Scenario: Notificación enviada al publicar
// Scenario: Miembro sin notificaciones activas — el evento aparece en el panel al abrir la app
export default function NotifyButton({ eventId }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleNotify() {
    setError(null)
    startTransition(async () => {
      const result = await publishEvent(eventId)
      if (!result.success) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="mt-5 space-y-2">
      <button
        onClick={handleNotify}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(0,74,198,0.25)] transition-opacity disabled:opacity-60"
      >
        {isPending ? (
          'Notificando…'
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              />
              <path
                d="M13.73 21a2 2 0 0 1-3.46 0"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
            Notificar al grupo
          </>
        )}
      </button>
      {error && <p className="text-center text-sm text-[#ba1a1a]">{error}</p>}
    </div>
  )
}
