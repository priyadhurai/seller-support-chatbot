"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { seller, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !seller) {
      router.replace("/login");
    }
  }, [loading, seller, router]);

  if (loading || !seller) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
