import Link from 'next/link';

import { GoogleSignInButton } from '@/components/google-sign-in-button';

const overviewCards = [
  { title: 'Invitaciones inteligentes', description: 'Gestioná RSVPs, recordatorios y seguimiento del grupo en un solo lugar.' },
  { title: 'Votación mensual', description: 'Elegí el próximo venue con una experiencia visual simple y mobile-first.' },
  { title: 'Checklist del curador', description: 'Seguí el progreso del evento desde la creación hasta el cierre de la cena.' },
];

export default function HomePage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  return (
    <main className="landing-page">
      <div className="ambient ambient-left" aria-hidden="true" />
      <div className="ambient ambient-right" aria-hidden="true" />

      <section className="auth-shell">
        <div className="auth-card auth-card--hero">
          <p className="brand-mark">monthly-dinner</p>
          <h1>Coordinate your monthly dinners, effortlessly</h1>
          <p className="auth-copy">
            Entrá con Google para continuar a tu grupo, retomar tu contexto y organizar cada cena con una UI más cuidada.
          </p>

          <div className="auth-spotlight" aria-hidden="true">
            <div className="auth-spotlight__ring">
              <span>🍴</span>
            </div>
          </div>

          <GoogleSignInButton nextPath={searchParams?.next} />

          <p className="auth-footer-copy">
            ¿Primera vez por acá? <Link href="/dashboard">Explorá una vista de ejemplo</Link>
          </p>
        </div>

        <p className="curation-caption">The Curated Table © 2024</p>
      </section>

      <section className="landing-preview" aria-label="Vista previa del producto">
        <div className="landing-preview__header">
          <div>
            <p className="eyebrow">Current poll</p>
            <h2>Una experiencia de producto más editorial</h2>
            <p>
              Inspirada en tus referencias: navegación limpia, bloques amplios, tarjetas redondeadas y jerarquía tipográfica marcada.
            </p>
          </div>
          <Link href="/dashboard" className="preview-link">
            Ver dashboard
          </Link>
        </div>

        <div className="overview-grid">
          {overviewCards.map((card) => (
            <article key={card.title} className="overview-card">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
