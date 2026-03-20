import { AppContent } from '@/components/layout/app-content';
import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Card } from '@/components/ui';

export default function DashboardPage() {
  return (
    <div className="app-layout">
      <AppSidebar />
      <AppContent>
        <AppHeader />
        <section className="app-dashboard-grid">
          <Card>
            <p className="eyebrow">Próximo paso</p>
            <h2 className="hero-title">Módulo de grupos</h2>
            <p className="body-text">
              La Etapa 1 deja listo el shell visual para construir listado de grupos, detalle e invitaciones.
            </p>
          </Card>
          <Card>
            <p className="eyebrow">Roadmap UX/UI</p>
            <p className="metric-card__value">3 foundations</p>
            <ul className="metric-card__list">
              <li>tokens visuales</li>
              <li>componentes base reutilizables</li>
              <li>layout protegido responsivo</li>
            </ul>
          </Card>
        </section>
      </AppContent>
    </div>
  );
}
