import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Check, CheckCheck, Bell, Heart, MessageCircle, Calendar, Gift, Coins, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface Notification {
  id: string;
  type: "like" | "comment" | "booking" | "tip" | "follow" | "challenge" | "system";
  title: string;
  message: string;
  time: string;
  read: boolean;
  avatar?: string;
}

const fallbackNotifications: Notification[] = [
  { id: "1", type: "like", title: "Nuovo Like", message: "Martina Rossi ha messo like al tuo post", time: "2 min fa", read: false },
  { id: "2", type: "comment", title: "Nuovo Commento", message: "Anna Style: \"Bellissimo risultato! 😍\"", time: "15 min fa", read: false },
  { id: "3", type: "booking", title: "Prenotazione Confermata", message: "Appuntamento con Beauty Rossi - Gio 15:00", time: "1 ora fa", read: false },
  { id: "4", type: "tip", title: "Tip Ricevuto!", message: "Hai ricevuto 25 QRCoins da Marco88", time: "2 ore fa", read: true },
  { id: "5", type: "follow", title: "Nuovo Follower", message: "Salon Luxe ha iniziato a seguirti", time: "3 ore fa", read: true },
  { id: "6", type: "challenge", title: "Challenge Completata!", message: "Hai completato 'Social Star' - +30 QRC", time: "Ieri", read: true },
  { id: "7", type: "system", title: "Benvenuto su Stayle!", message: "Completa il profilo per guadagnare 50 QRCoins", time: "2g fa", read: true },
  { id: "8", type: "like", title: "I tuoi post vanno forte! 🔥", message: "Il tuo ultimo post ha ricevuto 100+ like", time: "3g fa", read: true },
];

const typeIcons: Record<string, any> = {
  like: Heart,
  comment: MessageCircle,
  booking: Calendar,
  tip: Coins,
  follow: Bell,
  challenge: Gift,
  system: Bell,
};

const typeColors: Record<string, string> = {
  like: "text-primary bg-primary/20",
  comment: "text-secondary bg-secondary/20",
  booking: "text-success bg-success/20",
  tip: "text-gold bg-gold/20",
  follow: "text-primary bg-primary/20",
  challenge: "text-gold bg-gold/20",
  system: "text-muted-foreground bg-muted",
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(fallbackNotifications);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nessuna notifica</p>
          </div>
        ) : (
          notifications.map(notification => {
            const Icon = typeIcons[notification.type] || Bell;
            return (
              <div
                key={notification.id}
                className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                  notification.read ? "bg-card" : "bg-primary/5 border border-primary/10"
                } shadow-card`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${typeColors[notification.type]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-semibold ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                      {notification.title}
                    </p>
                    <button onClick={() => deleteNotification(notification.id)}>
                      <Trash2 className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{notification.time}</p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                )}
              </div>
            );
          })
        )}
      </div>
    </MobileLayout>
  );
}
