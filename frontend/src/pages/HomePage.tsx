import { useQuery } from '@tanstack/react-query';
import { getAnnualGoal } from '../api/client';
import { AnnualGoalCard } from '../components/AnnualGoalCard';
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
      <header className="home-header">
        <h1>Reading Analytics</h1>
      </header>

      <main className="home-main">
        <AnnualGoalCard
          year={year}
          data={data}
          isLoading={isLoading}
          error={error}
        />
      </main>
    </div>
  );
}
