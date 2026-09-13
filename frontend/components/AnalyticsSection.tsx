"use client";

import { useEffect, useState } from "react";
import {
  getMonthlySales,
  getProductPerformance,
  getRevenueSummary,
  getSalesByLocation,
  LocationSales,
  MonthlySales,
  ProductPerformance,
  RevenueSummary,
} from "@/lib/api";
import { formatCurrency } from "@/lib/chart-theme";
import ProductPerformanceChart from "./charts/ProductPerformanceChart";
import MonthlySalesChart from "./charts/MonthlySalesChart";
import LocationSalesChart from "./charts/LocationSalesChart";

function StatTile({ label, value, hero = false }: { label: string; value: string; hero?: boolean }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={hero ? "text-3xl font-semibold text-slate-900" : "text-xl font-semibold text-slate-900"}>{value}</p>
    </div>
  );
}

export default function AnalyticsSection({ refreshKey }: { refreshKey: number }) {
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [products, setProducts] = useState<ProductPerformance[]>([]);
  const [monthly, setMonthly] = useState<MonthlySales[]>([]);
  const [locations, setLocations] = useState<LocationSales[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([getRevenueSummary(), getProductPerformance(), getMonthlySales(), getSalesByLocation()])
      .then(([r, p, m, l]) => {
        setRevenue(r);
        setProducts(p);
        setMonthly(m);
        setLocations(l);
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return (
    <section className="space-y-4">
      <h2 className="font-semibold text-slate-900 text-lg">Sales analytics</h2>
      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : (
        <>
          {revenue && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatTile label="Total revenue" value={formatCurrency(revenue.total_revenue)} hero />
              <StatTile label="Total orders" value={revenue.total_orders.toLocaleString("en-IN")} />
              <StatTile label="Average order value" value={formatCurrency(revenue.average_order_value)} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-1">Product performance</h3>
              <p className="text-xs text-slate-400 mb-3">Revenue by product (cancelled orders excluded)</p>
              <ProductPerformanceChart data={products} />
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-1">Sales by location</h3>
              <p className="text-xs text-slate-400 mb-3">Revenue by buyer city</p>
              <LocationSalesChart data={locations} />
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4 lg:col-span-2">
              <h3 className="font-semibold text-slate-900 mb-1">Monthly sales trend</h3>
              <p className="text-xs text-slate-400 mb-3">Revenue per month</p>
              <MonthlySalesChart data={monthly} />
            </div>
          </div>
        </>
      )}
    </section>
  );
}
