"use client";

import { useRef, useState } from "react";
import { ApiError, importInventoryCsv, importOrdersCsv } from "@/lib/api";

type ImportKind = "orders" | "inventory";

export default function CsvUpload({ onImported, fixedKind }: { onImported: () => void; fixedKind?: ImportKind }) {
  const [kind, setKind] = useState<ImportKind>(fixedKind ?? "orders");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setStatus(null);
    try {
      const result = kind === "orders" ? await importOrdersCsv(file) : await importInventoryCsv(file);
      setStatus(`Imported ${result.imported} ${kind} row(s).`);
      onImported();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Import failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <section className="bg-white border border-slate-200 rounded-lg p-4">
      <h2 className="font-semibold text-slate-900 mb-3">Import CSV</h2>
      <div className="flex flex-wrap items-center gap-3">
        {!fixedKind && (
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as ImportKind)}
            className="text-sm border border-slate-300 rounded-md px-2 py-1.5"
          >
            <option value="orders">Orders</option>
            <option value="inventory">Inventory</option>
          </select>
        )}

        <label className="text-sm font-medium rounded-md bg-slate-900 text-white px-3 py-1.5 hover:bg-slate-800 cursor-pointer disabled:opacity-50">
          {uploading ? "Uploading…" : `Upload ${kind} CSV`}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>

        {status && <span className="text-sm text-green-700">{status}</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
      <p className="text-xs text-slate-400 mt-2">
        Common column name variants are mapped automatically (e.g. &ldquo;Order ID&rdquo; → order_number).
      </p>
    </section>
  );
}
