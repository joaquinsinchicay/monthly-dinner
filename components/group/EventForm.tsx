'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createEvent, updateEvent } from '@/lib/actions/events'
import type { Event } from '@/types'

interface Props {
  groupId: string
  existing?: Event  // si viene, es modo edición
}

export default function EventForm({ groupId, existing }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isEdit = !!existing

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = isEdit
        ? await updateEvent(existing!.id, formData)
        : await createEvent(groupId, formData)

      if (!result.success) {
        setError(result.error)
        return
      }

      router.refresh()
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">

      {/* event_date — obligatoria */}
      <div>
        <label
          htmlFor="event_date"
          className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]"
        >
          Fecha de la cena
        </label>
        <input
          id="event_date"
          name="event_date"
          type="date"
          required
          defaultValue={existing?.event_date ?? ''}
          className="mt-2 w-full rounded-xl bg-[#f0ede9] px-4 py-3 text-sm text-[#1c1b1b] focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
        />
      </div>

      {/* place — opcional */}
      <div>
        <label
          htmlFor="place"
          className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]"
        >
          Lugar tentativo <span className="normal-case font-normal">(opcional)</span>
        </label>
        <input
          id="place"
          name="place"
          type="text"
          defaultValue={existing?.place ?? ''}
          placeholder="Ej: Lo de siempre, por definir…"
          className="mt-2 w-full rounded-xl bg-[#f0ede9] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-[#9ba3b0] focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
        />
      </div>

      {/* description — opcional */}
      <div>
        <label
          htmlFor="description"
          className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]"
        >
          Descripción <span className="normal-case font-normal">(opcional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={existing?.description ?? ''}
          placeholder="Detalles adicionales para el grupo…"
          className="mt-2 w-full resize-none rounded-xl bg-[#f0ede9] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-[#9ba3b0] focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
        />
      </div>

      {/* Scenario: Re-notificación por cambio de datos — solo si el evento ya está publicado */}
      {isEdit && existing?.status === 'published' && (
        <label className="flex items-start gap-3 rounded-xl bg-[#f0ede9] px-4 py-3 cursor-pointer">
          <input
            type="checkbox"
            name="notify"
            value="true"
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#004ac6]"
          />
          <span className="text-sm text-[#1c1b1b]">
            Notificar al grupo sobre los cambios
          </span>
        </label>
      )}

      {/* Error inline — no se limpia el form ante error */}
      {error && (
        <p className="text-sm text-[#ba1a1a]">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(0,74,198,0.25)] transition-opacity disabled:opacity-60"
      >
        {isPending
          ? isEdit ? 'Guardando…' : 'Creando evento…'
          : isEdit ? 'Guardar cambios' : 'Crear evento'}
      </button>
    </form>
  )
}
