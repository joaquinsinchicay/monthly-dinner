const links = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/dashboard#groups', label: 'Grupos', icon: 'groups' },
  { href: '/dashboard#invites', label: 'Invitaciones', icon: 'mail' },
  { href: '/dashboard#events', label: 'Eventos', icon: 'calendar_month' },
];

export function AppSidebar() {
  return (
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
  );
}
