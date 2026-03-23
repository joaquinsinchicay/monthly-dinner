'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createGroup } from '@/lib/actions/groups'

export default function CreateGroupForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createGroup(formData)

      if (!result.success) {
        // El formulario NO se limpia ante un error (technical-decisions.md)
        setError(result.error)
        return
      }

      // Redirigir al panel del grupo para mostrar el link de invitación (US-00b)
      router.push(`/grupo/${result.data.id}`)
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <div className="space-y-2">
        {/* Label siempre visible, nunca como placeholder (design-system.md) */}
        <label
          htmlFor="name"
          className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]"
        >
          Nombre del grupo
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Ej: Cenas del Jueves"
          autoComplete="off"
          disabled={isPending}
          className="w-full rounded-xl bg-[#f6f3f2] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-[#c3c6d7] outline-none focus:ring-2 focus:ring-[#004ac6] disabled:opacity-50 transition-shadow"
        />
      </div>

      {/* Error inline — nunca como alert() (technical-decisions.md) */}
      {error && (
        <p className="mt-3 text-sm text-[#ba1a1a]">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-6 w-full rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(0,74,198,0.25)] disabled:opacity-60 transition-opacity"
      >
        {isPending ? 'Creando...' : 'Crear grupo'}
      </button>
    </form>
  )
}
