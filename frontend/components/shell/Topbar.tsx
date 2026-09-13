"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Search, ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useAIPanel } from "@/lib/ai-panel-context";
import { getBuyerMessages, getLowStockInventory, getReturns } from "@/lib/api";

interface Notification {
  label: string;
  count: number;
  href: string;
}

export default function Topbar() {
  const { seller, logout } = useAuth();
  const { sendMessage } = useAIPanel();
  const [search, setSearch] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([getLowStockInventory(), getBuyerMessages("pending"), getReturns("requested")])
      .then(([lowStock, pendingMessages, requestedReturns]) => {
        const items: Notification[] = [];
        if (lowStock.length > 0) items.push({ label: "Low stock items", count: lowStock.length, href: "/inventory" });
        if (pendingMessages.length > 0) items.push({ label: "Unanswered buyer messages", count: pendingMessages.length, href: "/messages" });
        if (requestedReturns.length > 0) items.push({ label: "Return requests awaiting review", count: requestedReturns.length, href: "/returns" });
        setNotifications(items);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalNotifications = notifications.reduce((sum, n) => sum + n.count, 0);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;
    sendMessage(search.trim());
    setSearch("");
  }

  if (!seller) return null;

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 md:px-6 gap-4">
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders, products, or ask AI…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>
      </form>

      <div className="flex items-center gap-3">
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {totalNotifications > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-semibold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                {totalNotifications}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-lg py-2 z-20">
              <p className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Notifications</p>
              {notifications.length === 0 ? (
                <p className="px-3 py-3 text-sm text-slate-400">You&apos;re all caught up.</p>
              ) : (
                notifications.map((n) => (
                  <a key={n.label} href={n.href} className="flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50">
                    <span className="text-slate-700">{n.label}</span>
                    <span className="text-xs font-semibold text-red-600 bg-red-50 rounded-full px-2 py-0.5">{n.count}</span>
                  </a>
                ))
              )}
            </div>
          )}
        </div>

        <div className="relative" ref={userRef}>
          <button onClick={() => setUserMenuOpen((o) => !o)} className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
              {seller.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-900 leading-tight">{seller.name}</p>
              <p className="text-xs text-slate-400 leading-tight capitalize">{seller.marketplace} seller</p>
            </div>
            <ChevronDown size={16} className="text-slate-400" />
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20">
              <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <LogOut size={15} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
