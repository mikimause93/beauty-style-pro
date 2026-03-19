import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ─── Action limits ───────────────────────────────────────────────────────────
export const STELLA_LIMITS = {
  likes_per_day: 20,
  comments_per_day: 50,
  messages_per_hour: 20,
  follows_per_day: 15,
  cooldown_between_actions_ms: 2000,
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────
interface ActionCounters {
  likes_today: number;
  comments_today: number;
  messages_this_hour: number;
  follows_today: number;
  last_action_at: number; // epoch ms
  date_key: string; // YYYY-MM-DD
  hour_key: string; // YYYY-MM-DDTHH
}

export interface StellaActionResult {
  allowed: boolean;
  reason?: string;
  remaining?: number;
}

interface PendingAction {
  id: string;
  type: string;
  description: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface StellaContextType {
  // Rate-limit checks & logging
  canPerformAction: (type: "like" | "comment" | "message" | "follow") => StellaActionResult;
  recordAction: (type: "like" | "comment" | "message" | "follow") => void;
  getRemainingActions: (type: "like" | "comment" | "message" | "follow") => number;

  // Confirmation flow
  pendingAction: PendingAction | null;
  requestConfirmation: (
    type: string,
    description: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => void;
  confirmAction: () => void;
  cancelAction: () => void;

  // Stella settings
  stellaEnabled: boolean;
  autoActionsEnabled: boolean;
  toggleAutoActions: () => void;

  // Stats
  counters: ActionCounters;
}

// ─── Context ─────────────────────────────────────────────────────────────────
const StellaContext = createContext<StellaContextType | null>(null);

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function hourKey() {
  return new Date().toISOString().slice(0, 13);
}

const DEFAULT_COUNTERS: ActionCounters = {
  likes_today: 0,
  comments_today: 0,
  messages_this_hour: 0,
  follows_today: 0,
  last_action_at: 0,
  date_key: todayKey(),
  hour_key: hourKey(),
};

export function StellaProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [stellaEnabled] = useState(true);
  const [autoActionsEnabled, setAutoActionsEnabled] = useState(false);

  // Use ref for counters so they don't cause re-renders on every action
  const countersRef = useRef<ActionCounters>({ ...DEFAULT_COUNTERS });
  const [counters, setCounters] = useState<ActionCounters>({ ...DEFAULT_COUNTERS });

  // Reset daily/hourly counters when the period rolls over
  const freshCounters = useCallback((): ActionCounters => {
    const c = countersRef.current;
    const today = todayKey();
    const hour = hourKey();
    let changed = false;

    if (c.date_key !== today) {
      c.likes_today = 0;
      c.comments_today = 0;
      c.follows_today = 0;
      c.date_key = today;
      changed = true;
    }
    if (c.hour_key !== hour) {
      c.messages_this_hour = 0;
      c.hour_key = hour;
      changed = true;
    }
    if (changed) setCounters({ ...c });
    return c;
  }, []);

  const canPerformAction = useCallback((type: "like" | "comment" | "message" | "follow"): StellaActionResult => {
    const c = freshCounters();
    const now = Date.now();

    // Global cooldown
    if (now - c.last_action_at < STELLA_LIMITS.cooldown_between_actions_ms) {
      return {
        allowed: false,
        reason: `Attendi ${Math.ceil((STELLA_LIMITS.cooldown_between_actions_ms - (now - c.last_action_at)) / 1000)}s prima della prossima azione`,
      };
    }

    switch (type) {
      case "like":
        if (c.likes_today >= STELLA_LIMITS.likes_per_day) {
          return { allowed: false, reason: `Limite giornaliero like raggiunto (max ${STELLA_LIMITS.likes_per_day}/giorno)`, remaining: 0 };
        }
        return { allowed: true, remaining: STELLA_LIMITS.likes_per_day - c.likes_today };
      case "comment":
        if (c.comments_today >= STELLA_LIMITS.comments_per_day) {
          return { allowed: false, reason: `Limite giornaliero commenti raggiunto (max ${STELLA_LIMITS.comments_per_day}/giorno)`, remaining: 0 };
        }
        return { allowed: true, remaining: STELLA_LIMITS.comments_per_day - c.comments_today };
      case "message":
        if (c.messages_this_hour >= STELLA_LIMITS.messages_per_hour) {
          return { allowed: false, reason: `Limite orario messaggi raggiunto (max ${STELLA_LIMITS.messages_per_hour}/ora)`, remaining: 0 };
        }
        return { allowed: true, remaining: STELLA_LIMITS.messages_per_hour - c.messages_this_hour };
      case "follow":
        if (c.follows_today >= STELLA_LIMITS.follows_per_day) {
          return { allowed: false, reason: `Limite giornaliero follow raggiunto (max ${STELLA_LIMITS.follows_per_day}/giorno)`, remaining: 0 };
        }
        return { allowed: true, remaining: STELLA_LIMITS.follows_per_day - c.follows_today };
      default:
        return { allowed: true };
    }
  }, [freshCounters]);

  const recordAction = useCallback((type: "like" | "comment" | "message" | "follow") => {
    const c = freshCounters();
    c.last_action_at = Date.now();

    switch (type) {
      case "like":       c.likes_today++;          break;
      case "comment":    c.comments_today++;        break;
      case "message":    c.messages_this_hour++;    break;
      case "follow":     c.follows_today++;         break;
    }

    setCounters({ ...c });

    // Log to supabase if user is logged in (fire & forget)
    if (user) {
      supabase.from("stella_action_log" as Parameters<typeof supabase.from>[0]).insert({
        user_id: user.id,
        action_type: type,
        timestamp: new Date().toISOString(),
      }).then(({ error }) => {
        if (error) console.warn("[Stella] action log insert failed:", error.message);
      });
    }
  }, [freshCounters, user]);

  const getRemainingActions = useCallback((type: "like" | "comment" | "message" | "follow"): number => {
    const c = freshCounters();
    switch (type) {
      case "like":    return Math.max(0, STELLA_LIMITS.likes_per_day - c.likes_today);
      case "comment": return Math.max(0, STELLA_LIMITS.comments_per_day - c.comments_today);
      case "message": return Math.max(0, STELLA_LIMITS.messages_per_hour - c.messages_this_hour);
      case "follow":  return Math.max(0, STELLA_LIMITS.follows_per_day - c.follows_today);
      default:        return Infinity;
    }
  }, [freshCounters]);

  const requestConfirmation = useCallback((
    type: string,
    description: string,
    onConfirm: () => void,
    onCancel?: () => void,
  ) => {
    const id = crypto.randomUUID();
    setPendingAction({ id, type, description, onConfirm, onCancel });
  }, []);

  const confirmAction = useCallback(() => {
    if (pendingAction) {
      pendingAction.onConfirm();
      setPendingAction(null);
    }
  }, [pendingAction]);

  const cancelAction = useCallback(() => {
    if (pendingAction) {
      pendingAction.onCancel?.();
      toast.info("Azione annullata");
    }
    setPendingAction(null);
  }, [pendingAction]);

  const toggleAutoActions = useCallback(() => {
    setAutoActionsEnabled(prev => {
      const next = !prev;
      if (next) {
        toast.success("Azioni automatiche Stella abilitate ✅", {
          description: `Limiti: ${STELLA_LIMITS.likes_per_day} like/giorno, ${STELLA_LIMITS.comments_per_day} commenti/giorno`,
        });
      } else {
        toast.info("Azioni automatiche Stella disabilitate");
      }
      return next;
    });
  }, []);

  return (
    <StellaContext.Provider value={{
      canPerformAction,
      recordAction,
      getRemainingActions,
      pendingAction,
      requestConfirmation,
      confirmAction,
      cancelAction,
      stellaEnabled,
      autoActionsEnabled,
      toggleAutoActions,
      counters,
    }}>
      {children}
      {/* Inline confirmation dialog rendered at the top level */}
      {pendingAction && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                <span className="text-lg">⭐</span>
              </div>
              <div>
                <p className="text-sm font-bold">Stella richiede conferma</p>
                <p className="text-xs text-muted-foreground">{pendingAction.type}</p>
              </div>
            </div>
            <p className="text-sm text-foreground mb-4">{pendingAction.description}</p>
            <div className="flex gap-3">
              <button
                onClick={cancelAction}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={confirmAction}
                className="flex-1 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
              >
                Conferma ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </StellaContext.Provider>
  );
}

export function useStella(): StellaContextType {
  const ctx = useContext(StellaContext);
  if (!ctx) throw new Error("useStella must be used within StellaProvider");
  return ctx;
}

export default StellaContext;
