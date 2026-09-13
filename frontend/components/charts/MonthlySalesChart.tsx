"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MonthlySales } from "@/lib/api";
import { AXIS_TICK_STYLE, CHART_COLORS, formatCurrency, formatCurrencyCompact } from "@/lib/chart-theme";
import ChartTooltip from "./ChartTooltip";

function formatMonth(month?: string): string {
  if (!month) return "";
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export default function MonthlySalesChart({ data }: { data: MonthlySales[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400">Not enough order data yet.</p>;
  }

  const lastMonth = data[data.length - 1]?.month;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 16, right: 24, bottom: 4, left: 4 }}>
        <CartesianGrid vertical={false} stroke={CHART_COLORS.gridline} strokeWidth={1} />
        <XAxis
          dataKey="month"
          tickFormatter={formatMonth}
          tick={AXIS_TICK_STYLE}
          axisLine={{ stroke: CHART_COLORS.baseline }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatCurrencyCompact}
          tick={AXIS_TICK_STYLE}
          axisLine={{ stroke: CHART_COLORS.baseline }}
          tickLine={false}
        />
        <Tooltip
          cursor={{ stroke: CHART_COLORS.baseline, strokeWidth: 1 }}
          content={({ active, payload, label }) => (
            <ChartTooltip
              active={active}
              label={formatMonth(label as string | undefined)}
              revenue={payload?.[0]?.payload?.total_revenue}
              unitsSold={payload?.[0]?.payload?.total_quantity}
            />
          )}
        />
        <Line
          dataKey="total_revenue"
          stroke={CHART_COLORS.series}
          strokeWidth={2}
          dot={{ r: 4, fill: CHART_COLORS.series, stroke: CHART_COLORS.surface, strokeWidth: 2 }}
          activeDot={{ r: 5 }}
          label={(props: unknown) => {
            const { x, y, index, value } = props as {
              x?: number | string;
              y?: number | string;
              index?: number;
              value?: number | string | null;
            };
            if (data[index ?? -1]?.month !== lastMonth || x === undefined || y === undefined) return <g />;
            return (
              <text x={x} y={Number(y) - 12} textAnchor="middle" fontSize={12} fontWeight={600} fill={CHART_COLORS.textPrimary}>
                {formatCurrency(Number(value ?? 0))}
              </text>
            );
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
