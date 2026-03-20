import { AppShell } from '@/components/app-shell';
import { PollCard } from '@/components/poll-card';
import { usePoll } from '@/lib/hooks/use-poll';

export default function PollPage({ params }: { params: { groupId: string; eventId: string } }) {
  const poll = usePoll(params.eventId);

  return (
    <AppShell groupId={params.groupId}>
      <section className="hero-card surface-card stack-gap">
        <p className="label">Votación de restaurantes</p>
        <h2 className="headline">Elegí una opción antes del cierre</h2>
        <p className="body-md muted-copy">
          Cada miembro puede votar una opción y cambiarla mientras la votación siga activa. Al cerrar, el resultado queda en solo lectura.
        </p>
      </section>
      {poll.poll ? <PollCard closesAt={poll.poll.closes_at} options={poll.options} /> : null}
    </AppShell>
  );
}
