// Validated single-hue chart palette (light mode only — this app doesn't
// theme charts for dark mode). Source: dataviz skill's reference palette.
export const CHART_COLORS = {
  series: "#2a78d6",
  textPrimary: "#0b0b0b",
  textSecondary: "#52514e",
  textMuted: "#898781",
  gridline: "#e1e0d9",
  baseline: "#c3c2b7",
  surface: "#fcfcfb",
};

export const AXIS_TICK_STYLE = { fill: CHART_COLORS.textMuted, fontSize: 12 };

export function formatCount(value: number): string {
  return value.toLocaleString("en-IN");
}

export function formatCurrency(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export function formatCurrencyCompact(value: number): string {
  if (value >= 1_000_000) return `₹${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(1)}K`;
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}
