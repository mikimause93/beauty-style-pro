import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, ShoppingBag, Video, Wallet, Briefcase } from "lucide-react";

const quickActions = [
  { icon: Calendar, label: "Prenota", path: "/booking" },
  { icon: MapPin, label: "Mappa", path: "/map-search" },
  { icon: ShoppingBag, label: "Shop", path: "/shop" },
  { icon: Video, label: "Live", path: "/live" },
  { icon: Wallet, label: "Wallet", path: "/wallet" },
  { icon: Briefcase, label: "Lavoro", path: "/hr" },
];

export default function AIQuickActions() {
  const navigate = useNavigate();

  return (
    <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-none">
      {quickActions.map(a => (
        <button
          key={a.path}
          onClick={() => navigate(a.path)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/30 text-xs font-medium whitespace-nowrap hover:border-primary/30 transition-colors"
        >
          <a.icon className="w-3.5 h-3.5 text-primary" />
          {a.label}
        </button>
      ))}
    </div>
  );
}
