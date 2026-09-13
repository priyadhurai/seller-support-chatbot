"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ApiError, Marketplace } from "@/lib/api";

export default function SignupPage() {
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [marketplace, setMarketplace] = useState<Marketplace>("amazon");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signup(name, email, password, marketplace);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <h1 className="text-xl font-semibold mb-1">Sign up</h1>
        <p className="text-sm text-slate-500 mb-6">Create a seller account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Marketplace</label>
            <select
              value={marketplace}
              onChange={(e) => setMarketplace(e.target.value as Marketplace)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="amazon">Amazon</option>
              <option value="flipkart">Flipkart</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-slate-900 text-white py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-slate-900 font-medium underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
