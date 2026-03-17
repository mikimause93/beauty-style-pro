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
                    onClick={() => navigate(tab.path)}
                    aria-label={tab.label}
                    className={cn(
                      "absolute -top-6 w-[56px] h-[56px] rounded-2xl flex items-center justify-center transition-all duration-300",
                      isActive
                        ? "gradient-primary shadow-glow scale-105"
                        : "chrome-icon hover:scale-105 animate-pulse-glow"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-[24px] h-[24px] transition-all duration-300",
                        isActive ? "text-white" : "text-primary"
                      )}
                    />
                  </button>
                  <span
                    className={cn(
                      "text-[10px] font-semibold tracking-wide mt-2 transition-all duration-300",
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
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-300"
              >
                <div
                  className={cn(
                    "relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                    isActive
                      ? "gradient-primary shadow-glow"
                      : "hover:bg-secondary"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-[20px] h-[20px] transition-all duration-300",
                      isActive ? "text-white" : "text-foreground/50"
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium tracking-wide transition-all duration-300",
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