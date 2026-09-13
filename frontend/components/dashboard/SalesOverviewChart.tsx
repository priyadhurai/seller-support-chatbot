"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DailySales } from "@/lib/api";
import { AXIS_TICK_STYLE, CHART_COLORS, formatCurrencyCompact } from "@/lib/chart-theme";
import ChartTooltip from "../charts/ChartTooltip";

function formatDay(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function SalesOverviewChart({ data }: { data: DailySales[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400">Not enough order data yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 16, right: 16, bottom: 4, left: 4 }}>
        <defs>
          <linearGradient id="salesOverviewFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.series} stopOpacity={0.15} />
            <stop offset="100%" stopColor={CHART_COLORS.series} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={CHART_COLORS.gridline} strokeWidth={1} />
        <XAxis dataKey="date" tickFormatter={formatDay} tick={AXIS_TICK_STYLE} axisLine={{ stroke: CHART_COLORS.baseline }} tickLine={false} />
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
              label={formatDay(label as string | undefined)}
              revenue={payload?.[0]?.payload?.total_revenue}
              unitsSold={undefined}
            />
          )}
        />
        <Area
          dataKey="total_revenue"
          stroke={CHART_COLORS.series}
          strokeWidth={2}
          fill="url(#salesOverviewFill)"
          dot={{ r: 3, fill: CHART_COLORS.series, stroke: CHART_COLORS.surface, strokeWidth: 1.5 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
