import Link from "next/link";
import { PackagePlus, Upload, BarChart3, ShoppingCart, RotateCcw, LucideIcon } from "lucide-react";

const ACTIONS: { label: string; href: string; icon: LucideIcon; bg: string; color: string }[] = [
  { label: "Add Product", href: "/inventory?action=add", icon: PackagePlus, bg: "bg-blue-50", color: "text-blue-600" },
  { label: "Import CSV", href: "/inventory?action=import", icon: Upload, bg: "bg-green-50", color: "text-green-600" },
  { label: "View Analytics", href: "/analytics", icon: BarChart3, bg: "bg-violet-50", color: "text-violet-600" },
  { label: "Manage Orders", href: "/orders", icon: ShoppingCart, bg: "bg-amber-50", color: "text-amber-600" },
  { label: "Review Returns", href: "/returns", icon: RotateCcw, bg: "bg-red-50", color: "text-red-600" },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {ACTIONS.map(({ label, href, icon: Icon, bg, color }) => (
        <Link
          key={label}
          href={href}
          className="flex flex-col items-center gap-2 bg-white border border-slate-200 rounded-lg py-4 px-2 hover:border-slate-300 hover:shadow-sm transition-shadow text-center"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bg}`}>
            <Icon size={18} className={color} />
          </div>
          <span className="text-xs font-medium text-slate-700">{label}</span>
        </Link>
      ))}
    </div>
  );
}
