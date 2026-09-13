"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The AI assistant is now docked on the app shell (every page under
// (app)/), not a standalone page — redirect anyone with the old /chat link.
export default function ChatRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);
  return null;
}
