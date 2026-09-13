"use client";

import { useEffect, useState } from "react";
import { getOrders, Order, OrderStatus } from "@/lib/api";

const STATUS_OPTIONS: (OrderStatus | "all")[] = ["all", "pending", "shipped", "delivered", "cancelled"];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function OrdersPanel({ refreshKey }: { refreshKey: number }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getOrders(status === "all" ? undefined : status)
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [status, refreshKey]);

  return (
    <section className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-slate-900">Orders</h2>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus | "all")}
          className="text-sm border border-slate-300 rounded-md px-2 py-1"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-slate-400">No orders found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3">Order #</th>
                <th className="py-2 pr-3">Product</th>
                <th className="py-2 pr-3">Qty</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Buyer</th>
                <th className="py-2 pr-3">Location</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 pr-3 font-medium">{o.order_number}</td>
                  <td className="py-2 pr-3">{o.product_name}</td>
                  <td className="py-2 pr-3">{o.quantity}</td>
                  <td className="py-2 pr-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.status]}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-slate-500">{o.order_date}</td>
                  <td className="py-2 pr-3">{o.buyer_name}</td>
                  <td className="py-2 pr-3 text-slate-500">{o.buyer_location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
