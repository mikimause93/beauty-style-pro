import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data: any;
  created_at: string;
}

// Request push notification permission and register SW
async function registerPushNotifications() {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;
    
    // SW is already registered via index.html
    const registration = await navigator.serviceWorker.ready;
    console.log("Push notifications ready via SW:", registration.scope);
  } catch (err) {
    console.warn("Push notification setup failed:", err);
  }
}

// Show a local notification when app is in background
function showLocalNotification(notif: AppNotification) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (document.visibilityState === "visible") return; // Don't show if app is focused

  const typeEmoji: Record<string, string> = {
    like: "❤️", comment: "💬", booking: "📅", tip: "💰",
    follow: "👤", challenge: "🏆", message: "✉️", system: "🔔", info: "ℹ️",
  };

  const icon = "/icons/icon-192x192.png";
  const badge = "/icons/icon-192x192.png";
  const emoji = typeEmoji[notif.type] || "🔔";

  try {
    const options: NotificationOptions = {
      body: notif.message,
      icon,
      badge,
      tag: notif.id,
      silent: false,
      data: { url: getNotificationUrl(notif) },
    };
    new Notification(`${emoji} ${notif.title}`, options);
  } catch {
    // Fallback: use SW notification
    navigator.serviceWorker?.ready.then(reg => {
      reg.showNotification(`${emoji} ${notif.title}`, {
        body: notif.message,
        icon,
        badge,
        tag: notif.id,
        data: { url: getNotificationUrl(notif) },
      } as NotificationOptions);
    });
  }
}

function getNotificationUrl(notif: AppNotification): string {
  const type = notif.type || "info";
  const data = notif.data || {};
  if (type === "message" && data.conversation_id) return `/chat/${data.conversation_id}`;
  if (type === "follow" && data.follower_id) return `/profile/${data.follower_id}`;
  if (type === "booking") return "/my-bookings";
  if (type === "tip") return "/wallet";
  if (type === "challenge") return "/challenges";
  return "/notifications";
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Request push permission on mount
  useEffect(() => {
    if (user) registerPushNotifications();
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    if (!user) { setNotifications([]); setUnreadCount(0); setLoading(false); return; }
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) {
      setNotifications(data as AppNotification[]);
      setUnreadCount(data.filter(n => !n.read).length);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time subscription + local push notification
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const newNotif = payload.new as AppNotification;
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show push notification when app is in background/closed
        showLocalNotification(newNotif);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(prev - 1, 0));
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications(prev => {
      const n = prev.find(x => x.id === id);
      if (n && !n.read) setUnreadCount(c => Math.max(c - 1, 0));
      return prev.filter(x => x.id !== id);
    });
  };

  return { notifications, unreadCount, loading, markAllRead, markRead, deleteNotification, refetch: fetchNotifications };
}
