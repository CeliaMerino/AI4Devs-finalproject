import { useQuery } from '@tanstack/react-query';
import { getAnnualGoal } from '../api/client';
import { AnnualGoalCard } from '../components/AnnualGoalCard';
import { Badge, Card, PageHeader } from '../components/ui';
import './HomePage.css';

function currentUtcYear(): number {
  return new Date().getUTCFullYear();
}

export function HomePage() {
  const year = currentUtcYear();

  const { data, isLoading, error } = useQuery({
    queryKey: ['goals', year],
    queryFn: () => getAnnualGoal(year),
  });

  return (
    <div className="home-page">
      <PageHeader
        title="Reading Analytics"
        subtitle="Resumen visual de tu progreso lector actual."
      />

      <main className="home-main" aria-label="Resumen de inicio">
        <section className="home-grid" aria-label="Secciones principales">
          <Card className="home-card" title="Libros en curso">
            <Badge variant="accent">Próximamente</Badge>
            <p className="home-card__text">
              Este bloque mostrará tus lecturas activas y su progreso.
            </p>
          </Card>

          <Card className="home-card" title="KPIs del mes">
            <Badge variant="kpi">Próximamente</Badge>
            <p className="home-card__text">
              Aquí verás páginas leídas, ritmo mensual y comparativas rápidas.
            </p>
          </Card>

          <section className="home-card home-card--goal" aria-label={`Meta anual ${year}`}>
            <AnnualGoalCard
              year={year}
              data={data}
              isLoading={isLoading}
              error={error}
            />
          </section>

          <Card className="home-card" title="TBR actual">
            <Badge variant="default">Próximamente</Badge>
            <p className="home-card__text">
              Este bloque conectará con tu lista mensual para priorizar próximas lecturas.
            </p>
          </Card>
        </section>
      </main>
    </div>
  );
}
