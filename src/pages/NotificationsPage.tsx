import MobileLayout from "@/components/layout/MobileLayout";
import {
  ArrowLeft, Bell, Heart, MessageCircle, Calendar, Coins, Trash2,
  Users, Loader2, BellRing, Check, CheckCheck, Gift, Info,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotificationsContext } from "@/contexts/NotificationsContext";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { NOTIFICATION_BADGE_COLOR } from "@/lib/notificationConstants";
import logo from "@/assets/logo.png";

// ──────────────────────────────────────────────────────────────
// Per-type config  (icon + colours inspired by major social apps)
//   like/comment  → Instagram pink gradient
//   message       → Messenger blue gradient
//   follow        → Instagram purple
//   booking       → WhatsApp green
//   tip           → gold
//   challenge     → orange
//   system/info   → neutral
// ──────────────────────────────────────────────────────────────
const typeConfig: Record<
  string,
  { icon: React.ElementType; iconBg: string; cardBorder: string; cardBg: string; dotColor: string }
> = {
  like: {
    icon: Heart,
    iconBg: "bg-gradient-to-br from-pink-500 to-rose-500",
    cardBorder: "border-pink-500/25",
    cardBg: "bg-gradient-to-r from-pink-500/8 to-rose-500/8",
    dotColor: "bg-[#E1306C]",
  },
  comment: {
    icon: MessageCircle,
    iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
    cardBorder: "border-blue-500/25",
    cardBg: "bg-gradient-to-r from-blue-500/8 to-indigo-500/8",
    dotColor: "bg-blue-500",
  },
  message: {
    icon: MessageCircle,
    iconBg: "bg-gradient-to-br from-[#0084FF] to-[#0057C2]",
    cardBorder: "border-[#0084FF]/30",
    cardBg: "bg-gradient-to-r from-[#0084FF]/10 to-[#0057C2]/5",
    dotColor: "bg-[#0084FF]",
  },
  booking: {
    icon: Calendar,
    iconBg: "bg-gradient-to-br from-[#25D366] to-[#128C7E]",
    cardBorder: "border-[#25D366]/30",
    cardBg: "bg-gradient-to-r from-[#25D366]/10 to-[#128C7E]/5",
    dotColor: "bg-[#25D366]",
  },
  tip: {
    icon: Coins,
    iconBg: "bg-gradient-to-br from-amber-400 to-yellow-500",
    cardBorder: "border-amber-400/25",
    cardBg: "bg-gradient-to-r from-amber-400/10 to-yellow-400/5",
    dotColor: "bg-amber-400",
  },
  follow: {
    icon: Users,
    iconBg: "bg-gradient-to-br from-purple-500 to-violet-600",
    cardBorder: "border-purple-500/25",
    cardBg: "bg-gradient-to-r from-purple-500/8 to-violet-500/8",
    dotColor: "bg-purple-500",
  },
  challenge: {
    icon: Gift,
    iconBg: "bg-gradient-to-br from-orange-500 to-amber-500",
    cardBorder: "border-orange-500/25",
    cardBg: "bg-gradient-to-r from-orange-500/8 to-amber-400/8",
    dotColor: "bg-orange-500",
  },
  system: {
    icon: Bell,
    iconBg: "bg-gradient-to-br from-slate-500 to-slate-600",
    cardBorder: "border-border/30",
    cardBg: "bg-muted/40",
    dotColor: "bg-muted-foreground",
  },
  info: {
    icon: Info,
    iconBg: "bg-gradient-to-br from-slate-500 to-slate-600",
    cardBorder: "border-border/30",
    cardBg: "bg-muted/40",
    dotColor: "bg-muted-foreground",
  },
};

const typeVerb: Record<string, string> = {
  like: "ha messo like",
  comment: "ha commentato",
  message: "ti ha scritto",
  booking: "nuova prenotazione",
  tip: "ti ha inviato una mancia",
  follow: "ti ha seguito",
  challenge: "nuova sfida",
  system: "notifica sistema",
  info: "informazione",
};

function formatTimeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "Adesso";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 172800) return "Ieri";
  if (s < 604800) return `${Math.floor(s / 86400)}g`;
  return new Date(date).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

function groupNotifications(notifications: any[]) {
  const today: any[] = [];
  const yesterday: any[] = [];
  const thisWeek: any[] = [];
  const older: any[] = [];
  const now = Date.now();
  for (const n of notifications) {
    const diff = now - new Date(n.created_at).getTime();
    if (diff < 86400000) today.push(n);
    else if (diff < 172800000) yesterday.push(n);
    else if (diff < 604800000) thisWeek.push(n);
    else older.push(n);
  }
  return [
    { label: "Oggi", items: today },
    { label: "Ieri", items: yesterday },
    { label: "Questa settimana", items: thisWeek },
    { label: "Precedenti", items: older },
  ].filter(g => g.items.length > 0);
}

const FILTER_TABS = [
  { key: "all", label: "Tutte" },
  { key: "unread", label: "Non lette" },
  { key: "message", label: "Messaggi" },
  { key: "like", label: "Like" },
  { key: "follow", label: "Follower" },
];

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, unreadCount, loading, markAllRead, markRead, deleteNotification } =
    useNotificationsContext();
  const [filter, setFilter] = useState<string>("all");

  const filtered = (() => {
    if (filter === "unread") return notifications.filter(n => !n.read);
    if (filter === "all") return notifications;
    return notifications.filter(n => n.type === filter);
  })();

  const groups = groupNotifications(filtered);

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) markRead(notification.id);
    const type = notification.type || "info";
    const data = notification.data || {};
    if ((type === "like" || type === "comment") && data.post_id) navigate(`/?post=${data.post_id}`);
    else if (type === "message" && data.conversation_id) navigate(`/chat/${data.conversation_id}`);
    else if (type === "follow" && data.follower_id) navigate(`/profile/${data.follower_id}`);
    else if (type === "booking") navigate("/my-bookings");
    else if (type === "tip") navigate("/wallet");
    else if (type === "challenge") navigate("/challenges");
  };

  const getActionLabel = (type: string) => {
    const labels: Record<string, string> = {
      like: "Vedi post",
      comment: "Rispondi",
      booking: "Dettagli",
      tip: "Wallet",
      follow: "Profilo",
      challenge: "Partecipa",
      message: "Apri chat",
    };
    return labels[type] || "Apri";
  };

  if (!user) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-pink-500/30 flex items-center justify-center mb-5 shadow-glow">
            <BellRing className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-display font-bold mb-2">Accedi per le notifiche</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Ricevi aggiornamenti su like, commenti, prenotazioni e molto altro
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="px-8 py-3 rounded-full gradient-primary text-white font-semibold text-sm shadow-glow"
          >
            Accedi
          </button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      {/* ── Header (Facebook-style) ── */}
      <header className="sticky top-0 z-40 glass px-4 pt-3 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-display font-bold">Notifiche</h1>
              {unreadCount > 0 && (
                <span
                  className="min-w-[20px] h-5 px-1.5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow-md"
                  style={{ backgroundColor: NOTIFICATION_BADGE_COLOR }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center gap-1 border border-primary/20"
              >
                <CheckCheck className="w-3 h-3" /> Tutto letto
              </button>
            )}
            <img src={logo} alt="Style" className="h-6 object-contain opacity-60" />
          </div>
        </div>

        {/* Filter pills — Instagram/Facebook style */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200",
                filter === tab.key
                  ? "gradient-primary text-white shadow-glow"
                  : "bg-primary/10 text-foreground/60 border border-primary/10"
              )}
            >
              {tab.label}
              {tab.key === "unread" && unreadCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/20 text-[9px]">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="p-3 space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-primary" />
            </div>
            <p className="font-semibold">Nessuna notifica</p>
            <p className="text-xs text-muted-foreground mt-1">
              {filter !== "all"
                ? "Nessuna notifica in questa categoria"
                : "Le notifiche appariranno qui"}
            </p>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.label}>
              <p className="text-[11px] font-bold text-foreground/50 uppercase tracking-widest mb-2 px-1">
                {group.label}
              </p>

              <div className="space-y-1.5">
                {group.items.map((notification: any) => {
                  const type = notification.type || "info";
                  const cfg = typeConfig[type] ?? typeConfig.info;
                  const Icon = cfg.icon;
                  const isUnread = !notification.read;

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "relative rounded-2xl border overflow-hidden transition-all duration-200 active:scale-[0.99]",
                        isUnread
                          ? `${cfg.cardBg} ${cfg.cardBorder}`
                          : "bg-card/60 border-border/20"
                      )}
                    >
                      {/* Unread side bar */}
                      {isUnread && (
                        <div
                          className={cn(
                            "absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl",
                            cfg.dotColor
                          )}
                        />
                      )}

                      <button
                        onClick={() => handleNotificationClick(notification)}
                        className="w-full flex items-start gap-3 p-3.5 text-left"
                      >
                        {/* ── Avatar / Icon area ── */}
                        <div className="relative shrink-0">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center shadow-md",
                              cfg.iconBg
                            )}
                          >
                            <Icon className="w-6 h-6 text-white drop-shadow" />
                          </div>
                          {isUnread && (
                            <span
                              className={cn(
                                "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background",
                                cfg.dotColor
                              )}
                            />
                          )}
                        </div>

                        {/* ── Content ── */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                              {typeVerb[type] ?? "notifica"}
                            </span>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                          </div>

                          <p
                            className={cn(
                              "text-sm font-semibold leading-tight mt-0.5",
                              isUnread ? "text-foreground" : "text-foreground/70"
                            )}
                          >
                            {notification.title}
                          </p>

                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                            {notification.message}
                          </p>

                          {/* ── Action row ── */}
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationClick(notification);
                              }}
                              className={cn(
                                "px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all text-white",
                                type === "message"
                                  ? "bg-[#0084FF]"
                                  : type === "booking"
                                  ? "bg-[#25D366]"
                                  : "gradient-primary shadow-glow"
                              )}
                            >
                              {getActionLabel(type)}
                            </button>

                            {isUnread && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markRead(notification.id);
                                }}
                                className="px-3 py-1.5 rounded-full bg-primary/10 text-primary/80 text-[10px] font-semibold flex items-center gap-1 border border-primary/15"
                              >
                                <Check className="w-3 h-3" /> Letto
                              </button>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="ml-auto p-1.5 rounded-full hover:bg-destructive/10 transition-colors"
                              aria-label="Elimina notifica"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </MobileLayout>
  );
}
