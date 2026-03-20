import Link from 'next/link';

import { GoogleSignInButton } from '@/components/google-sign-in-button';

const highlights = [
  'Evento mensual con fecha, venue tentativo y estado en tiempo real.',
  'Confirmaciones Va / No va / Tal vez con resumen listo para compartir.',
  'Turno rotativo, votación de restaurantes e historial consultable.',
];

export default function LoginPage({ searchParams }: { searchParams?: { next?: string } }) {
  return (
    <main className="login-page">
      <section className="hero-card surface-card stack-gap-lg">
        <div className="section-header section-header--top">
          <p className="label">The Curated Table</p>
          <p className="body-sm">MVP · Marzo 2026</p>
        </div>
        <div className="stack-gap-sm">
          <h1 className="display-title">Cenas del Jueves</h1>
          <p className="body-md muted-copy">
            Ingresá con Google para crear tu perfil, retomar tu sesión y entrar directo al panel de tu grupo.
          </p>
        </div>
        <GoogleSignInButton nextPath={searchParams?.next ?? '/group/group-curated-table'} />
        <div className="soft-panel stack-gap-sm">
          {highlights.map((item) => (
            <p key={item} className="body-sm">{item}</p>
          ))}
        </div>
        <p className="body-sm muted-copy">
          ¿Tenés un link de invitación? <Link href="/invite/demo-token">Unite al grupo</Link>
        </p>
      </section>
    </main>
  );
}
