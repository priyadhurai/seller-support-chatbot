"use client";

import { useState } from "react";
import AnalyticsSection from "@/components/AnalyticsSection";

export default function AnalyticsPage() {
  const [refreshKey] = useState(0);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <AnalyticsSection refreshKey={refreshKey} />
    </div>
  );
}
