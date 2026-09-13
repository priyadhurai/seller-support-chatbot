import { TrendingUp, TrendingDown } from "lucide-react";
import { TopProductTrend } from "@/lib/api";
import { formatCurrency } from "@/lib/chart-theme";

export default function TopProductsTable({ data }: { data: TopProductTrend[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400">No sales in this period yet.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-slate-500 border-b border-slate-200">
          <th className="py-2 pr-3 w-6">#</th>
          <th className="py-2 pr-3">Product</th>
          <th className="py-2 pr-3">Units Sold</th>
          <th className="py-2 pr-3">Revenue</th>
          <th className="py-2 pr-3">Trend</th>
        </tr>
      </thead>
      <tbody>
        {data.map((p, i) => {
          const up = p.trend_pct >= 0;
          return (
            <tr key={p.product_name} className="border-b border-slate-100 last:border-0">
              <td className="py-2 pr-3 text-slate-400">{i + 1}</td>
              <td className="py-2 pr-3 font-medium text-slate-900">{p.product_name}</td>
              <td className="py-2 pr-3 text-slate-600">{p.total_quantity}</td>
              <td className="py-2 pr-3 text-slate-600">{formatCurrency(p.total_revenue)}</td>
              <td className={`py-2 pr-3 font-medium flex items-center gap-1 ${up ? "text-green-600" : "text-red-600"}`}>
                {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {Math.abs(p.trend_pct)}%
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
