"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ProductPerformance } from "@/lib/api";
import { AXIS_TICK_STYLE, CHART_COLORS, formatCurrency, formatCurrencyCompact } from "@/lib/chart-theme";
import ChartTooltip from "./ChartTooltip";

export default function ProductPerformanceChart({ data }: { data: ProductPerformance[] }) {
  const sorted = [...data].sort((a, b) => b.total_revenue - a.total_revenue);

  if (sorted.length === 0) {
    return <p className="text-sm text-slate-400">Not enough order data yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, sorted.length * 40)}>
      <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 48, bottom: 4, left: 4 }} barCategoryGap="20%">
        <CartesianGrid horizontal={false} stroke={CHART_COLORS.gridline} strokeWidth={1} />
        <XAxis
          type="number"
          tickFormatter={formatCurrencyCompact}
          tick={AXIS_TICK_STYLE}
          axisLine={{ stroke: CHART_COLORS.baseline }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="product_name"
          width={140}
          tick={AXIS_TICK_STYLE}
          axisLine={{ stroke: CHART_COLORS.baseline }}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: CHART_COLORS.gridline, opacity: 0.4 }}
          content={({ active, payload, label }) => (
            <ChartTooltip
              active={active}
              label={label}
              revenue={payload?.[0]?.payload?.total_revenue}
              unitsSold={payload?.[0]?.payload?.total_quantity}
            />
          )}
        />
        <Bar dataKey="total_revenue" fill={CHART_COLORS.series} radius={[0, 4, 4, 0]} maxBarSize={24}>
          <LabelList
            dataKey="total_revenue"
            position="right"
            formatter={(value: React.ReactNode) => formatCurrency(value as number)}
            style={{ fill: CHART_COLORS.textSecondary, fontSize: 12 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
