import type { FormatCount } from '../api/types';

interface FormatBreakdownProps {
  distribution: FormatCount[];
  predominantFormat: string | null;
}

const FORMAT_LABELS: Record<string, string> = {
  fisico: 'Físico',
  ebook: 'Ebook',
  audio: 'Audio',
  unknown: 'Sin formato',
};

function formatLabel(format: string): string {
  return FORMAT_LABELS[format] ?? format;
}

export function FormatBreakdown({
  distribution,
  predominantFormat,
}: FormatBreakdownProps) {
  if (distribution.length === 0) {
    return null;
  }

  return (
    <section className="format-breakdown" aria-labelledby="format-breakdown-heading">
      <h3 id="format-breakdown-heading">Formato de lectura</h3>
      {predominantFormat && (
        <p className="format-breakdown__predominant">
          Formato predominante:{' '}
          <strong>{formatLabel(predominantFormat)}</strong>
        </p>
      )}
      <ul className="format-breakdown__list">
        {distribution.map((entry) => (
          <li
            key={entry.format}
            className={
              entry.format === predominantFormat
                ? 'format-breakdown__item format-breakdown__item--predominant'
                : 'format-breakdown__item'
            }
          >
            <span className="format-breakdown__label">
              {formatLabel(entry.format)}
            </span>
            <span className="format-breakdown__count">{entry.count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
