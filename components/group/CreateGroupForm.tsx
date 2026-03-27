'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createGroup } from '@/lib/actions/groups'
import { t } from '@/lib/t'

type Frequency = 'mensual' | 'quincenal' | 'semanal'
type DayOfWeek = 'lunes' | 'martes' | 'miércoles' | 'jueves' | 'viernes' | 'sábado' | 'domingo'

const DAYS: { label: string; value: DayOfWeek }[] = [
  { label: 'Lun', value: 'lunes' },
  { label: 'Mar', value: 'martes' },
  { label: 'Mié', value: 'miércoles' },
  { label: 'Jue', value: 'jueves' },
  { label: 'Vie', value: 'viernes' },
  { label: 'Sáb', value: 'sábado' },
  { label: 'Dom', value: 'domingo' },
]

const MONTHLY_WEEKS: { label: string; value: number }[] = [
  { label: '1°', value: 1 },
  { label: '2°', value: 2 },
  { label: '3°', value: 3 },
  { label: '4°', value: 4 },
  { label: 'Última', value: 5 },
]

const BIWEEKLY_WEEKS: { label: string; value: number }[] = [
  { label: '1° y 3°', value: 1 },
  { label: '2° y 4°', value: 2 },
]

const ORDINALS = ['primer', 'segundo', 'tercer', 'cuarto', 'último']

function buildPreview(
  frequency: Frequency | '',
  meetingWeek: number | null,
  meetingDay: DayOfWeek | '',
): string {
  if (!frequency || !meetingDay) return ''

  if (frequency === 'semanal') {
    return `Todos los ${meetingDay}`
  }

  if (!meetingWeek) return ''

  if (frequency === 'quincenal') {
    const label = meetingWeek === 1 ? '1° y 3°' : '2° y 4°'
    return `El ${label} ${meetingDay} de cada mes`
  }

  // mensual
  const ordinal = ORDINALS[(meetingWeek === 5 ? 4 : meetingWeek - 1)]
  return `El ${ordinal} ${meetingDay} de cada mes`
}

export default function CreateGroupForm() {
  const router = useRouter()
  const [frequency, setFrequency] = useState<Frequency | ''>('')
  const [meetingWeek, setMeetingWeek] = useState<number | null>(null)
  const [meetingDay, setMeetingDay] = useState<DayOfWeek | ''>('')
  const [errors, setErrors] = useState<{
    name?: string
    frequency?: string
    week?: string
    day?: string
    general?: string
  }>({})
  const [isPending, startTransition] = useTransition()

  const preview = buildPreview(frequency, meetingWeek, meetingDay)

  function handleFrequencyChange(value: Frequency) {
    setFrequency(value)
    setMeetingWeek(null)
    setMeetingDay('')
    setErrors(prev => ({ ...prev, frequency: undefined, week: undefined, day: undefined }))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const name = (formData.get('name') as string)?.trim()

    const newErrors: typeof errors = {}

    if (!name) newErrors.name = t('group.createGroup.errors.nameRequired')
    if (!frequency) newErrors.frequency = t('group.createGroup.errors.frequencyRequired')
    if (frequency && frequency !== 'semanal' && !meetingWeek) {
      newErrors.week =
        frequency === 'quincenal'
          ? t('group.createGroup.errors.weeksRequired')
          : t('group.createGroup.errors.weekRequired')
    }
    if (frequency && !meetingDay) newErrors.day = t('group.createGroup.errors.dayRequired')

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})

    startTransition(async () => {
      const result = await createGroup({
        name,
        frequency: frequency as Frequency,
        meeting_day_of_week: meetingDay as DayOfWeek,
        meeting_week: frequency === 'semanal' ? undefined : (meetingWeek ?? undefined),
      })

      if (!result.success) {
        setErrors({ general: result.error })
        return
      }

      router.replace(`/grupo-creado/${result.data.id}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-6">

        {/* Nombre del grupo */}
        <div className="space-y-2">
          <label
            htmlFor="name"
            className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]"
          >
            {t('group.createGroup.nameLabel')}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder={t('group.createGroup.namePlaceholder')}
            autoComplete="off"
            disabled={isPending}
            className="w-full rounded-xl bg-[#f6f3f2] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-[#c3c6d7] outline-none focus:ring-2 focus:ring-[#004ac6] disabled:opacity-50 transition-shadow"
          />
          {errors.name && (
            <p className="text-sm text-[#ba1a1a]">{errors.name}</p>
          )}
        </div>

        {/* Frecuencia — pills */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
            {t('group.createGroup.frequencyLabel')}
          </p>
          <div className="flex gap-2">
            {(['mensual', 'quincenal', 'semanal'] as Frequency[]).map(f => (
              <button
                key={f}
                type="button"
                disabled={isPending}
                onClick={() => handleFrequencyChange(f)}
                className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
                  frequency === f
                    ? 'bg-[#004ac6] text-white'
                    : 'bg-[#f6f3f2] text-[#1c1b1b] hover:bg-[#eceae9]'
                } disabled:opacity-50`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          {errors.frequency && (
            <p className="text-sm text-[#ba1a1a]">{errors.frequency}</p>
          )}
        </div>

        {/* Semana del mes — condicional: mensual o quincenal */}
        {(frequency === 'mensual' || frequency === 'quincenal') && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
              {frequency === 'quincenal' ? t('group.createGroup.weeksLabel') : t('group.createGroup.weekLabel')}
            </p>
            <div className="flex gap-2 flex-wrap">
              {(frequency === 'quincenal' ? BIWEEKLY_WEEKS : MONTHLY_WEEKS).map(w => (
                <button
                  key={w.value}
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setMeetingWeek(w.value)
                    setErrors(prev => ({ ...prev, week: undefined }))
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    meetingWeek === w.value
                      ? 'bg-[#004ac6] text-white'
                      : 'bg-[#f6f3f2] text-[#1c1b1b] hover:bg-[#eceae9]'
                  } disabled:opacity-50`}
                >
                  {w.label}
                </button>
              ))}
            </div>
            {errors.week && (
              <p className="text-sm text-[#ba1a1a]">{errors.week}</p>
            )}
          </div>
        )}

        {/* Día de la semana — visible cuando hay frecuencia seleccionada */}
        {frequency && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
              {t('group.createGroup.dayLabel')}
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {DAYS.map(d => (
                <button
                  key={d.value}
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setMeetingDay(d.value)
                    setErrors(prev => ({ ...prev, day: undefined }))
                  }}
                  className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                    meetingDay === d.value
                      ? 'bg-[#004ac6] text-white'
                      : 'bg-[#f6f3f2] text-[#1c1b1b] hover:bg-[#eceae9]'
                  } disabled:opacity-50`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            {errors.day && (
              <p className="text-sm text-[#ba1a1a]">{errors.day}</p>
            )}
          </div>
        )}

        {/* Vista previa en tiempo real */}
        {preview && (
          <p className="text-sm text-[#585f6c]">{preview}</p>
        )}

      </div>

      {/* Error general */}
      {errors.general && (
        <p className="mt-3 text-sm text-[#ba1a1a]">{errors.general}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-6 w-full rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(0,74,198,0.25)] disabled:opacity-60 transition-opacity"
      >
        {isPending ? t('group.createGroup.submitPending') : t('group.createGroup.submitIdle')}
      </button>

      <p className="mt-4 text-xs leading-relaxed text-[#585f6c]">
        {t('group.createGroup.creatorNote')}
      </p>
    </form>
  )
}
