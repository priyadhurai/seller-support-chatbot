"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { PackagePlus } from "lucide-react";
import InventoryPanel from "@/components/InventoryPanel";
import AddProductForm from "@/components/AddProductForm";
import CsvUpload from "@/components/CsvUpload";

export default function InventoryPage() {
  const searchParams = useSearchParams();
  const [showAddForm, setShowAddForm] = useState(searchParams.get("action") === "add");
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Inventory</h1>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 text-sm font-medium rounded-md bg-slate-900 text-white px-3 py-2 hover:bg-slate-800"
          >
            <PackagePlus size={15} />
            Add Product
          </button>
        )}
      </div>

      <AddProductForm open={showAddForm} onClose={() => setShowAddForm(false)} onCreated={() => setRefreshKey((k) => k + 1)} />
      <CsvUpload fixedKind="inventory" onImported={() => setRefreshKey((k) => k + 1)} />
      <InventoryPanel refreshKey={refreshKey} />
    </div>
  );
}
