import React from 'react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { LogoutButton } from '@/components/auth/LogoutButton';
import { useAuth } from '@/lib/hooks/use-auth';

export function AppShell({ children, groupId }: { children: ReactNode; groupId?: string }) {
  const { profile, unreadNotifications } = useAuth();

  return (
    <main className="page-shell">
      <header className="glass-header">
        <div>
          <p className="label">monthly-dinner</p>
          <h1 className="display-title">Cenas del Jueves</h1>
        </div>
        <div className="header-meta">
          <span className="notification-chip">{unreadNotifications} nuevas</span>
          <span className="avatar-pill">{profile?.full_name?.slice(0, 2).toUpperCase() ?? 'MD'}</span>
          <LogoutButton />
        </div>
      </header>

      <nav className="bottom-nav" aria-label="Navegación principal">
        <Link href={groupId ? `/group/${groupId}` : '/login'}>Panel</Link>
        <Link href={groupId ? `/group/${groupId}/history` : '/login'}>Historial</Link>
        <Link href={groupId ? `/group/${groupId}/checklist` : '/login'}>Checklist</Link>
      </nav>

      <section className="content-stack">{children}</section>
    </main>
  );
}
