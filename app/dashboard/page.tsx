import { ensureProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";

export default async function DashboardPage() {
  const { profile, error } = await ensureProfile();

  return (
    <main className="space-y-6">
      <Card className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Bienvenida</p>
        <h2 className="mt-3 font-display text-3xl text-on-surface">{profile?.full_name ?? profile?.email ?? "Tu grupo estará listo aquí"}</h2>
        <p className="mt-3 text-sm text-secondary">
          {error ?? "Autenticación resuelta. Las siguientes épicas construirán eventos, votaciones e historial sobre esta base."}
        </p>
      </Card>
    </main>
  );
}
