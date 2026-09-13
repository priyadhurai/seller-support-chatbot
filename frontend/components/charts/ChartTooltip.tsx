import { CHART_COLORS, formatCurrency } from "@/lib/chart-theme";

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  revenue?: number;
  unitsSold?: number;
}

export default function ChartTooltip({ active, label, revenue, unitsSold }: ChartTooltipProps) {
  if (!active || revenue === undefined) return null;
  return (
    <div
      style={{
        background: CHART_COLORS.surface,
        border: `1px solid ${CHART_COLORS.gridline}`,
        borderRadius: 6,
        padding: "6px 10px",
        boxShadow: "0 2px 8px rgba(11,11,11,0.08)",
      }}
    >
      <div style={{ color: CHART_COLORS.textSecondary, fontSize: 12, marginBottom: 2 }}>{label}</div>
      <div style={{ color: CHART_COLORS.textPrimary, fontSize: 13, fontWeight: 600 }}>
        Revenue: {formatCurrency(revenue)}
      </div>
      {unitsSold !== undefined && (
        <div style={{ color: CHART_COLORS.textSecondary, fontSize: 12 }}>{unitsSold.toLocaleString("en-IN")} units sold</div>
      )}
    </div>
  );
}
