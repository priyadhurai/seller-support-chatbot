"use client";

import { useCallback, useEffect, useState } from "react";
import { DollarSign, ShoppingCart, Package, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  DailySales,
  DashboardSummary,
  getDailySales,
  getDashboardSummary,
  getLowStockInventory,
  getOrderStatusBreakdown,
  getTopProducts,
  InventoryItem,
  OrderStatusCount,
  Period,
  TopProductTrend,
} from "@/lib/api";
import { formatCurrency } from "@/lib/chart-theme";
import StatCard from "@/components/dashboard/StatCard";
import SalesOverviewChart from "@/components/dashboard/SalesOverviewChart";
import OrderStatusDonut from "@/components/dashboard/OrderStatusDonut";
import TopProductsTable from "@/components/dashboard/TopProductsTable";
import LowStockAlerts from "@/components/dashboard/LowStockAlerts";
import QuickActions from "@/components/dashboard/QuickActions";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function DashboardHomePage() {
  const { seller } = useAuth();
  const [period, setPeriod] = useState<Period>("7d");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [daily, setDaily] = useState<DailySales[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<OrderStatusCount[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductTrend[]>([]);
  const [lowStock, setLowStock] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      getDashboardSummary(period),
      getDailySales(period),
      getOrderStatusBreakdown(period),
      getTopProducts(period, 5),
      getLowStockInventory(),
    ])
      .then(([s, d, o, t, l]) => {
        setSummary(s);
        setDaily(d);
        setStatusBreakdown(o);
        setTopProducts(t);
        setLowStock(l);
      })
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {greeting()}, {seller?.name.split(" ")[0]}! 👋
          </h1>
          <p className="text-sm text-slate-500">Here&apos;s what&apos;s happening with your store today.</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
        >
          {PERIOD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {loading || !summary ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Sales"
              value={formatCurrency(summary.total_revenue.value)}
              deltaPct={summary.total_revenue.delta_pct}
              icon={DollarSign}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
            />
            <StatCard
              label="Total Orders"
              value={summary.total_orders.value.toLocaleString("en-IN")}
              deltaPct={summary.total_orders.delta_pct}
              icon={ShoppingCart}
              iconBg="bg-violet-50"
              iconColor="text-violet-600"
            />
            <StatCard
              label="Units Sold"
              value={summary.units_sold.value.toLocaleString("en-IN")}
              deltaPct={summary.units_sold.delta_pct}
              icon={Package}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
            />
            <StatCard
              label="New Customers"
              value={summary.new_customers.value.toLocaleString("en-IN")}
              deltaPct={summary.new_customers.delta_pct}
              icon={Users}
              iconBg="bg-pink-50"
              iconColor="text-pink-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h2 className="font-semibold text-slate-900 mb-1">Sales Overview</h2>
              <p className="text-xs text-slate-400 mb-3">Revenue per day</p>
              <SalesOverviewChart data={daily} />
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h2 className="font-semibold text-slate-900 mb-3">Order Status</h2>
              <OrderStatusDonut data={statusBreakdown} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h2 className="font-semibold text-slate-900 mb-3">Top Selling Products</h2>
              <TopProductsTable data={topProducts} />
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h2 className="font-semibold text-slate-900 mb-3">Low Stock Alerts</h2>
              <LowStockAlerts items={lowStock} onRestocked={load} />
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-slate-900 mb-3">Quick Actions</h2>
            <QuickActions />
          </div>
        </>
      )}
    </div>
  );
}
