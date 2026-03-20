import { AppShell } from '@/components/app-shell';
import { monthlyEvents } from '@/lib/sample-data';
import { searchHistory } from '@/lib/domain';

export default function HistoryPage({ params, searchParams }: { params: { groupId: string }; searchParams?: { q?: string } }) {
  const history = searchHistory(monthlyEvents.map((event) => ({ restaurant_name: event.restaurant_name ?? event.venue_name, month: event.month })), searchParams?.q ?? '');

  return (
    <AppShell groupId={params.groupId}>
      <section className="hero-card surface-card stack-gap">
        <div className="section-header section-header--top">
          <div>
            <p className="label">Historial</p>
            <h2 className="headline">Restaurantes visitados</h2>
          </div>
          <p className="body-sm">Ordenado por fecha descendente</p>
        </div>
        <form className="search-shell" action="">
          <label className="field-label" htmlFor="q">Buscar restaurante</label>
          <input id="q" name="q" className="soft-input" defaultValue={searchParams?.q ?? ''} placeholder="Ej. Ajo" />
        </form>
        {history.length ? (
          <div className="stack-gap-sm">
            {history.map((item) => (
              <article key={`${item.month}-${item.restaurant_name}`} className="soft-panel">
                <p className="label">{item.month}</p>
                <h3>{item.restaurant_name}</h3>
              </article>
            ))}
          </div>
        ) : (
          <article className="soft-panel">
            <p className="body-md">Todavía no hay cenas registradas.</p>
          </article>
        )}
      </section>
    </AppShell>
  );
}
