import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, ShoppingBag, Video, Wallet, Briefcase, Sparkles, Trophy, Gift, BarChart3 } from "lucide-react";

const quickActions = [
  { icon: Calendar, label: "Prenota", path: "/booking", cmd: "/prenota", color: "text-pink-400" },
  { icon: MapPin, label: "Mappa", path: "/map-search", cmd: "/mappa", color: "text-blue-400" },
  { icon: ShoppingBag, label: "Shop", path: "/shop", cmd: "/shop", color: "text-amber-400" },
  { icon: Video, label: "Live", path: "/go-live", cmd: "/live", color: "text-red-400" },
  { icon: Wallet, label: "Wallet", path: "/wallet", cmd: "/saldo", color: "text-green-400" },
  { icon: Briefcase, label: "Lavoro", path: "/hr", cmd: "/lavoro", color: "text-purple-400" },
  { icon: Trophy, label: "Sfide", path: "/challenges", cmd: "/sfida", color: "text-yellow-400" },
  { icon: Gift, label: "Referral", path: "/referral", cmd: "/referral", color: "text-cyan-400" },
  { icon: BarChart3, label: "Analytics", path: "/analytics", cmd: "/analytics", color: "text-indigo-400" },
  { icon: Sparkles, label: "Boost", path: "/boost-profile", cmd: "/boost", color: "text-primary" },
];

interface Props {
  onCommand?: (cmd: string) => void;
}

export default function AIQuickActions({ onCommand }: Props) {
  const navigate = useNavigate();

  return (
    <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
      {quickActions.map(a => (
        <button
          key={a.path}
          onClick={() => {
            if (onCommand) {
              onCommand(a.cmd);
            } else {
              navigate(a.path);
            }
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-card border border-border/50 text-xs font-semibold whitespace-nowrap hover:border-primary/40 hover:bg-card/80 active:scale-95 transition-all duration-200 shadow-sm"
        >
          <a.icon className={`w-3.5 h-3.5 ${a.color}`} />
          <span className="text-foreground/80">{a.label}</span>
        </button>
      ))}
    </div>
  );
}
