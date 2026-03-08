import { Home, Radio, ShoppingBag, User, Video } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/live", icon: Video, label: "Live" },
  { path: "/shop", icon: ShoppingBag, label: "Shop" },
  { path: "/radio", icon: Radio, label: "Radio" },
  { path: "/profile", icon: User, label: "Profilo" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab, i) => {
          const isActive = location.pathname === tab.path ||
            (tab.path !== "/" && location.pathname.startsWith(tab.path));
          const Icon = tab.icon;
          const isCenter = i === 2;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-16 h-full transition-all relative",
                isCenter ? "" : isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {isCenter ? (
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center -mt-4 shadow-lg",
                  isActive ? "gradient-primary shadow-glow" : "gradient-primary"
                )}>
                  <Icon className="w-5 h-5 text-primary-foreground" />
                </div>
              ) : (
                <Icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_8px_hsl(340,82%,60%)]")} />
              )}
              <span className={cn("text-[10px] font-medium", isCenter && "-mt-0.5 text-primary")}>{tab.label}</span>
              {isActive && !isCenter && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
