// Scenario: Notificación recibida con acción directa
// Muestra fecha, lugar y CTA de confirmación cuando el evento está publicado
// y el miembro aún no confirmó su asistencia.
//
// Scenario: Recordatorio por falta de respuesta
// Variante "recordatorio" cuando pasaron ≥48h desde notified_at sin confirmación.
//
// Scenario: Acceso desde notificación
// Este componente es visible en /grupo/[id] — la ruta a la que llega el usuario
// al abrir la app. El routing de /dashboard redirige a /grupo/[id] automáticamente.

import type { Event } from '@/types'
import ConfirmAttendanceButtons from '@/components/group/ConfirmAttendanceButtons'
import { t } from '@/lib/t'

interface Props {
  event: Event
  groupId: string
}

const REMINDER_HOURS = 48

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function isReminder(notifiedAt: string | null): boolean {
  if (!notifiedAt) return false
  const elapsed = Date.now() - new Date(notifiedAt).getTime()
  return elapsed >= REMINDER_HOURS * 60 * 60 * 1000
}

export default function ConvocatoriaNotification({ event }: Props) {
  const reminder = isReminder(event.notified_at ?? null)

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)]">

      {/* Badge de estado — normal vs recordatorio */}
      <div className="mb-4 flex items-center gap-2">
        <span
          className={
            reminder
              ? 'rounded-full bg-[#ffdad6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#ba1a1a]'
              : 'rounded-full bg-[#dce2f3] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#004ac6]'
          }
        >
          {reminder ? t('group.convocatoria.reminderBadge') : t('group.convocatoria.badge')}
        </span>
      </div>

      {/* Título */}
      <p
        className="font-serif text-[22px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
        style={{ fontFamily: 'DM Serif Display, serif' }}
      >
        {reminder ? t('group.convocatoria.reminderTitle') : t('group.convocatoria.title')}
      </p>

      {/* Mensaje contextual */}
      <p className="mt-1 text-sm text-[#585f6c]">
        {reminder
          ? t('group.convocatoria.reminderBody')
          : t('group.convocatoria.body')}
      </p>

      {/* Datos del evento */}
      <div className="mt-4 space-y-1.5">
        {event.event_date && (
          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-[#585f6c]">📅</span>
            <p className="text-sm text-[#1c1b1b]">{formatDate(event.event_date)}</p>
          </div>
        )}
        {event.place && (
          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-[#585f6c]">📍</span>
            <p className="text-sm text-[#1c1b1b]">{event.place}</p>
          </div>
        )}
        {event.description && (
          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-[#585f6c]">💬</span>
            <p className="text-sm text-[#585f6c]">{event.description}</p>
          </div>
        )}
      </div>

      {/* Scenario: CTA — confirmar asistencia directamente desde la notificación (US-09) */}
      <div id="confirmacion">
        <ConfirmAttendanceButtons
          eventId={event.id}
          currentStatus={null}
          eventClosed={false}
        />
      </div>

    </div>
  )
}
