import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

let runtimeSessionId: string | null = null;

function getDeviceType(): string {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function getSessionId(): string {
  if (!runtimeSessionId) {
    runtimeSessionId = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  }

  return runtimeSessionId;
}

export function usePageTracking() {
  const location = useLocation();
  const lastPath = useRef("");

  useEffect(() => {
    const path = location.pathname;
    if (path === lastPath.current) return;
    lastPath.current = path;

    const timer = window.setTimeout(async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        await (supabase.from("page_views") as any).insert({
          page_path: path,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
          device_type: getDeviceType(),
          session_id: getSessionId(),
          user_id: user?.id || null,
        });
      } catch {
        // silent fail
      }
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [location.pathname]);
}
