interface KpiCardProps {
  label: string;
  value: string;
}

export function KpiCard({ label, value }: KpiCardProps) {
  return (
    <div className="kpi-card">
      <span className="kpi-card__value">{value}</span>
      <span className="kpi-card__label">{label}</span>
    </div>
  );
}
