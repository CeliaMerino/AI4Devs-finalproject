import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getMonthlyStats } from '../api/client';
import { FormatBreakdown } from '../components/FormatBreakdown';
import { GenreDistributionChart } from '../components/GenreDistributionChart';
import { KpiCard } from '../components/KpiCard';
import { PageHeader } from '../components/ui';
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
      <PageHeader
        title="Reading Stats"
        subtitle="Visualiza tus métricas mensuales y distribuciones de lectura."
        actions={
          <label className="stats-month-picker" htmlFor="stats-month">
            <span className="stats-month-picker__label">Mes</span>
            <input
              id="stats-month"
              className="stats-month-picker__input"
              type="month"
              value={toMonthInputValue(period)}
              onChange={handleMonthChange}
            />
          </label>
        }
      />

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
              <section className="stats-charts" aria-label="Gráficos del mes">
                <GenreDistributionChart
                  distribution={data.genre_distribution}
                />
                <FormatBreakdown
                  distribution={data.format_distribution}
                  predominantFormat={data.predominant_format}
                />
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
