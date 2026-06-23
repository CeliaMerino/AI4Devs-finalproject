import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
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
        <nav className="home-nav">
          <span className="home-nav__current">Home</span>
          <Link to="/book-tracker">Book Tracker</Link>
          <Link to="/lists">Lists</Link>
          <Link to="/stats">Reading Stats</Link>
        </nav>
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
