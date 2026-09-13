"use client";

import { useState } from "react";
import OrdersPanel from "@/components/OrdersPanel";
import CsvUpload from "@/components/CsvUpload";

export default function OrdersPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Orders</h1>
      <CsvUpload fixedKind="orders" onImported={() => setRefreshKey((k) => k + 1)} />
      <OrdersPanel refreshKey={refreshKey} />
    </div>
  );
}
