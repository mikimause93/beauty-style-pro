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
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom" aria-label="Navigazione principale">
      <div className="glass-nav">
        <div className="flex items-center justify-around h-[64px] max-w-lg mx-auto px-3">
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
                    type="button"
                    onClick={() => navigate(tab.path)}
                    aria-label={tab.label}
                    className={cn(
                      "absolute -top-6 w-[56px] h-[56px] rounded-2xl flex items-center justify-center transition-all duration-300",
                      isActive
                        ? "neon-icon-active scale-105"
                        : "neon-icon hover:scale-105 animate-pulse-glow"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-[24px] h-[24px] transition-all duration-300",
                        isActive ? "text-primary-foreground text-neon" : "text-neon"
                      )}
                    />
                  </button>
                  <span
                    className={cn(
                      "text-xs font-semibold tracking-wide mt-2 transition-all duration-300",
                      isActive ? "text-primary" : "text-foreground/40"
                    )}
                  >
                    {tab.label}
                  </span>
                </div>
              );
            }

            return (
              <button
                type="button"
                key={tab.path}
                onClick={() => navigate(tab.path)}
                aria-label={tab.label}
                className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-300"
              >
                <div
                  className={cn(
                    "relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                    isActive
                      ? "neon-icon-active"
                      : "neon-icon"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-[20px] h-[20px] transition-all duration-300",
                      isActive ? "text-primary-foreground text-neon" : "text-neon"
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-xs font-medium tracking-wide transition-all duration-300",
                    isActive ? "text-primary" : "text-foreground/40"
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
