import type { AudienceCount, AudienceType } from '../../api/types';
import { formatAudience } from '../../lib/audience';
import { ChartCard } from '../ui';
import { PieChart, type PieSlice } from './PieChart';
import './PieChart.css';

const AUDIENCE_LABELS: Record<string, string> = {
  unknown: 'Sin audiencia',
};

function audienceLabel(audience: string): string {
  if (audience in AUDIENCE_LABELS) {
    return AUDIENCE_LABELS[audience];
  }
  return formatAudience(audience as AudienceType);
}

interface AudiencePieChartProps {
  distribution: AudienceCount[];
}

export function AudiencePieChart({ distribution }: AudiencePieChartProps) {
  if (distribution.length === 0) {
    return null;
  }

  const slices: PieSlice[] = distribution.map((entry) => ({
    key: entry.audience,
    label: audienceLabel(entry.audience),
    count: entry.count,
  }));

  return (
    <ChartCard
      className="audience-pie-chart"
      title="Distribución por audiencia"
      subtitle="Young adult, new adult y adulto."
    >
      <PieChart slices={slices} />
    </ChartCard>
  );
}
