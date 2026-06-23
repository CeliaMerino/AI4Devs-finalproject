import type { GenreCount } from '../api/types';

interface GenreDistributionChartProps {
  distribution: GenreCount[];
}

const GENRE_LABELS: Record<string, string> = {
  unknown: 'Sin género',
};

function genreLabel(genre: string): string {
  return GENRE_LABELS[genre] ?? genre;
}

export function GenreDistributionChart({
  distribution,
}: GenreDistributionChartProps) {
  if (distribution.length === 0) {
    return null;
  }

  const max = Math.max(...distribution.map((entry) => entry.count));

  return (
    <section
      className="genre-chart"
      aria-labelledby="genre-chart-heading"
    >
      <h3 id="genre-chart-heading">Distribución por género</h3>
      <ul className="genre-chart__list">
        {distribution.map((entry) => {
          const widthPercent = max > 0 ? (entry.count / max) * 100 : 0;
          return (
            <li key={entry.genre} className="genre-chart__row">
              <span className="genre-chart__label">
                {genreLabel(entry.genre)}
              </span>
              <span className="genre-chart__bar-track">
                <span
                  className="genre-chart__bar-fill"
                  style={{ width: `${widthPercent}%` }}
                  role="img"
                  aria-label={`${genreLabel(entry.genre)}: ${entry.count}`}
                />
              </span>
              <span className="genre-chart__count">{entry.count}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
