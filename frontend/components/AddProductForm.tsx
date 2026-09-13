"use client";

import { useState } from "react";
import { ApiError, createInventoryItem } from "@/lib/api";

const EMPTY = { sku: "", product_name: "", category: "", price: "", quantity: "", low_stock_threshold: "5", description: "" };

export default function AddProductForm({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  function setField<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await createInventoryItem({
        sku: form.sku,
        product_name: form.product_name,
        category: form.category || "Uncategorized",
        price: form.price ? Number(form.price) : 0,
        quantity: form.quantity ? Number(form.quantity) : 0,
        low_stock_threshold: form.low_stock_threshold ? Number(form.low_stock_threshold) : 5,
        description: form.description || null,
      });
      setForm(EMPTY);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-slate-900">Add Product</h2>
        <button onClick={onClose} className="text-sm text-slate-400 hover:text-slate-600">
          Close
        </button>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          required
          placeholder="SKU"
          value={form.sku}
          onChange={(e) => setField("sku", e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-2 text-sm"
        />
        <input
          required
          placeholder="Product name"
          value={form.product_name}
          onChange={(e) => setField("product_name", e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-2 text-sm sm:col-span-2"
        />
        <input
          placeholder="Category"
          value={form.category}
          onChange={(e) => setField("category", e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-2 text-sm"
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Price (₹)"
          value={form.price}
          onChange={(e) => setField("price", e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-2 text-sm"
        />
        <input
          type="number"
          min="0"
          placeholder="Quantity"
          value={form.quantity}
          onChange={(e) => setField("quantity", e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-2 text-sm"
        />
        <input
          type="number"
          min="0"
          placeholder="Low-stock threshold"
          value={form.low_stock_threshold}
          onChange={(e) => setField("low_stock_threshold", e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-2 text-sm"
        />
        <input
          placeholder="Description (optional)"
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-2 text-sm sm:col-span-2"
        />

        {error && <p className="text-sm text-red-600 sm:col-span-3">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="sm:col-span-3 rounded-md bg-slate-900 text-white py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add product"}
        </button>
      </form>
    </section>
  );
}
