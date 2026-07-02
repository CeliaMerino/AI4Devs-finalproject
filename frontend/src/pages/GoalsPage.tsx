import { useQuery } from '@tanstack/react-query';
import { getAnnualGoal } from '../api/client';
import { AnnualGoalCard } from '../components/AnnualGoalCard';
import { Card, PageHeader } from '../components/ui';
import './GoalsPage.css';

function currentUtcYear(): number {
  return new Date().getUTCFullYear();
}

export function GoalsPage() {
  const year = currentUtcYear();
  const { data, isLoading, error } = useQuery({
    queryKey: ['goals', year],
    queryFn: () => getAnnualGoal(year),
  });

  return (
    <div className="goals-page">
      <PageHeader
        title="Goals"
        subtitle="Configura tu meta anual y sigue tu progreso lector."
      />

      <main className="goals-main" aria-label="Annual goals overview">
        <section className="goals-main__primary" aria-label={`Goal details ${year}`}>
          <AnnualGoalCard
            year={year}
            data={data}
            isLoading={isLoading}
            error={error}
          />
        </section>

        <Card title="Forecast" className="goals-side-card">
          <p className="goals-side-card__text">
            Esta vista centraliza tu objetivo anual con la misma lógica que Home,
            para que puedas revisar rápidamente tu ritmo y ajustar la meta cuando lo necesites.
          </p>
          <p className="goals-side-card__text goals-side-card__text--muted">
            Próximamente se añadirá histórico de objetivos y comparación anual.
          </p>
        </Card>
      </main>
    </div>
  );
}
