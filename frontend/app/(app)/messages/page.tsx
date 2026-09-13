"use client";

import { useState } from "react";
import MessagesPanel from "@/components/MessagesPanel";

export default function MessagesPage() {
  const [refreshKey] = useState(0);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Buyer Messages</h1>
      <MessagesPanel refreshKey={refreshKey} />
    </div>
  );
}
