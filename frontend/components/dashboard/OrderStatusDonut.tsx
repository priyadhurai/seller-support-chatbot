"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { OrderStatusCount } from "@/lib/api";
import { CHART_COLORS } from "@/lib/chart-theme";

// Fixed per-status color assignment (identity, not magnitude) drawn from the
// validated categorical palette — never reassigned based on which statuses
// are present, so a status always reads the same color everywhere.
const STATUS_COLORS: Record<string, string> = {
  pending: "#eda100", // yellow
  shipped: "#2a78d6", // blue
  delivered: "#1baf7a", // aqua/green
  cancelled: "#e34948", // red
  returned: "#4a3aa7", // violet
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

export default function OrderStatusDonut({ data }: { data: OrderStatusCount[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return <p className="text-sm text-slate-400">No orders in this period.</p>;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-[160px] h-[160px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="status" innerRadius={50} outerRadius={78} paddingAngle={2} stroke={CHART_COLORS.surface} strokeWidth={2}>
              {data.map((d) => (
                <Cell key={d.status} fill={STATUS_COLORS[d.status] ?? CHART_COLORS.textMuted} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload as OrderStatusCount;
                return (
                  <div
                    style={{
                      background: CHART_COLORS.surface,
                      border: `1px solid ${CHART_COLORS.gridline}`,
                      borderRadius: 6,
                      padding: "6px 10px",
                      fontSize: 12,
                    }}
                  >
                    {STATUS_LABELS[d.status] ?? d.status}: <strong>{d.count}</strong>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-semibold text-slate-900">{total}</span>
          <span className="text-xs text-slate-400">Orders</span>
        </div>
      </div>

      <ul className="space-y-1.5 flex-1 min-w-0">
        {data.map((d) => (
          <li key={d.status} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-600 truncate">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: STATUS_COLORS[d.status] ?? CHART_COLORS.textMuted }} />
              {STATUS_LABELS[d.status] ?? d.status}
            </span>
            <span className="font-medium text-slate-900">{d.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
