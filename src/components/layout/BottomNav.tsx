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
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="glass border-t border-border/50">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path ||
              (tab.path !== "/" && location.pathname.startsWith(tab.path));
            const Icon = tab.icon;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200",
                  isActive && "bg-primary/10"
                )}>
                  <Icon className={cn("w-[22px] h-[22px] transition-all duration-200", isActive && "text-primary")} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-all duration-200",
                  isActive ? "text-primary" : "text-muted-foreground"
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