'use client'

import { useRouter } from 'next/navigation'
import { t } from '@/lib/t'

interface Group {
  id: string
  name: string
  frequency: 'mensual' | 'quincenal' | 'semanal'
  meeting_day_of_week: string | null
  meeting_week: number | null
}

function formatDay(group: Group): string {
  if (!group.meeting_day_of_week) return '—'
  const day =
    group.meeting_day_of_week.charAt(0).toUpperCase() +
    group.meeting_day_of_week.slice(1)
  if (group.frequency === 'semanal') {
    return t('group.groupCreated.formatDaySemanal', { day })
  }
  if (group.frequency === 'quincenal') {
    return t('group.groupCreated.formatDayQuincenal', { day })
  }
  // mensual — se muestra el día sin el ordinal (el ordinal está en meeting_week, no se usa en esta vista)
  return t('group.groupCreated.formatDayMonthly', { day })
}

// Scenario: Próximos pasos visibles — "Invitar miembros" y "Configurar rotación"
const NEXT_STEPS = [
  {
    id: 'invitar',
    title: t('group.groupCreated.step1Title'),
    description: t('group.groupCreated.step1Description'),
  },
  {
    id: 'rotacion',
    title: t('group.groupCreated.step2Title'),
    description: t('group.groupCreated.step2Description'),
  },
]

interface Props {
  group: Group
}

export default function GroupCreatedView({ group }: Props) {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-[#fcf9f8] flex items-start justify-center px-4 pt-12 pb-10">
      <div className="w-full max-w-sm space-y-6">

        {/* Header editorial */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
            {t('group.groupCreated.eyebrow')}
          </p>
          <h1
            className="mt-1 font-serif text-[28px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
            style={{ fontFamily: 'DM Serif Display, serif' }}
          >
            {t('group.groupCreated.titlePrefix')}
            <br />
            {group.name}!
          </h1>
        </div>

        {/* Scenario: Resumen del grupo visible */}
        <div className="rounded-2xl bg-white p-6 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
            {t('group.groupCreated.summaryTitle')}
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-[#585f6c]">{t('group.groupCreated.nameLabel')}</span>
              <span className="text-sm font-semibold text-[#1c1b1b] text-right">
                {group.name}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-[#585f6c]">{t('group.groupCreated.frequencyLabel')}</span>
              <span className="text-sm font-semibold text-[#1c1b1b]">
                {group.frequency.charAt(0).toUpperCase() + group.frequency.slice(1)}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-[#585f6c]">{t('group.groupCreated.dayLabel')}</span>
              <span className="text-sm font-semibold text-[#1c1b1b] text-right">
                {formatDay(group)}
              </span>
            </div>
          </div>
        </div>

        {/* Scenario: Mensaje de bienvenida al rol de admin */}
        <div className="rounded-2xl bg-[#f6f3f2] px-6 py-5">
          <span className="inline-flex items-center rounded-full bg-[#dce2f3] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#004ac6]">
            {t('group.groupCreated.adminBadge')}
          </span>
          <p className="mt-3 text-sm leading-relaxed text-[#585f6c]">
            {t('group.groupCreated.adminBody')}
          </p>
        </div>

        {/* Scenario: Próximos pasos visibles */}
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
            {t('group.groupCreated.nextStepsTitle')}
          </p>
          <div className="space-y-3">
            {NEXT_STEPS.map((step) => (
              <div
                key={step.id}
                className="rounded-2xl bg-white p-5 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)]"
              >
                <p className="text-sm font-semibold text-[#1c1b1b]">
                  {step.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#585f6c]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Scenario: Navegación al dashboard */}
        <button
          onClick={() => router.push(`/dashboard/${group.id}`)}
          className="w-full rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(0,74,198,0.25)] transition-opacity"
        >
          {t('group.groupCreated.ctaButton')}
        </button>

      </div>
    </main>
  )
}
