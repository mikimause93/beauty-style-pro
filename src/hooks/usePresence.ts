import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Updates the current user's last_seen timestamp every 60s.
 * Also provides a helper to check if another user is "online" (seen < 2min ago).
 */
export function usePresenceTracker() {
  const { user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updatePresence = useCallback(async () => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ last_seen: new Date().toISOString() })
      .eq("user_id", user.id);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    // Update immediately
    updatePresence();
    // Then every 60 seconds
    intervalRef.current = setInterval(updatePresence, 60_000);

    // Also update on visibility change (tab focus)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") updatePresence();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user, updatePresence]);
}

/** Returns true if last_seen is within the last 2 minutes */
export function isUserOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  const diff = Date.now() - new Date(lastSeen).getTime();
  return diff < 2 * 60 * 1000; // 2 minutes
}

/** Formats a last_seen timestamp into a human-readable string */
export function formatLastSeen(lastSeen: string | null): string {
  if (!lastSeen) return "offline";
  const diff = Date.now() - new Date(lastSeen).getTime();
  if (diff < 2 * 60 * 1000) return "online";
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)} min fa`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)} ore fa`;
  return new Date(lastSeen).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}
