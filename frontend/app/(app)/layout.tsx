"use client";

import RequireAuth from "@/components/RequireAuth";
import Sidebar from "@/components/shell/Sidebar";
import Topbar from "@/components/shell/Topbar";
import { AIPanelProvider } from "@/lib/ai-panel-context";
import AIPanel from "@/components/ai-panel/AIPanel";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AIPanelProvider>
        <div className="flex min-h-screen w-full">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Topbar />
            <main className="flex-1 bg-slate-50">{children}</main>
          </div>
          <AIPanel />
        </div>
      </AIPanelProvider>
    </RequireAuth>
  );
}
