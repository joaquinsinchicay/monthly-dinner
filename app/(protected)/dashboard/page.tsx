import { AppContent } from '@/components/layout/app-content';
import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Card } from '@/components/ui';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-surface pb-24 md:pb-0">
      <AppHeader />
      <div className="mx-auto flex max-w-6xl gap-6 px-4 pt-24 md:px-6">
        <AppSidebar />
        <AppContent>
          <section className="grid gap-6 md:grid-cols-2">
            <Card className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-on-surface-variant">Panel principal</p>
              <h2 className="text-3xl font-semibold tracking-tight">Base de autenticación lista</h2>
              <p className="text-base leading-7 text-on-surface-variant">
                Ya podés reutilizar esta sesión para login recurrente, cierre de sesión, invitaciones por link y el
                dashboard mensual del grupo.
              </p>
            </Card>
            <Card className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-on-surface-variant">Schema MVP</p>
              <ul className="space-y-3 text-base leading-7 text-on-surface-variant">
                <li>• `profiles` sincronizado con `auth.users` por trigger.</li>
                <li>• `groups` con `invite_token` para US-04.</li>
                <li>• `group_members` para aislamiento por membresía.</li>
                <li>• `events` listo para E02.</li>
              </ul>
            </Card>
          </section>
        </AppContent>
      </div>
    </div>
  );
}
