import { AppShell } from '@/components/app-shell';
import { ChecklistPanel } from '@/components/checklist-panel';
import { summarizeChecklist } from '@/lib/domain';
import { useEvent } from '@/lib/hooks/use-event';
import { checklistItems } from '@/lib/sample-data';

export default function ChecklistPage({ params }: { params: { groupId: string } }) {
  const { event, isCurrentOrganizer } = useEvent(params.groupId);
  const summary = summarizeChecklist(checklistItems.filter((item) => item.event_id === event?.id));

  return (
    <AppShell groupId={params.groupId}>
      <section className="hero-card surface-card stack-gap">
        <p className="label">Checklist mensual</p>
        <h2 className="headline">Tareas cronológicas del organizador</h2>
        <p className="body-md muted-copy">El progreso se guarda por evento y permite retomar el flujo en cualquier sesión.</p>
      </section>
      <ChecklistPanel
        organizerOnly={isCurrentOrganizer}
        items={summary.ordered}
        progress={summary.progress}
        completed={summary.completed}
        total={summary.total}
      />
    </AppShell>
  );
}
