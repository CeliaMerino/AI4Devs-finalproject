import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getMonthlyStats } from '../api/client';
import { FormatBreakdown } from '../components/FormatBreakdown';
import { GenreDistributionChart } from '../components/GenreDistributionChart';
import { KpiCard } from '../components/KpiCard';
import './StatsPage.css';

interface YearMonth {
  year: number;
  month: number;
}

function currentUtcYearMonth(): YearMonth {
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

function toMonthInputValue({ year, month }: YearMonth): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function parseMonthInputValue(value: string): YearMonth | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) {
    return null;
  }
  return { year, month };
}

function formatAverageRating(value: number | null): string {
  if (value === null) {
    return '—';
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function StatsPage() {
  const [period, setPeriod] = useState<YearMonth>(currentUtcYearMonth);

  const { data, isLoading, error } = useQuery({
    queryKey: ['stats', period.year, period.month],
    queryFn: () => getMonthlyStats(period.year, period.month),
  });

  const handleMonthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseMonthInputValue(event.target.value);
    if (parsed) {
      setPeriod(parsed);
    }
  };

  const isEmpty = data !== undefined && data.books_read === 0;

  return (
    <div className="stats-page">
      <header className="stats-header">
        <nav className="stats-nav">
          <Link to="/">Home</Link>
          <Link to="/book-tracker">Book Tracker</Link>
          <Link to="/lists">Lists</Link>
          <span className="stats-nav__current">Reading Stats</span>
        </nav>
        <h1>Reading Stats</h1>
        <label className="stats-month-picker">
          Mes
          <input
            type="month"
            value={toMonthInputValue(period)}
            onChange={handleMonthChange}
          />
        </label>
      </header>

      <main className="stats-main">
        {isLoading && <p aria-busy="true">Cargando estadísticas…</p>}

        {error && (
          <p role="alert" className="stats-error">
            No se pudieron cargar las estadísticas.
          </p>
        )}

        {data && !isLoading && !error && (
          <>
            <section className="stats-kpis" aria-label="Indicadores del mes">
              <KpiCard
                label="Libros leídos"
                value={data.books_read.toLocaleString()}
              />
              <KpiCard
                label="Páginas leídas"
                value={data.pages_read.toLocaleString()}
              />
              <KpiCard
                label="Valoración media"
                value={formatAverageRating(data.average_rating)}
              />
            </section>

            {isEmpty ? (
              <p className="stats-empty">
                No hay libros marcados como leídos en este mes.
              </p>
            ) : (
              <div className="stats-charts">
                <GenreDistributionChart
                  distribution={data.genre_distribution}
                />
                <FormatBreakdown
                  distribution={data.format_distribution}
                  predominantFormat={data.predominant_format}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
