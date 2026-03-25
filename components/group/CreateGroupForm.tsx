'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createGroup } from '@/lib/actions/groups'

type Frequency = 'mensual' | 'quincenal' | 'semanal'

const DAYS_OF_WEEK = [
  'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo',
] as const

const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, i) => i + 1)

const selectClass =
  'w-full rounded-xl bg-[#f6f3f2] px-4 py-3 text-sm text-[#1c1b1b] outline-none focus:ring-2 focus:ring-[#004ac6] disabled:opacity-50 transition-shadow appearance-none cursor-pointer'

export default function CreateGroupForm() {
  const router = useRouter()
  const [frequency, setFrequency] = useState<Frequency>('mensual')
  const [dayValue, setDayValue] = useState<string>('')
  const [errors, setErrors] = useState<{ name?: string; day?: string; general?: string }>({})
  const [isPending, startTransition] = useTransition()

  function handleFrequencyChange(value: Frequency) {
    setFrequency(value)
    setDayValue('')                                  // resetear día al cambiar frecuencia
    setErrors(prev => ({ ...prev, day: undefined }))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const name = (formData.get('name') as string)?.trim()

    const newErrors: typeof errors = {}

    if (!name) {
      newErrors.name = 'El nombre del grupo es obligatorio'
    }

    if (!dayValue) {
      newErrors.day =
        frequency === 'mensual'
          ? 'Seleccioná el día del mes'
          : 'Seleccioná el día de la semana'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})

    startTransition(async () => {
      const input =
        frequency === 'mensual'
          ? { name, frequency, meeting_day_of_month: parseInt(dayValue, 10) }
          : { name, frequency, meeting_day_of_week: dayValue }

      const result = await createGroup(input)

      if (!result.success) {
        setErrors({ general: result.error })
        return
      }

      // router.replace evita que el botón atrás vuelva al formulario (US-00d)
      router.replace(`/grupo-creado/${result.data.id}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-5">

        {/* Nombre del grupo */}
        <div className="space-y-2">
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
          {errors.name && (
            <p className="text-sm text-[#ba1a1a]">{errors.name}</p>
          )}
        </div>

        {/* Frecuencia */}
        <div className="space-y-2">
          <label
            htmlFor="frequency"
            className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]"
          >
            Frecuencia
          </label>
          <select
            id="frequency"
            value={frequency}
            onChange={e => handleFrequencyChange(e.target.value as Frequency)}
            disabled={isPending}
            className={selectClass}
          >
            <option value="mensual">Mensual</option>
            <option value="quincenal">Quincenal</option>
            <option value="semanal">Semanal</option>
          </select>
        </div>

        {/* Día — condicional según frecuencia */}
        <div className="space-y-2">
          <label
            htmlFor="day"
            className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]"
          >
            Día
          </label>
          <select
            id="day"
            value={dayValue}
            onChange={e => setDayValue(e.target.value)}
            disabled={isPending}
            className={selectClass}
          >
            <option value="" disabled>
              {frequency === 'mensual' ? 'Día del mes' : 'Día de la semana'}
            </option>
            {frequency === 'mensual'
              ? DAYS_OF_MONTH.map(d => (
                  <option key={d} value={String(d)}>
                    {d}
                  </option>
                ))
              : DAYS_OF_WEEK.map(d => (
                  <option key={d} value={d}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </option>
                ))}
          </select>
          {errors.day && (
            <p className="text-sm text-[#ba1a1a]">{errors.day}</p>
          )}
        </div>

      </div>

      {/* Error general (duplicado de nombre, error de servidor) */}
      {errors.general && (
        <p className="mt-3 text-sm text-[#ba1a1a]">{errors.general}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-6 w-full rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(0,74,198,0.25)] disabled:opacity-60 transition-opacity"
      >
        {isPending ? 'Creando...' : 'Crear grupo'}
      </button>

      {/* Mensaje informativo — visible al cargar (Gherkin: Scenario "Mensaje informativo") */}
      <p className="mt-4 text-xs leading-relaxed text-[#585f6c]">
        Como creador, tendrás el rol de administrador para gestionar las invitaciones,
        proponer fechas y coordinar los lugares de encuentro.
      </p>
    </form>
  )
}
