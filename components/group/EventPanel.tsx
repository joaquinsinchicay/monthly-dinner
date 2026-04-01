import CreateEventModal from '@/components/group/CreateEventModal'
import EventForm from '@/components/group/EventForm'
import { t } from '@/lib/t'
import NotifyButton from '@/components/group/NotifyButton'
import AttendanceSummary from '@/components/group/AttendanceSummary'
import AttendanceSummaryDetailed from '@/components/group/AttendanceSummaryDetailed'
import ConfirmAttendanceButtons from '@/components/group/ConfirmAttendanceButtons'
import CloseEventForm from '@/components/group/CloseEventForm'
import type { Event } from '@/types'
import type { AttendanceCounts } from '@/lib/actions/events'
import type { UserAttendance, AttendanceStatus } from '@/lib/actions/attendances'

interface Props {
  groupId: string
  event: Event | null
  currentUserId: string
  isOrganizer: boolean
  isAdmin?: boolean
  attendanceCounts?: AttendanceCounts
  userAttendance?: UserAttendance | null
  // US-10: groupId ya está en Props — AttendanceSummaryDetailed lo usa para sin_responder
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

const STATUS_LABEL: Record<string, string> = {
  pending: t('group.eventPanel.status.pending'),
  published: t('group.eventPanel.status.published'),
  closed: t('group.eventPanel.status.closed'),
}

export default function EventPanel({ groupId, event, currentUserId, isOrganizer, isAdmin = false, attendanceCounts, userAttendance }: Props) {

  // Scenario: no hay evento (o evento pending) + usuario NO es organizador → empty state
  if ((!event || event.status === 'pending') && !isOrganizer) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
          {t('group.eventPanel.eyebrow')}
        </p>
        <p
          className="mt-1 font-serif text-[20px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
          style={{ fontFamily: 'DM Serif Display, serif' }}
        >
          {t('group.eventPanel.noEventTitle')}
        </p>
        <p className="mt-2 text-sm text-[#585f6c]">
          {t('group.eventPanel.noEventBody')}
        </p>
      </div>
    )
  }

  // Scenario 01/02: no hay evento Published (null o pending) + usuario ES organizador
  // → muestra "Sos el organizador" + botón "Organizar" que abre el modal de creación
  if ((!event || event.status === 'pending') && isOrganizer) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
          {t('group.eventPanel.eyebrow')}
        </p>
        <p
          className="mt-1 font-serif text-[22px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
          style={{ fontFamily: 'DM Serif Display, serif' }}
        >
          {t('group.organizer.iAmOrganizerTitle')}
        </p>
        <p className="mt-2 text-sm text-[#585f6c]">
          {t('group.organizer.iAmOrganizerBody')}
        </p>
        <p className="mt-1 text-sm text-[#585f6c]">
          <span className="font-medium text-[#1c1b1b]">{t('group.organizer.nextStepEyebrow')}:</span>{' '}
          {t('group.organizer.nextStepBody')}
        </p>
        <CreateEventModal groupId={groupId} pendingEventId={event?.id} />
      </div>
    )
  }

  // Evento existe — mostrar datos + acciones para el organizador
  const isEventOrganizer = isOrganizer && event!.organizer_id === currentUserId
  const canEdit = isEventOrganizer && event!.status !== 'closed'
  // Scenario: Notificación enviada al publicar — botón visible cuando status = pending
  const canNotify = isEventOrganizer && event!.status === 'pending'
  // Scenario: Cerrar evento — solo para el organizador, solo si está published
  const canClose = isEventOrganizer && event!.status === 'published'

  // US-10 RN-03: botones activos solo en published; closed → read-only via eventClosed=true
  const showAttendanceButtons =
    event!.status === 'published' ||
    event!.status === 'closed'

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)]">

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
            {t('group.eventPanel.eyebrow')}
          </p>
          <p
            className="mt-1 font-serif text-[22px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
            style={{ fontFamily: 'DM Serif Display, serif' }}
          >
            {event!.event_date ? formatDate(event!.event_date) : t('group.eventPanel.dateUnconfirmed')}
          </p>
        </div>

        {/* Badge de estado — ADJ-01: "closed" tiene estilo destacado */}
        {event!.status === 'closed' ? (
          <span className="mt-1 shrink-0 rounded-full bg-[#1c1b1b] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-white">
            {t('group.eventPanel.status.closed')}
          </span>
        ) : (
          <span className="mt-1 shrink-0 rounded-full bg-[#f0ede9] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
            {STATUS_LABEL[event!.status] ?? event!.status}
          </span>
        )}
      </div>

      {event!.place && (
        <p className="mt-3 text-sm text-[#585f6c]">
          <span className="font-medium text-[#1c1b1b]">{t('group.eventPanel.placeLabel')}</span> {event!.place}
        </p>
      )}

      {event!.description && (
        <p className="mt-1 text-sm text-[#585f6c]">{event!.description}</p>
      )}

      {/* Scenario: Notificación enviada al publicar */}
      {canNotify && <NotifyButton eventId={event!.id} />}

      {/* US-10: Organizador ve resumen detallado con nombres + compartir (en tiempo real).
          US-07: Miembros ven solo conteos (AttendanceSummary — ya implementado). */}
      {isOrganizer && (
        <AttendanceSummaryDetailed
          eventId={event!.id}
          groupId={groupId}
          isAdmin={isAdmin}
        />
      )}
      {!isOrganizer && attendanceCounts && (
        <AttendanceSummary
          eventId={event!.id}
          initialCounts={attendanceCounts}
          eventClosed={event!.status === 'closed'}
        />
      )}

      {showAttendanceButtons && (
        <ConfirmAttendanceButtons
          eventId={event!.id}
          currentStatus={(userAttendance?.status as AttendanceStatus) ?? null}
          eventClosed={event!.status === 'closed'}
        />
      )}

      {/* Scenario: Edición posterior — solo para el organizador, evento no cerrado */}
      {canEdit && (
        <details className="mt-5">
          <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.05em] text-[#004ac6]">
            {t('group.eventPanel.editSummary')}
          </summary>
          <div className="mt-4">
            <EventForm groupId={groupId} existing={event!} />
          </div>
        </details>
      )}

      {/* US-14: Cerrar evento — organizador, solo cuando published */}
      {canClose && (
        <details className="mt-3">
          <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
            {t('group.eventPanel.closeSummary')}
          </summary>
          <div className="mt-4">
            <CloseEventForm eventId={event!.id} />
          </div>
        </details>
      )}
    </div>
  )
}
