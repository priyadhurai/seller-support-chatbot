"use client";

import { useEffect, useState } from "react";
import { getReturns, ReturnRequest, updateReturn } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  requested: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  refunded: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

function ReturnCard({ ret, onUpdated }: { ret: ReturnRequest; onUpdated: (r: ReturnRequest) => void }) {
  const [refundAmount, setRefundAmount] = useState(ret.refund_amount?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  async function setStatus(status: ReturnRequest["status"]) {
    setSaving(true);
    try {
      // Only updates status/refund_amount in our own database — never
      // triggers a real refund payment. See app/models/return_request.py.
      const updated = await updateReturn(ret.id, { status });
      onUpdated(updated);
    } finally {
      setSaving(false);
    }
  }

  async function markRefunded() {
    const amount = parseFloat(refundAmount);
    if (Number.isNaN(amount) || amount < 0) return;
    setSaving(true);
    try {
      const updated = await updateReturn(ret.id, { status: "refunded", refund_amount: amount });
      onUpdated(updated);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-slate-200 rounded-md p-3">
      <div className="flex items-center justify-between mb-1">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[ret.status]}`}>{ret.status}</span>
        <span className="text-xs text-slate-400">{new Date(ret.requested_at).toLocaleString()}</span>
      </div>
      <p className="text-xs text-slate-400 mb-1">Order #{ret.order_id}</p>
      <p className="text-sm text-slate-800 mb-2">{ret.reason}</p>

      {ret.status === "requested" && (
        <div className="flex gap-2">
          <button
            onClick={() => setStatus("approved")}
            disabled={saving}
            className="text-xs font-medium rounded-md bg-slate-900 text-white px-3 py-1 hover:bg-slate-800 disabled:opacity-50"
          >
            Approve
          </button>
          <button
            onClick={() => setStatus("rejected")}
            disabled={saving}
            className="text-xs font-medium rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-100 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      )}

      {ret.status === "approved" && (
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md p-2">
          <span className="text-xs text-slate-500">Refund amount (₹)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            className="w-24 text-sm border border-slate-300 rounded-md px-2 py-1"
          />
          <button
            onClick={markRefunded}
            disabled={saving || !refundAmount}
            className="text-xs font-medium rounded-md bg-green-700 text-white px-3 py-1 hover:bg-green-800 disabled:opacity-50"
          >
            Mark refunded
          </button>
        </div>
      )}

      {ret.status === "refunded" && ret.refund_amount !== null && (
        <p className="text-xs text-green-700">Refunded ₹{ret.refund_amount.toLocaleString("en-IN")} (recorded here only)</p>
      )}
    </div>
  );
}

export default function ReturnsPanel({ refreshKey }: { refreshKey: number }) {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getReturns()
      .then(setReturns)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  function handleUpdated(updated: ReturnRequest) {
    setReturns((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  return (
    <section className="bg-white border border-slate-200 rounded-lg p-4">
      <h2 className="font-semibold text-slate-900 mb-3">Returns &amp; refunds</h2>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : returns.length === 0 ? (
        <p className="text-sm text-slate-400">No return requests found.</p>
      ) : (
        <div className="space-y-3">
          {returns.map((r) => (
            <ReturnCard key={r.id} ret={r} onUpdated={handleUpdated} />
          ))}
        </div>
      )}
    </section>
  );
}
