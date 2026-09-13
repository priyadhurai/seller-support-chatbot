import { TrendingUp, TrendingDown } from "lucide-react";
import { SalesSummaryCard as SalesSummaryCardData } from "@/lib/api";
import { formatCurrency } from "@/lib/chart-theme";

function DeltaBadge({ pct }: { pct: number }) {
  const up = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? "text-green-600" : "text-red-600"}`}>
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {Math.abs(pct)}%
    </span>
  );
}

const PERIOD_LABEL: Record<string, string> = { "7d": "7 days", "30d": "30 days", "90d": "90 days" };

export default function SalesSummaryCard({ data }: { data: SalesSummaryCardData }) {
  const rows = [
    { label: "Total Sales", value: formatCurrency(data.total_revenue.value), delta: data.total_revenue.delta_pct },
    { label: "Total Orders", value: data.total_orders.value.toLocaleString("en-IN"), delta: data.total_orders.delta_pct },
    { label: "Units Sold", value: data.units_sold.value.toLocaleString("en-IN"), delta: data.units_sold.delta_pct },
    { label: "Average Order Value", value: formatCurrency(data.average_order_value.value), delta: data.average_order_value.delta_pct },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 mt-1">
      <p className="text-xs font-semibold text-slate-500 mb-2">
        Sales summary · last {PERIOD_LABEL[data.period] ?? data.period}
      </p>
      <div className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <span className="text-slate-500">{row.label}</span>
            <span className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-900">{row.value}</span>
              <DeltaBadge pct={row.delta} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
