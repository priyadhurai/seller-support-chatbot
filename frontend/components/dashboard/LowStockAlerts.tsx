"use client";

import { useState } from "react";
import { PackageX } from "lucide-react";
import { InventoryItem, updateInventoryItem } from "@/lib/api";

export default function LowStockAlerts({ items, onRestocked }: { items: InventoryItem[]; onRestocked: () => void }) {
  const [restockingId, setRestockingId] = useState<number | null>(null);

  async function restock(item: InventoryItem) {
    setRestockingId(item.id);
    try {
      // Bumps stock to comfortably above the threshold. This only updates
      // our own inventory record — it doesn't place a purchase order with a
      // supplier or call any external system.
      await updateInventoryItem(item.id, { quantity: item.low_stock_threshold * 3 });
      onRestocked();
    } finally {
      setRestockingId(null);
    }
  }

  if (items.length === 0) {
    return <p className="text-sm text-slate-400">Nothing is low on stock right now.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 py-1.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
              <PackageX size={15} className="text-red-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{item.product_name}</p>
              <p className="text-xs text-slate-400">
                {item.quantity === 0 ? "Out of stock" : `${item.quantity} unit${item.quantity === 1 ? "" : "s"} left`}
              </p>
            </div>
          </div>
          <button
            onClick={() => restock(item)}
            disabled={restockingId === item.id}
            className="text-xs font-medium rounded-md bg-slate-900 text-white px-3 py-1.5 hover:bg-slate-800 disabled:opacity-50 shrink-0"
          >
            {restockingId === item.id ? "Restocking…" : "Restock"}
          </button>
        </li>
      ))}
    </ul>
  );
}
