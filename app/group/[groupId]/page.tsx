import Link from 'next/link';

import { AppShell } from '@/components/app-shell';
import { AttendanceCard } from '@/components/attendance-card';
import { PollCard } from '@/components/poll-card';
import { useAttendance } from '@/lib/hooks/use-attendance';
import { useEvent } from '@/lib/hooks/use-event';
import { usePoll } from '@/lib/hooks/use-poll';

export default function GroupPage({ params }: { params: { groupId: string } }) {
  const { event, organizer, isCurrentOrganizer, nextOrganizer } = useEvent(params.groupId);
  const attendance = useAttendance(event?.id ?? '');
  const poll = usePoll(event?.id ?? '');

  return (
    <AppShell groupId={params.groupId}>
      <section className="hero-card surface-card stack-gap">
        <div className="section-header section-header--top">
          <div>
            <p className="label">Panel mensual</p>
            <h2 className="headline">{event ? 'La cena de este mes está convocada' : 'La cena de este mes aún no fue convocada'}</h2>
          </div>
          <p className="body-sm">Marzo 2026</p>
        </div>

        {event ? (
          <>
            <div className="split-highlight">
              <div>
                <p className="label">Organizador actual</p>
                <h3>{organizer?.full_name}</h3>
                <p className="body-sm muted-copy">
                  {isCurrentOrganizer ? 'Te toca organizar este mes. Seguí el checklist para cerrar la cena.' : 'Turno activo visible para todos los miembros.'}
                </p>
              </div>
              <div>
                <p className="label">Evento</p>
                <h3>{event.event_date}</h3>
                <p className="body-sm muted-copy">{event.venue_name} · {event.venue_address}</p>
              </div>
            </div>
            <p className="body-md">{event.description}</p>
            <div className="cta-row">
              <Link className="primary-link-button" href={`/group/${params.groupId}/event/${event.id}`}>Ver evento</Link>
              <Link className="secondary-link-button" href={`/group/${params.groupId}/checklist`}>Checklist</Link>
            </div>
            <div className="soft-panel">
              <p className="label">Próximo organizador</p>
              <p className="body-md">{nextOrganizer?.user_id === organizer?.id ? 'Rotación reinicia el ciclo.' : `Siguiente turno asignado a ${nextOrganizer?.user_id ?? 'pendiente'}.`}</p>
            </div>
          </>
        ) : null}
      </section>

      {event ? <AttendanceCard statuses={attendance.summary} shareText={attendance.shareText} /> : null}
      {poll.poll ? <PollCard closesAt={poll.poll.closes_at} options={poll.options} /> : null}
    </AppShell>
  );
}
