"use client";

import { useState } from "react";
import ReturnsPanel from "@/components/ReturnsPanel";

export default function ReturnsPage() {
  const [refreshKey] = useState(0);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Returns &amp; Refunds</h1>
      <ReturnsPanel refreshKey={refreshKey} />
    </div>
  );
}
