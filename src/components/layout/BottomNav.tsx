import { Home, User, Video, Compass, ShoppingBag } from "lucide-react";
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
  const isShopActive = location.pathname.startsWith("/shop");

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
            "relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
            isActive
              ? "gradient-primary shadow-glow scale-105"
              : "bg-primary/8 hover:bg-primary/15"
          )}
        >
          <Icon
            className={cn(
              "w-[24px] h-[24px] transition-all duration-300",
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
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="glass-nav">
        <div className="flex items-center justify-around h-[66px] max-w-lg mx-auto px-2">
          {/* Left tabs */}
          {leftTabs.map(renderTab)}

          {/* Center Shop button — raised golden FAB */}
          <div className="flex flex-col items-center justify-center flex-1 relative">
            <button
              onClick={() => navigate("/shop")}
              aria-label="Shop"
              className={cn(
                "absolute -top-6 w-[62px] h-[62px] rounded-full flex items-center justify-center transition-all duration-300",
                isShopActive
                  ? "gradient-gold shadow-glow-gold scale-110"
                  : "gradient-gold hover:scale-105 animate-shop-glow"
              )}
            >
              <ShoppingBag
                className={cn(
                  "w-[28px] h-[28px] text-black drop-shadow-sm transition-all duration-300",
                  isShopActive && "scale-110"
                )}
              />
              {/* Gold glow ring */}
              <span className="absolute inset-0 rounded-full border-2 border-yellow-200/40" />
            </button>
            <span
              className={cn(
                "text-[10px] font-bold tracking-wide mt-1 transition-all duration-300",
                isShopActive ? "text-yellow-400" : "text-yellow-500/80"
              )}
            >
              Shop
            </span>
          </div>

          {/* Right tabs */}
          {rightTabs.map(renderTab)}
        </div>
      </div>
    </nav>
  );
}