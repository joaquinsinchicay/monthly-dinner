import { BottomNav } from "@/components/shared/BottomNav";
import { SignOutButton } from "@/components/auth/SignOutButton";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface px-4 pb-28 pt-6">
      <header className="mx-auto flex w-full max-w-4xl items-start justify-between gap-4 rounded-2xl bg-surface-lowest p-5 shadow-card">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">monthly-dinner</p>
          <h1 className="mt-2 font-display text-3xl text-on-surface">Panel del grupo</h1>
          <p className="mt-2 text-sm text-secondary">Tu base para coordinar invitaciones, asistencia y turnos mensuales.</p>
        </div>
        <SignOutButton />
      </header>
      <div className="mx-auto mt-6 w-full max-w-4xl">{children}</div>
      <BottomNav pathname="/dashboard" />
    </div>
  );
}
