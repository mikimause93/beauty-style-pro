import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart, MessageCircle, Calendar, Coins, Users, Gift, Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NEW_NOTIFICATION_EVENT } from "@/lib/notificationConstants";
import type { AppNotification } from "@/hooks/useNotifications";

// ──────────────────────────────────────────────
// Per-type visual config – inspired by:
//   like/follow  → Instagram pink / purple
//   message      → Messenger blue
//   booking      → WhatsApp green
//   tip          → gold
//   challenge    → orange
//   system/info  → dark slate
// ──────────────────────────────────────────────
const typeConfig: Record<
  string,
  { gradient: string; icon: React.ElementType; appLabel: string }
> = {
  like: {
    gradient: "from-pink-500 to-rose-500",
    icon: Heart,
    appLabel: "Beauty Style",
  },
  comment: {
    gradient: "from-blue-500 to-indigo-600",
    icon: MessageCircle,
    appLabel: "Commento",
  },
  message: {
    gradient: "from-[#0084FF] to-[#0057C2]", // Messenger blue
    icon: MessageCircle,
    appLabel: "Messaggio",
  },
  booking: {
    gradient: "from-[#25D366] to-[#128C7E]", // WhatsApp green
    icon: Calendar,
    appLabel: "Prenotazione",
  },
  tip: {
    gradient: "from-amber-400 to-yellow-500",
    icon: Coins,
    appLabel: "Mancia",
  },
  follow: {
    gradient: "from-purple-500 to-violet-600",
    icon: Users,
    appLabel: "Nuovo follower",
  },
  challenge: {
    gradient: "from-orange-500 to-amber-500",
    icon: Gift,
    appLabel: "Sfida",
  },
  system: {
    gradient: "from-slate-600 to-slate-700",
    icon: Bell,
    appLabel: "Sistema",
  },
  info: {
    gradient: "from-slate-600 to-slate-700",
    icon: Bell,
    appLabel: "Info",
  },
};

function getUrl(notif: AppNotification): string {
  const type = notif.type || "info";
  const data = notif.data || {};
  if (type === "message" && data.conversation_id) return `/chat/${data.conversation_id}`;
  if (type === "follow" && data.follower_id) return `/profile/${data.follower_id}`;
  if ((type === "like" || type === "comment") && data.post_id)
    return `/?post=${data.post_id}`;
  if (type === "booking") return "/my-bookings";
  if (type === "tip") return "/wallet";
  if (type === "challenge") return "/challenges";
  return "/notifications";
}

const DISMISS_MS = 5000;

export default function NotificationToast() {
  const navigate = useNavigate();
  const [toast, setToast] = useState<AppNotification | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartY = useRef(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const notif = (e as CustomEvent<AppNotification>).detail;
      setToast(notif);
      setVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), DISMISS_MS);
    };
    window.addEventListener(NEW_NOTIFICATION_EVENT, handler);
    return () => {
      window.removeEventListener(NEW_NOTIFICATION_EVENT, handler);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const dismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  };

  const handleClick = () => {
    if (!toast) return;
    dismiss();
    navigate(getUrl(toast));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current - e.changedTouches[0].clientY > 30) dismiss();
  };

  if (!toast) return null;

  const type = toast.type || "info";
  const cfg = typeConfig[type] ?? typeConfig.info;
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[9999] flex justify-center",
        "pointer-events-none"
      )}
      aria-live="polite"
    >
      <div
        className={cn(
          "pointer-events-auto max-w-lg w-full",
          "transform transition-all duration-300 ease-out",
          visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        )}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
      >
        {/* Toast card */}
        <div
          className={cn(
            "mx-3 mt-2 rounded-2xl shadow-2xl overflow-hidden",
            "border border-white/10 backdrop-blur-xl",
            "bg-gradient-to-r", cfg.gradient
          )}
        >
          <div className="flex items-center gap-3 px-4 py-3.5">
            {/* Icon bubble */}
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <Icon className="w-5 h-5 text-white drop-shadow" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-[11px] font-bold uppercase tracking-wide opacity-80 leading-none mb-0.5">
                {cfg.appLabel}
              </p>
              <p className="text-white text-sm font-semibold leading-tight truncate">
                {toast.title}
              </p>
              <p className="text-white/80 text-xs leading-snug line-clamp-1 mt-0.5">
                {toast.message}
              </p>
            </div>

            {/* Dismiss × */}
            <button
              onClick={(e) => { e.stopPropagation(); dismiss(); }}
              className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 text-white/80 text-xs font-bold"
              aria-label="Chiudi"
            >
              ×
            </button>
          </div>

          {/* Progress drain bar */}
          <div className="h-[3px] bg-white/10 overflow-hidden">
            {visible && (
              <div
                className="h-full bg-white/50"
                style={{
                  animation: `notif-drain ${DISMISS_MS}ms linear forwards`,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
