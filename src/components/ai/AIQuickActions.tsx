import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, ShoppingBag, Video, Wallet, Briefcase, Sparkles, Trophy, Gift, BarChart3 } from "lucide-react";

const quickActions = [
  { icon: Calendar, label: "Prenota", path: "/booking", cmd: "/prenota" },
  { icon: MapPin, label: "Mappa", path: "/map-search", cmd: "/mappa" },
  { icon: ShoppingBag, label: "Shop", path: "/shop", cmd: "/shop" },
  { icon: Video, label: "Live", path: "/go-live", cmd: "/live" },
  { icon: Wallet, label: "Wallet", path: "/wallet", cmd: "/saldo" },
  { icon: Briefcase, label: "Lavoro", path: "/hr", cmd: "/lavoro" },
  { icon: Trophy, label: "Sfide", path: "/challenges", cmd: "/sfida" },
  { icon: Gift, label: "Referral", path: "/referral", cmd: "/referral" },
  { icon: BarChart3, label: "Analytics", path: "/analytics", cmd: "/analytics" },
  { icon: Sparkles, label: "Boost", path: "/boost-profile", cmd: "/boost" },
];

interface Props {
  onCommand?: (cmd: string) => void;
}

export default function AIQuickActions({ onCommand }: Props) {
  const navigate = useNavigate();

  return (
    <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-none">
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/30 text-xs font-medium whitespace-nowrap hover:border-primary/30 transition-colors"
        >
          <a.icon className="w-3.5 h-3.5 text-primary" />
          {a.label}
        </button>
      ))}
    </div>
  );
}
