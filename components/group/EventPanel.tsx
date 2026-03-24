import EventForm from '@/components/group/EventForm'
import type { Event } from '@/types'

interface Props {
  groupId: string
  event: Event | null
  currentUserId: string
  isOrganizer: boolean
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
  pending: 'Pendiente',
  published: 'Publicado',
  closed: 'Cerrado',
}

export default function EventPanel({ groupId, event, currentUserId, isOrganizer }: Props) {

  // Scenario: no hay evento + usuario NO es organizador → empty state
  if (!event && !isOrganizer) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
          Evento del mes
        </p>
        <p
          className="mt-1 font-serif text-[20px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
          style={{ fontFamily: 'DM Serif Display, serif' }}
        >
          Sin evento este mes
        </p>
        <p className="mt-2 text-sm text-[#585f6c]">
          La cena de este mes aún no fue convocada.
        </p>
      </div>
    )
  }

  // Scenario: no hay evento + usuario ES organizador → formulario de creación
  if (!event && isOrganizer) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
          Evento del mes
        </p>
        <p
          className="mt-1 font-serif text-[22px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
          style={{ fontFamily: 'DM Serif Display, serif' }}
        >
          Crear el evento
        </p>
        <p className="mb-5 mt-2 text-sm text-[#585f6c]">
          Completá los datos para convocar al grupo.
        </p>
        {/* Scenario: Creación exitosa + Campos obligatorios vacíos */}
        <EventForm groupId={groupId} />
      </div>
    )
  }

  // Evento existe — mostrar datos + edición para el organizador
  const canEdit = isOrganizer && event!.organizer_id === currentUserId && event!.status !== 'closed'

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)]">

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
            Evento del mes
          </p>
          <p
            className="mt-1 font-serif text-[22px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
            style={{ fontFamily: 'DM Serif Display, serif' }}
          >
            {event!.event_date ? formatDate(event!.event_date) : 'Fecha por confirmar'}
          </p>
        </div>

        {/* Badge de estado */}
        <span className="mt-1 shrink-0 rounded-full bg-[#f0ede9] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
          {STATUS_LABEL[event!.status] ?? event!.status}
        </span>
      </div>

      {event!.place && (
        <p className="mt-3 text-sm text-[#585f6c]">
          <span className="font-medium text-[#1c1b1b]">Lugar:</span> {event!.place}
        </p>
      )}

      {event!.description && (
        <p className="mt-1 text-sm text-[#585f6c]">{event!.description}</p>
      )}

      {/* Scenario: Edición posterior — solo para el organizador, evento no cerrado */}
      {canEdit && (
        <details className="mt-5">
          <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.05em] text-[#004ac6]">
            Editar evento
          </summary>
          <div className="mt-4">
            <EventForm groupId={groupId} existing={event!} />
          </div>
        </details>
      )}
    </div>
  )
}
