import { Home, Radio, ShoppingBag, User, Video, Compass } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/explore", icon: Compass, label: "Esplora" },
  { path: "/shop", icon: ShoppingBag, label: "Shop" },
  { path: "/live", icon: Video, label: "Live" },
  { path: "/profile", icon: User, label: "Profilo" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="glass-nav">
        <div className="flex items-center justify-around h-[62px] max-w-lg mx-auto px-3">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path ||
              (tab.path !== "/" && location.pathname.startsWith(tab.path));
            const Icon = tab.icon;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-300",
                )}
              >
                <div className={cn(
                  "relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300",
                  isActive
                    ? "gradient-primary shadow-glow scale-105"
                    : "bg-primary/8 hover:bg-primary/15"
                )}>
                  <Icon className={cn(
                    "w-[21px] h-[21px] transition-all duration-300",
                    isActive ? "text-white drop-shadow-sm" : "text-primary/65"
                  )} />
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/70" />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-semibold tracking-wide transition-all duration-300",
                  isActive ? "text-primary" : "text-primary/45"
                )}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}