import Link from 'next/link';

import { AppShell } from '@/components/app-shell';
import { AttendanceCard } from '@/components/attendance-card';
import { PollCard } from '@/components/poll-card';
import { useAttendance } from '@/lib/hooks/use-attendance';
import { useEvent } from '@/lib/hooks/use-event';
import { usePoll } from '@/lib/hooks/use-poll';

export default function EventPage({ params }: { params: { groupId: string; eventId: string } }) {
  const { event, organizer, isCurrentOrganizer } = useEvent(params.groupId);
  const attendance = useAttendance(params.eventId);
  const poll = usePoll(params.eventId);

  return (
    <AppShell groupId={params.groupId}>
      <section className="hero-card surface-card stack-gap">
        <div className="section-header section-header--top">
          <div>
            <p className="label">Evento del mes</p>
            <h2 className="headline">{event?.venue_name}</h2>
          </div>
          <span className="status-pill status-pill--published">{event?.status}</span>
        </div>
        <p className="body-md">{event?.event_date} · {event?.venue_address}</p>
        <p className="body-md muted-copy">Organiza {organizer?.full_name}</p>
        <div className="soft-panel stack-gap-sm">
          <p className="label">Estado del evento</p>
          <p className="body-md">Fecha, lugar, organizador y confirmaciones se sincronizan con Realtime sobre <strong>monthly_events</strong> y <strong>attendances</strong>.</p>
        </div>
        <div className="cta-row">
          <Link className="secondary-link-button" href={`/group/${params.groupId}/event/${params.eventId}/poll`}>Ir a votación</Link>
          {isCurrentOrganizer ? <Link className="primary-link-button" href={`/group/${params.groupId}/checklist`}>Abrir checklist</Link> : null}
        </div>
      </section>

      <AttendanceCard statuses={attendance.summary} shareText={attendance.shareText} />
      {poll.poll ? <PollCard closesAt={poll.poll.closes_at} options={poll.options} /> : null}
    </AppShell>
  );
}
