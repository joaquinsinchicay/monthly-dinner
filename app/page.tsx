import { AuthShell } from '@/components/layout/auth-shell';
import { Logo } from '@/components/shared/logo';
import { Card } from '@/components/ui';
import { GoogleSignInButton } from '@/components/google-sign-in-button';

export default function HomePage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  return (
    <AuthShell>
      <Card>
        <div className="logo-lockup">
          <Logo />
          <div>
            <p className="eyebrow">Monthly Dinner MVP v1.0</p>
            <h1 className="hero-title">Entrá con Google para coordinar tus grupos.</h1>
          </div>
        </div>
        <div className="stack">
          <p className="body-text">
            Si ya existe una cuenta con tu email, Supabase iniciará sesión en el usuario existente sin duplicar
            perfiles.
          </p>
          <p className="body-text">
            Si tu sesión sigue vigente en este dispositivo, te llevaremos directamente al panel sin pedirte volver
            a autenticarte.
          </p>
        </div>
        <GoogleSignInButton nextPath={searchParams?.next} />
      </Card>
    </AuthShell>
  );
}
