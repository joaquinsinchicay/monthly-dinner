import { Card } from "@/components/ui/card";
import { LoginButton } from "@/components/auth/LoginButton";

export function LoginCard({ error, next }: { error?: string; next?: string }) {
  return (
    <Card className="mx-auto w-full max-w-md p-8 shadow-card-md">
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">monthly-dinner</p>
          <h1 className="font-display text-4xl leading-tight text-on-surface">Tu cena mensual, organizada.</h1>
          <p className="text-sm text-secondary">Entra con Google y deja la coordinación fuera de WhatsApp.</p>
        </div>
        <div className="rounded-2xl bg-surface-low p-5">
          <LoginButton next={next} />
          <p className="mt-4 text-sm text-secondary">Si te invitaron, usa el link que recibiste.</p>
          {error ? <p className="mt-4 rounded-2xl bg-error-cont px-4 py-3 text-sm text-error">{error}</p> : null}
        </div>
      </div>
    </Card>
  );
}
