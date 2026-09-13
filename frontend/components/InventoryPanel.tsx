"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { deleteInventoryItem, getInventory, InventoryItem, updateInventoryItem } from "@/lib/api";

interface EditState {
  quantity: string;
  price: string;
  low_stock_threshold: string;
}

export default function InventoryPanel({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editState, setEditState] = useState<EditState>({ quantity: "", price: "", low_stock_threshold: "" });
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    getInventory()
      .then(setItems)
      .finally(() => setLoading(false));
  }

  useEffect(load, [refreshKey]);

  function startEdit(item: InventoryItem) {
    setEditingId(item.id);
    setEditState({
      quantity: String(item.quantity),
      price: String(item.price),
      low_stock_threshold: String(item.low_stock_threshold),
    });
  }

  async function saveEdit(id: number) {
    setSaving(true);
    try {
      const updated = await updateInventoryItem(id, {
        quantity: Number(editState.quantity),
        price: Number(editState.price),
        low_stock_threshold: Number(editState.low_stock_threshold),
      });
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Remove this product from inventory?")) return;
    await deleteInventoryItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <section className="bg-white border border-slate-200 rounded-lg p-4">
      <h2 className="font-semibold text-slate-900 mb-3">Inventory</h2>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-400">No inventory items found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3">SKU</th>
                <th className="py-2 pr-3">Product</th>
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">Price</th>
                <th className="py-2 pr-3">Qty</th>
                <th className="py-2 pr-3">Low-stock threshold</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isLow = item.quantity <= item.low_stock_threshold;
                const editing = editingId === item.id;
                return (
                  <tr key={item.id} className={`border-b border-slate-100 last:border-0 ${isLow && !editing ? "bg-red-50" : ""}`}>
                    <td className="py-2 pr-3 font-medium">{item.sku}</td>
                    <td className="py-2 pr-3" title={item.description ?? undefined}>
                      {item.product_name}
                    </td>
                    <td className="py-2 pr-3 text-slate-500">{item.category}</td>
                    <td className="py-2 pr-3">
                      {editing ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editState.price}
                          onChange={(e) => setEditState((s) => ({ ...s, price: e.target.value }))}
                          className="w-20 border border-slate-300 rounded px-1.5 py-0.5 text-sm"
                        />
                      ) : (
                        `₹${item.price.toLocaleString("en-IN")}`
                      )}
                    </td>
                    <td className={`py-2 pr-3 whitespace-nowrap ${isLow && !editing ? "text-red-700 font-semibold" : ""}`}>
                      {editing ? (
                        <input
                          type="number"
                          min="0"
                          value={editState.quantity}
                          onChange={(e) => setEditState((s) => ({ ...s, quantity: e.target.value }))}
                          className="w-16 border border-slate-300 rounded px-1.5 py-0.5 text-sm"
                        />
                      ) : (
                        <>
                          {item.quantity}
                          {isLow && <span className="ml-1.5 text-xs font-medium text-red-600">low stock</span>}
                        </>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-slate-500">
                      {editing ? (
                        <input
                          type="number"
                          min="0"
                          value={editState.low_stock_threshold}
                          onChange={(e) => setEditState((s) => ({ ...s, low_stock_threshold: e.target.value }))}
                          className="w-16 border border-slate-300 rounded px-1.5 py-0.5 text-sm"
                        />
                      ) : (
                        item.low_stock_threshold
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      {editing ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => saveEdit(item.id)}
                            disabled={saving}
                            className="p-1 rounded hover:bg-green-50 text-green-600 disabled:opacity-50"
                            aria-label="Save"
                          >
                            <Check size={15} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1 rounded hover:bg-slate-100 text-slate-500" aria-label="Cancel">
                            <X size={15} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <button onClick={() => startEdit(item)} className="p-1 rounded hover:bg-slate-100 text-slate-500" aria-label="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => remove(item.id)} className="p-1 rounded hover:bg-red-50 text-red-500" aria-label="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
