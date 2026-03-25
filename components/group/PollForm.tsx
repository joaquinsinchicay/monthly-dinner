'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createPoll } from '@/lib/actions/polls'

interface Props {
  eventId: string
  groupId: string
}

export default function PollForm({ eventId, groupId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [options, setOptions] = useState<string[]>(['', ''])
  const [closesAt, setClosesAt] = useState('')
  const [error, setError] = useState<string | null>(null)

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)))
  }

  function addOption() {
    setOptions((prev) => [...prev, ''])
  }

  function removeOption(index: number) {
    if (options.length <= 2) return
    setOptions((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit() {
    setError(null)

    // Client-side pre-validation — el server action valida también
    const valid = options.map((o) => o.trim()).filter(Boolean)
    if (valid.length < 2) {
      setError('Se necesitan al menos 2 opciones para abrir la votación.')
      return
    }
    if (!closesAt) {
      setError('La fecha de cierre es obligatoria.')
      return
    }

    startTransition(async () => {
      const result = await createPoll(eventId, groupId, options, closesAt)
      if (!result.success) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  // Fecha mínima = mañana (evita enviar pasado al server)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().slice(0, 16)

  return (
    <div className="space-y-4">

      {/* Opciones dinámicas */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
          Opciones
        </p>
        <div className="space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`Opción ${i + 1}`}
                disabled={isPending}
                className="flex-1 rounded-xl bg-[#f6f3f2] px-4 py-2.5 text-sm text-[#1c1b1b] placeholder:text-[#585f6c] focus:outline-none focus:ring-2 focus:ring-[#004ac6] disabled:opacity-60"
              />
              {/* Scenario: Menos de 2 opciones — no se puede eliminar si quedan solo 2 */}
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  disabled={isPending}
                  className="shrink-0 rounded-full px-3 py-2 text-xs text-[#585f6c] hover:bg-[#f0ede9] disabled:opacity-60"
                >
                  Quitar
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addOption}
          disabled={isPending}
          className="mt-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#004ac6] disabled:opacity-60"
        >
          + Agregar opción
        </button>
      </div>

      {/* Fecha de cierre */}
      <div>
        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
          Fecha de cierre
        </label>
        {/* Scenario: Fecha de cierre en el pasado — min evita selección en el pasado en UI */}
        <input
          type="datetime-local"
          value={closesAt}
          onChange={(e) => setClosesAt(e.target.value)}
          min={minDate}
          disabled={isPending}
          className="w-full rounded-xl bg-[#f6f3f2] px-4 py-2.5 text-sm text-[#1c1b1b] focus:outline-none focus:ring-2 focus:ring-[#004ac6] disabled:opacity-60"
        />
      </div>

      {error && (
        <p className="rounded-xl bg-[#ffdad6] px-4 py-2.5 text-sm text-[#ba1a1a]">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full rounded-full bg-[#1c1b1b] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-60"
      >
        {isPending ? 'Abriendo votación…' : 'Abrir votación'}
      </button>
    </div>
  )
}
