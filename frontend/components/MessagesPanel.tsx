"use client";

import { useEffect, useState } from "react";
import { BuyerMessage, getBuyerMessages, updateBuyerMessage } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  drafted: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
};

function MessageCard({ message, onUpdated }: { message: BuyerMessage; onUpdated: (m: BuyerMessage) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.draft_reply ?? "");
  const [saving, setSaving] = useState(false);

  async function saveEdit() {
    setSaving(true);
    try {
      const updated = await updateBuyerMessage(message.id, { draft_reply: draft });
      onUpdated(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function approve() {
    setSaving(true);
    try {
      // This only flips status to "approved" in our own database — it never
      // sends anything to the buyer or to a marketplace API.
      const updated = await updateBuyerMessage(message.id, { status: "approved" });
      onUpdated(updated);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-slate-200 rounded-md p-3">
      <div className="flex items-center justify-between mb-1">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[message.status]}`}>
          {message.status}
        </span>
        <span className="text-xs text-slate-400">{new Date(message.received_at).toLocaleString()}</span>
      </div>
      <p className="text-sm text-slate-800 mb-2">{message.message_text}</p>

      {message.draft_reply !== null && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-2">
          <p className="text-xs font-medium text-slate-500 mb-1">Draft reply (not sent)</p>
          {editing ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="w-full text-sm border border-slate-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          ) : (
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{message.draft_reply}</p>
          )}

          <div className="flex gap-2 mt-2">
            {editing ? (
              <>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="text-xs font-medium rounded-md bg-slate-900 text-white px-3 py-1 hover:bg-slate-800 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setDraft(message.draft_reply ?? "");
                    setEditing(false);
                  }}
                  className="text-xs font-medium rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-100"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  disabled={message.status === "approved"}
                  className="text-xs font-medium rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-100 disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  onClick={approve}
                  disabled={saving || message.status === "approved"}
                  className="text-xs font-medium rounded-md bg-green-700 text-white px-3 py-1 hover:bg-green-800 disabled:opacity-50"
                >
                  {message.status === "approved" ? "Approved" : "Approve"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPanel({ refreshKey }: { refreshKey: number }) {
  const [messages, setMessages] = useState<BuyerMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getBuyerMessages()
      .then(setMessages)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  function handleUpdated(updated: BuyerMessage) {
    setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }

  return (
    <section className="bg-white border border-slate-200 rounded-lg p-4">
      <h2 className="font-semibold text-slate-900 mb-3">Buyer messages</h2>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : messages.length === 0 ? (
        <p className="text-sm text-slate-400">No buyer messages found.</p>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <MessageCard key={m.id} message={m} onUpdated={handleUpdated} />
          ))}
        </div>
      )}
    </section>
  );
}
