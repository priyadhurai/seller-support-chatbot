"use client";

import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
  const { seller, logout } = useAuth();

  if (!seller) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Settings</h1>

      <section className="bg-white border border-slate-200 rounded-lg p-4">
        <h2 className="font-semibold text-slate-900 mb-3">Seller profile</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Name</dt>
            <dd className="text-slate-900 font-medium">{seller.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Email</dt>
            <dd className="text-slate-900 font-medium">{seller.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Marketplace</dt>
            <dd className="text-slate-900 font-medium capitalize">{seller.marketplace}</dd>
          </div>
        </dl>
      </section>

      <section className="bg-white border border-slate-200 rounded-lg p-4">
        <h2 className="font-semibold text-slate-900 mb-1">Account</h2>
        <p className="text-sm text-slate-500 mb-3">Sign out of this device.</p>
        <button onClick={logout} className="text-sm font-medium rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-100">
          Log out
        </button>
      </section>
    </div>
  );
}
