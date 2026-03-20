import { AuthShell } from '@/components/layout/auth-shell';
import { GoogleSignInButton } from '@/components/google-sign-in-button';
import { Logo } from '@/components/shared/logo';
import { Card } from '@/components/ui';

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { next?: string; message?: string; error?: string };
}) {
  const infoMessage =
    searchParams?.message === 'cancelled'
      ? 'Cancelaste la autorización de Google. Cuando quieras, podés intentarlo de nuevo.'
      : null;
  const errorMessage =
    searchParams?.error === 'oauth_failed'
      ? 'Hubo un problema al conectar con Google. Reintentá para continuar.'
      : null;

  return (
    <AuthShell>
      <Card className="space-y-6 p-8 md:p-10">
        <div className="space-y-4">
          <Logo />
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-on-surface-variant">
              Monthly Dinner · US-01
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-on-surface md:text-5xl">
              Entrá con Google y empezá a organizar tu cena mensual.
            </h1>
            <p className="text-base leading-7 text-on-surface-variant">
              Este acceso crea o reutiliza tu perfil en Supabase Auth, deja lista la sesión del MVP y prepara la base
              para grupos, invitaciones y eventos.
            </p>
          </div>
        </div>

        <div className="grid gap-4 rounded-xl bg-surface-container-low p-5 text-sm text-on-surface-variant">
          <p>• Si tu email ya existe, iniciarás sesión sin perfiles duplicados.</p>
          <p>• Si cancelás el popup, volverás acá con un mensaje suave.</p>
          <p>• Si Google falla, podrás reintentar sin sesiones parciales.</p>
        </div>

        {infoMessage ? <p className="rounded-xl bg-surface-container px-4 py-3 text-sm text-secondary">{infoMessage}</p> : null}
        {errorMessage ? <p className="rounded-xl border border-error/20 bg-red-50 px-4 py-3 text-sm text-error">{errorMessage}</p> : null}

        <GoogleSignInButton nextPath={searchParams?.next} />
      </Card>
    </AuthShell>
  );
}
