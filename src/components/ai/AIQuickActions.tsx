import { useState, useRef, useCallback } from "react";
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
  { icon: Sparkles, label: "Boost", path: "/boost", cmd: "/boost", color: "text-primary" },
];

interface Props {
  onCommand?: (cmd: string) => void;
}

export default function AIQuickActions({ onCommand }: Props) {
  const navigate = useNavigate();
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const buttons = toolbarRef.current?.querySelectorAll<HTMLButtonElement>("button");
    if (!buttons || buttons.length === 0) return;
    const focused = document.activeElement as HTMLButtonElement;
    const index = Array.from(buttons).indexOf(focused);
    if (index === -1) return;
    e.preventDefault();
    const next = e.key === "ArrowRight"
      ? (index + 1) % buttons.length
      : (index - 1 + buttons.length) % buttons.length;
    buttons[next].focus();
  }, []);

  return (
    <div className="relative">
      {/* Gradient fade to indicate scrollable content */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
      <div
        ref={toolbarRef}
        role="toolbar"
        aria-label="Azioni rapide AI"
        onKeyDown={handleKeyDown}
        className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar"
      >
        {quickActions.map(a => (
          <button
            type="button"
            key={a.path}
            aria-label={a.label}
            disabled={activeAction === a.path}
            onClick={() => {
              setActiveAction(a.path);
              onCommand?.(a.cmd);
              navigate(a.path);
              setActiveAction(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full bg-card border border-border/50 text-xs font-semibold whitespace-nowrap hover:border-primary/40 hover:bg-card/80 active:scale-95 transition-all duration-200 shadow-sm ${
              activeAction === a.path ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <a.icon className={`w-3.5 h-3.5 ${a.color}`} />
            <span className="text-foreground/80">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
