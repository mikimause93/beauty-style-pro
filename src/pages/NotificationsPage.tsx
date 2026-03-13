import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Bell, Heart, MessageCircle, Calendar, Gift, Coins, Trash2, Users, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";

const typeIcons: Record<string, any> = {
  like: Heart,
  comment: MessageCircle,
  booking: Calendar,
  tip: Coins,
  follow: Users,
  challenge: Gift,
  message: MessageCircle,
  system: Bell,
  info: Bell,
};

const typeColors: Record<string, string> = {
  like: "text-primary bg-primary/20",
  comment: "text-secondary bg-secondary/20",
  booking: "text-green-500 bg-green-500/20",
  tip: "text-yellow-500 bg-yellow-500/20",
  follow: "text-primary bg-primary/20",
  challenge: "text-yellow-500 bg-yellow-500/20",
  message: "text-blue-400 bg-blue-400/20",
  system: "text-muted-foreground bg-muted",
  info: "text-muted-foreground bg-muted",
};

function formatTimeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "Adesso";
  if (s < 3600) return `${Math.floor(s / 60)} min fa`;
  if (s < 86400) return `${Math.floor(s / 3600)} ore fa`;
  if (s < 172800) return "Ieri";
  return `${Math.floor(s / 86400)}g fa`;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, unreadCount, loading, markAllRead, markRead, deleteNotification } = useNotifications();

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) markRead(notification.id);
    const type = notification.type || "info";
    const data = notification.data || {};

    // Navigate to relevant content based on notification type
    if (type === "like" && data.post_id) {
      navigate(`/`); // Go to home feed where the post is
    } else if (type === "comment" && data.post_id) {
      navigate(`/`); // Go to home feed where the post is
    } else if (type === "message" && data.conversation_id) {
      navigate(`/chat/${data.conversation_id}`);
    } else if (type === "follow" && data.follower_id) {
      navigate(`/profile/${data.follower_id}`);
    } else if (type === "booking") {
      navigate("/my-bookings");
    } else if (type === "tip") {
      navigate("/wallet");
    } else if (type === "challenge") {
      navigate("/challenges");
    }
  };

  if (!user) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
          <Bell className="w-12 h-12 text-primary mb-4" />
          <h2 className="text-xl font-display font-bold mb-2">Accedi per le notifiche</h2>
          <button onClick={() => navigate("/auth")} className="px-8 py-3 rounded-full gradient-primary text-primary-foreground font-semibold shadow-glow">
            Accedi
          </button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-display font-bold">Notifiche</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full gradient-primary text-primary-foreground text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary font-semibold">
              Segna tutto letto
            </button>
          )}
        </div>
      </header>

      <div className="p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nessuna notifica</p>
            <p className="text-xs text-muted-foreground mt-1">Le notifiche appariranno quando qualcuno interagisce con te</p>
          </div>
        ) : (
          notifications.map(notification => {
            const type = notification.type || "info";
            const Icon = typeIcons[type] || Bell;
            return (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left ${
                  notification.read ? "bg-card" : "bg-primary/5 border border-primary/10"
                } shadow-card`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${typeColors[type] || typeColors.info}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-semibold ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                      {notification.title}
                    </p>
                    <button onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}>
                      <Trash2 className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{formatTimeAgo(notification.created_at)}</p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>
    </MobileLayout>
  );
}
