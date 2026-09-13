"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Boxes, MessageSquare, RotateCcw, BarChart3, Settings, Store } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/returns", label: "Returns", icon: RotateCcw },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col bg-slate-900 text-slate-300 h-screen sticky top-0">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center">
          <Store size={18} className="text-white" />
        </div>
        <span className="text-white font-semibold text-base">Seller Support</span>
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 text-xs text-slate-500 border-t border-slate-800">Internal seller tool</div>
    </aside>
  );
}
