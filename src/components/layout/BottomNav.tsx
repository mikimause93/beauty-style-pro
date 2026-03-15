import { Home, User, Video, Compass, Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/explore", icon: Compass, label: "Esplora" },
  { path: "/live", icon: Video, label: "Live" },
  { path: "/profile", icon: User, label: "Profilo" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAIActive = location.pathname.startsWith("/ai-assistant");

  const half = Math.ceil(tabs.length / 2);
  const leftTabs = tabs.slice(0, half);
  const rightTabs = tabs.slice(half);

  const renderTab = (tab: typeof tabs[0]) => {
    const isActive =
      location.pathname === tab.path ||
      (tab.path !== "/" && location.pathname.startsWith(tab.path));
    const Icon = tab.icon;
    return (
      <button
        key={tab.path}
        onClick={() => navigate(tab.path)}
        className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-300"
      >
        <div
          className={cn(
            "relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300",
            isActive
              ? "gradient-primary shadow-glow scale-105 luxury-shimmer"
              : "bg-primary/8 hover:bg-primary/15"
          )}
        >
          <Icon
            className={cn(
              "w-[22px] h-[22px] transition-all duration-300",
              isActive ? "text-white drop-shadow-sm" : "text-foreground/55"
            )}
          />
          {isActive && (
            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/80 shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
          )}
        </div>
        <span
          className={cn(
            "font-sans text-[10px] font-semibold tracking-wide transition-all duration-300",
            isActive ? "text-gradient-primary" : "text-foreground/45"
          )}
        >
          {tab.label}
        </span>
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="glass-nav" style={{ borderTop: "1px solid hsl(var(--primary) / 0.1)" }}>
        {/* Top gradient accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent 10%, hsl(263 85% 62% / 0.35) 35%, hsl(302 80% 55% / 0.4) 50%, hsl(38 88% 58% / 0.3) 65%, transparent 90%)" }}
        />
        <div className="flex items-center justify-around h-[64px] max-w-lg mx-auto px-2">
          {/* Left tabs */}
          {leftTabs.map(renderTab)}

          {/* Center AI button — raised FAB */}
          <div className="flex flex-col items-center justify-center flex-1 relative">
            <button
              onClick={() => navigate("/ai-assistant")}
              aria-label="Stella AI"
              className={cn(
                "absolute -top-6 w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all duration-300 shadow-deep",
                isAIActive
                  ? "gradient-luxury scale-110 shadow-glow"
                  : "gradient-primary hover:scale-105 animate-pulse-glow"
              )}
            >
              <Sparkles
                className={cn(
                  "w-[26px] h-[26px] text-white drop-shadow-sm transition-all duration-300",
                  isAIActive && "animate-pulse"
                )}
              />
              {/* Outer glow ring */}
              <span className="absolute inset-0 rounded-full border border-white/20" />
              {/* Rotating arc ring */}
              <span
                className="absolute rounded-full pointer-events-none"
                style={{
                  inset: -3,
                  background: "conic-gradient(from 0deg, transparent 40%, hsl(263 85% 72% / 0.6) 55%, hsl(38 88% 65% / 0.6) 70%, transparent 85%)",
                  animation: "ring-rotate 5s linear infinite",
                }}
              />
            </button>
            <span
              className={cn(
                "font-sans text-[10px] font-bold tracking-wide mt-1 transition-all duration-300",
                isAIActive ? "text-gradient-primary" : "text-foreground/45"
              )}
            >
              Stella
            </span>
          </div>

          {/* Right tabs */}
          {rightTabs.map(renderTab)}
        </div>
      </div>
    </nav>
  );
}