import { Home, User, Video, Compass, ShoppingBag } from "lucide-react";
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

  const centerIndex = Math.floor(tabs.length / 2);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="glass-nav">
        <div className="flex items-center justify-around h-[62px] max-w-lg mx-auto px-2">
          {tabs.map((tab, i) => {
            const isActive =
              location.pathname === tab.path ||
              (tab.path !== "/" && location.pathname.startsWith(tab.path));
            const Icon = tab.icon;
            const isCenter = i === centerIndex;

            if (isCenter) {
              return (
                <div key={tab.path} className="flex flex-col items-center justify-center flex-1 relative">
                  <button
                    onClick={() => navigate(tab.path)}
                    aria-label={tab.label}
                    className={cn(
                      "absolute -top-5 w-[58px] h-[58px] rounded-full flex items-center justify-center transition-all duration-300 shadow-luxury",
                      isActive
                        ? "gradient-luxury scale-110 shadow-glow"
                        : "gradient-primary hover:scale-105 animate-pulse-glow"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-[26px] h-[26px] text-white drop-shadow-sm transition-all duration-300",
                        isActive && "animate-pulse"
                      )}
                    />
                    <span className="absolute inset-0 rounded-full border-2 border-white/20" />
                  </button>
                  <span
                    className={cn(
                      "text-[10px] font-bold tracking-wide mt-1 transition-all duration-300",
                      isActive ? "text-primary" : "text-foreground/50"
                    )}
                  >
                    {tab.label}
                  </span>
                </div>
              );
            }

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
                      ? "gradient-primary shadow-glow scale-105"
                      : "bg-primary/8 hover:bg-primary/15"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-[22px] h-[22px] transition-all duration-300",
                      isActive ? "text-white drop-shadow-sm" : "text-foreground/60"
                    )}
                  />
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/70" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-semibold tracking-wide transition-all duration-300",
                    isActive ? "text-primary" : "text-foreground/50"
                  )}
                >
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