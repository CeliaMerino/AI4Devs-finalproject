import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getMonthlyStats, getYearlyStats } from '../api/client';
import type { StatsResponse } from '../api/types';
import { AudiencePieChart } from '../components/stats/AudiencePieChart';
import { FormatPieChart } from '../components/stats/FormatPieChart';
import { GenrePieChart } from '../components/stats/GenrePieChart';
import { RatingPieChart } from '../components/stats/RatingPieChart';
import {
  ChartSlotPlaceholder,
  StatsChartsGrid,
} from '../components/stats/StatsChartsGrid';
import '../components/stats/StatsChartsGrid.css';
import '../components/stats/PieChart.css';
import { KpiCard } from '../components/KpiCard';
import { PageHeader } from '../components/ui';
import {
  loadStatsPeriod,
  parseMonthInputValue,
  saveStatsPeriod,
  toMonthInputValue,
  type StatsPeriod,
} from '../lib/statsPeriodStorage';
import { formatAverageRating } from '../lib/rating';
import './StatsPage.css';

function periodLabel(period: StatsPeriod): string {
  if (period.mode === 'year') {
    return `del año ${period.year}`;
  }
  const monthName = new Date(
    Date.UTC(period.year, period.month - 1, 1),
  ).toLocaleString(undefined, { month: 'long', timeZone: 'UTC' });
  return `de ${monthName} ${period.year}`;
}

export function StatsPage() {
  const [period, setPeriod] = useState<StatsPeriod>(loadStatsPeriod);

  useEffect(() => {
    saveStatsPeriod(period);
  }, [period]);

  const { data, isLoading, error } = useQuery<StatsResponse>({
    queryKey:
      period.mode === 'year'
        ? ['stats', 'year', period.year]
        : ['stats', 'month', period.year, period.month],
    queryFn: () =>
      period.mode === 'year'
        ? getYearlyStats(period.year)
        : getMonthlyStats(period.year, period.month),
  });

  const handleModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const mode = event.target.value as StatsPeriod['mode'];
    if (mode === 'year') {
      setPeriod({ mode: 'year', year: period.year });
      return;
    }
    const month =
      period.mode === 'month'
        ? period.month
        : new Date().getUTCMonth() + 1;
    setPeriod({ mode: 'month', year: period.year, month });
  };

  const handleYearChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const year = Number(event.target.value);
    if (!Number.isInteger(year) || year < 1970 || year > 2100) {
      return;
    }
    if (period.mode === 'year') {
      setPeriod({ mode: 'year', year });
      return;
    }
    setPeriod({ ...period, year });
  };

  const handleMonthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseMonthInputValue(event.target.value);
    if (parsed) {
      setPeriod({ mode: 'month', year: parsed.year, month: parsed.month });
    }
  };

  const isEmpty = data !== undefined && data.books_read === 0;
  const periodScope = periodLabel(period);

  return (
    <div className="stats-page">
      <PageHeader
        title="Reading Stats"
        subtitle="Visualiza tus métricas y distribuciones de lectura por año o mes."
        actions={
          <div className="stats-period-filter" role="group" aria-label="Filtro de periodo">
            <label className="stats-period-filter__field" htmlFor="stats-period-mode">
              <span className="stats-period-filter__label">Periodo</span>
              <select
                id="stats-period-mode"
                className="stats-period-filter__input"
                value={period.mode}
                onChange={handleModeChange}
              >
                <option value="year">Año completo</option>
                <option value="month">Mes</option>
              </select>
            </label>

            {period.mode === 'year' ? (
              <label className="stats-period-filter__field" htmlFor="stats-period-year">
                <span className="stats-period-filter__label">Año</span>
                <input
                  id="stats-period-year"
                  className="stats-period-filter__input"
                  type="number"
                  min={1970}
                  max={2100}
                  step={1}
                  value={period.year}
                  onChange={handleYearChange}
                />
              </label>
            ) : (
              <label className="stats-period-filter__field" htmlFor="stats-period-month">
                <span className="stats-period-filter__label">Mes</span>
                <input
                  id="stats-period-month"
                  className="stats-period-filter__input"
                  type="month"
                  value={toMonthInputValue(period)}
                  onChange={handleMonthChange}
                />
              </label>
            )}
          </div>
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
            <section
              className="stats-kpis"
              aria-label={`Indicadores ${periodScope}`}
            >
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
                {period.mode === 'year'
                  ? `No hay libros marcados como leídos en ${period.year}.`
                  : 'No hay libros marcados como leídos en este mes.'}
              </p>
            ) : (
              <StatsChartsGrid
                periodScope={periodScope}
                genreChart={
                  data.genre_distribution.length > 0 ? (
                    <GenrePieChart distribution={data.genre_distribution} />
                  ) : (
                    <ChartSlotPlaceholder
                      title="Distribución por género"
                      subtitle="Comparativa de libros leídos por género."
                      slotLabel="Gráfico de géneros"
                    />
                  )
                }
                formatChart={
                  data.format_distribution.length > 0 ? (
                    <FormatPieChart
                      distribution={data.format_distribution}
                      predominantFormat={data.predominant_format}
                    />
                  ) : (
                    <ChartSlotPlaceholder
                      title="Formato de lectura"
                      subtitle="Resumen de formatos usados en el período."
                      slotLabel="Gráfico de formatos"
                    />
                  )
                }
                audienceChart={
                  data.audience_distribution.length > 0 ? (
                    <AudiencePieChart
                      distribution={data.audience_distribution}
                    />
                  ) : (
                    <ChartSlotPlaceholder
                      title="Distribución por audiencia"
                      subtitle="Young adult, new adult y adulto."
                      slotLabel="Gráfico de audiencia"
                    />
                  )
                }
                ratingChart={
                  data.rating_distribution.length > 0 ? (
                    <RatingPieChart distribution={data.rating_distribution} />
                  ) : (
                    <ChartSlotPlaceholder
                      title="Distribución de puntuaciones"
                      subtitle="Valoraciones asignadas en el período."
                      slotLabel="Gráfico de puntuaciones"
                    />
                  )
                }
                booksBarChart={
                  <ChartSlotPlaceholder
                    title={
                      period.mode === 'year'
                        ? 'Libros por mes'
                        : 'Libros en el mes'
                    }
                    subtitle="Evolución del volumen de lecturas."
                    slotLabel="Gráfico de barras de libros"
                  />
                }
                pagesBarChart={
                  <ChartSlotPlaceholder
                    title={
                      period.mode === 'year'
                        ? 'Páginas por mes'
                        : 'Páginas en el mes'
                    }
                    subtitle="Evolución de páginas leídas."
                    slotLabel="Gráfico de barras de páginas"
                  />
                }
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
