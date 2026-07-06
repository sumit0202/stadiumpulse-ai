interface KpiCardProps {
  label: string;
  value: number;
  unit?: string;
}

/** A single KPI tile showing a numeric value with an optional (decorative) unit. */
export function KpiCard({ label, value, unit }: KpiCardProps) {
  return (
    <div className="card kpi">
      <span className="value">
        {value}
        {unit ? <span aria-hidden="true">{unit}</span> : null}
      </span>
      <span className="label">{label}</span>
    </div>
  );
}
