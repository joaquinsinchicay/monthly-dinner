'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { closeEvent } from '@/lib/actions/restaurant'

interface Props {
  eventId: string
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function CloseEventForm({ eventId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [restaurantName, setRestaurantName] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Scenario: Restaurante ya en el historial — estado de advertencia antes de confirmar
  const [alreadyVisited, setAlreadyVisited] = useState<{
    name: string
    visited_at: string
  } | null>(null)

  function handleSubmit(force: boolean = false) {
    setError(null)

    startTransition(async () => {
      const name = restaurantName.trim() || null
      const result = await closeEvent(eventId, name, force)

      if (!result.success) {
        setError(result.error)
        return
      }

      // Scenario: Restaurante ya en el historial — mostrar advertencia
      if (!result.data.closed) {
        setAlreadyVisited(result.data.alreadyVisited)
        return
      }

      // Escenario exitoso — refrescar la página
      router.refresh()
    })
  }

  // Estado de advertencia: restaurante ya visitado
  if (alreadyVisited) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-[#ffdad6] px-4 py-3">
          <p className="text-sm font-semibold text-[#ba1a1a]">
            Este restaurante ya fue visitado
          </p>
          <p className="mt-1 text-sm text-[#ba1a1a]">
            <span className="font-medium">{alreadyVisited.name}</span> — visitado el{' '}
            {formatDate(alreadyVisited.visited_at)}
          </p>
        </div>
        <p className="text-sm text-[#585f6c]">
          ¿Querés registrarlo igual?
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setAlreadyVisited(null)}
            disabled={isPending}
            className="flex-1 rounded-full bg-[#f0ede9] py-2.5 text-sm font-semibold text-[#1c1b1b] disabled:opacity-60"
          >
            Volver
          </button>
          {/* Scenario: permite confirmarlo igual */}
          <button
            onClick={() => handleSubmit(true)}
            disabled={isPending}
            className="flex-1 rounded-full bg-[#1c1b1b] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? 'Cerrando…' : 'Confirmar igual'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Scenario: Cierre sin restaurante — campo opcional */}
      <div>
        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
          Restaurante visitado{' '}
          <span className="normal-case font-normal text-[#585f6c]">(opcional)</span>
        </label>
        <input
          type="text"
          value={restaurantName}
          onChange={(e) => setRestaurantName(e.target.value)}
          placeholder="Ej: La Cabrera"
          disabled={isPending}
          className="w-full rounded-xl bg-[#f6f3f2] px-4 py-2.5 text-sm text-[#1c1b1b] placeholder:text-[#585f6c] focus:outline-none focus:ring-2 focus:ring-[#004ac6] disabled:opacity-60"
        />
        {!restaurantName.trim() && (
          <p className="mt-1 text-xs text-[#585f6c]">
            Si no lo completás, el evento se cierra como &ldquo;Sin restaurante registrado&rdquo;.
          </p>
        )}
      </div>

      {error && (
        <p className="rounded-xl bg-[#ffdad6] px-4 py-2.5 text-sm text-[#ba1a1a]">{error}</p>
      )}

      <button
        onClick={() => handleSubmit(false)}
        disabled={isPending}
        className="w-full rounded-full bg-[#1c1b1b] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-60"
      >
        {isPending ? 'Cerrando evento…' : 'Cerrar evento'}
      </button>
    </div>
  )
}
