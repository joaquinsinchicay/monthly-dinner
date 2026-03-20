const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/groups', label: 'Grupos' },
  { href: '/invites', label: 'Invitaciones' },
  { href: '/profile', label: 'Perfil' },
];

export function AppSidebar() {
  return (
    <aside className="app-sidebar" aria-label="Navegación principal">
      <div className="app-sidebar__brand">
        <span className="app-sidebar__logo">MD</span>
        <div>
          <strong>Monthly Dinner</strong>
          <p>Design system foundation</p>
        </div>
      </div>
      <nav>
        <ul className="app-sidebar__nav">
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
