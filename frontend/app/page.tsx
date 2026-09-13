"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { seller, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(seller ? "/dashboard" : "/login");
  }, [loading, seller, router]);

  return <div className="flex-1 flex items-center justify-center text-slate-500">Loading…</div>;
}
