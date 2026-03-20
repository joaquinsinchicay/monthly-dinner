import { Card } from '@/components/ui/card/card';

export default function DashboardPage() {
  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { href: '/dashboard#groups', label: 'Grupos', icon: 'groups' },
    { href: '/dashboard#invites', label: 'Invitaciones', icon: 'mail' },
    { href: '/dashboard#events', label: 'Eventos', icon: 'calendar_month' },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-outline-variant/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-on-surface-variant">Monthly Dinner</p>
            <h1 className="text-lg font-semibold tracking-tight text-on-surface">Dashboard</h1>
          </div>
          <span className="rounded-full bg-surface-container px-4 py-2 text-sm font-medium text-secondary">MVP Auth</span>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl gap-6 px-6 pb-32 pt-28">
        <>
          <aside className="sticky top-24 hidden h-fit min-w-64 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm md:block">
            <nav aria-label="Navegación principal">
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <a className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface" href={link.href}>
                      <span className="material-symbols-outlined text-xl">{link.icon}</span>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
          <nav className="fixed inset-x-0 bottom-0 z-50 h-20 border-t border-outline-variant/70 bg-white/80 backdrop-blur-xl md:hidden">
            <ul className="mx-auto grid h-full max-w-4xl grid-cols-4">
              {links.map((link) => (
                <li key={link.href}>
                  <a className="flex h-full flex-col items-center justify-center gap-1 text-xs font-medium text-on-surface-variant" href={link.href}>
                    <span className="material-symbols-outlined text-xl">{link.icon}</span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </>

        <section className="flex-1 space-y-6">
          <Card>
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Setup</p>
              <h2 className="text-3xl font-semibold tracking-tight">Base de autenticación lista</h2>
              <p className="max-w-2xl text-base text-on-surface-variant">
                Ya podés reutilizar esta sesión para login recurrente, cierre de sesión, invitaciones por link y el
                dashboard mensual del grupo.
              </p>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <h3 className="text-lg font-semibold">Próximo paso recomendado</h3>
              <p className="mt-2 text-sm text-on-surface-variant">Implementar la historia US-03 para cierre de sesión seguro.</p>
            </Card>
            <Card>
              <h3 className="text-lg font-semibold">Modelo de datos</h3>
              <p className="mt-2 text-sm text-on-surface-variant">Schema con `profiles`, `groups`, `group_members` y `events` listo para evolucionar.</p>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
