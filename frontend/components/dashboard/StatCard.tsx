import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  deltaPct: number;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

export default function StatCard({ label, value, deltaPct, icon: Icon, iconBg, iconColor }: StatCardProps) {
  const up = deltaPct >= 0;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon size={18} className={iconColor} />
        </div>
      </div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 mb-1">{value}</p>
      <p className={`text-xs font-medium flex items-center gap-1 ${up ? "text-green-600" : "text-red-600"}`}>
        {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {Math.abs(deltaPct)}% vs previous period
      </p>
    </div>
  );
}
