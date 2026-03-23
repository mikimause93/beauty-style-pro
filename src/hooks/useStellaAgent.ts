import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { useVoiceSynthesis } from "@/hooks/useVoiceSynthesis";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Rate limits ──────────────────────────────────────────────────────────────
const LIMITS = {
  like: { perHour: 20, cooldownMs: 3000 },
  comment: { perHour: 10, cooldownMs: 5000 },
  message: { perHour: 20, cooldownMs: 3000 },
  follow: { perHour: 15, cooldownMs: 5000 },
  navigate: { perHour: 999, cooldownMs: 0 },
  book: { perHour: 10, cooldownMs: 0 },
  info: { perHour: 999, cooldownMs: 0 },
  search: { perHour: 999, cooldownMs: 0 },
} as const;

// Actions that ALWAYS require voice confirmation before executing
const CONFIRMATION_REQUIRED = new Set([
  "book",
  "payment",
  "follow",
  "message",
  "delete",
  "spend_coins",
]);

export interface StellaCommand {
  id: string;
  type:
    | "navigate"
    | "search"
    | "message"
    | "like"
    | "comment"
    | "follow"
    | "book"
    | "info"
    | "schedule"
    | "call"
    | "payment";
  text: string;
  response: string;
  requiresConfirmation: boolean;
  execute: () => void;
}

interface StellaMessage {
  id: string;
  role: "user" | "stella";
  content: string;
  type?: "text" | "confirmation" | "action_result";
  pending?: StellaCommand;
}

// In-memory rate-limit tracker
const actionCounts = new Map<string, { count: number; resetAt: number }>();

function checkLimit(actionType: string): { allowed: boolean; remaining: number } {
  const limit = LIMITS[actionType as keyof typeof LIMITS] ?? { perHour: 30 };
  const key = actionType;
  const now = Date.now();
  let entry = actionCounts.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + 3600000 };
    actionCounts.set(key, entry);
  }
  const remaining = limit.perHour - entry.count;
  return { allowed: remaining > 0, remaining };
}

function recordAction(actionType: string) {
  const now = Date.now();
  let entry = actionCounts.get(actionType);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + 3600000 };
    actionCounts.set(actionType, entry);
  }
  entry.count++;
}

export function useStellaAgent() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { speak, cancel: cancelTTS, speaking } = useVoiceSynthesis();
  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isWakeWordListening,
    startWakeWordListening,
    stopWakeWordListening,
    isSupported,
  } = useVoiceRecognition({
    continuous: false,
    interimResults: true,
    language: "it-IT",
    wakeWordEnabled: true,
    wakeWords: ["stella", "hey stella", "ehi stella", "ciao stella"],
    onWakeWordDetected: () => {
      speak("Ciao! Come posso aiutarti?");
    },
  });

  const [messages, setMessages] = useState<StellaMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [wakeWordActive, setWakeWordActive] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [pendingCommand, setPendingCommand] = useState<StellaCommand | null>(null);

  // Process transcript when listening stops
  useEffect(() => {
    if (transcript && !isListening) {
      handleCommand(transcript);
      resetTranscript();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, isListening]);

  const addMessage = useCallback((msg: Omit<StellaMessage, "id">) => {
    setMessages((prev) => [...prev, { ...msg, id: Date.now().toString() + Math.random() }]);
  }, []);

  const stellaSpeak = useCallback(
    (text: string) => {
      if (ttsEnabled) speak(text);
    },
    [ttsEnabled, speak]
  );

  // ── Command parser ──────────────────────────────────────────────────────
  const parseCommand = useCallback(
    (text: string): StellaCommand | null => {
      const t = text.toLowerCase().trim();

      // ── NAVIGATION (free, no confirmation) ────────────────────────────────
      const navRoutes: Array<{ patterns: string[]; route: string; response: string }> = [
        {
          patterns: ["vai alla home", "apri home", "torna alla home"],
          route: "/",
          response: "Ti porto alla home!",
        },
        {
          patterns: ["apri chat", "vai alla chat", "messaggi"],
          route: "/chat",
          response: "Apro la chat!",
        },
        {
          patterns: ["apri notifiche", "le notifiche", "dimmi le notifiche"],
          route: "/notifications",
          response: "Ecco le tue notifiche!",
        },
        {
          patterns: ["apri profilo", "vai al profilo", "il mio profilo"],
          route: "/profile",
          response: "Ecco il tuo profilo!",
        },
        {
          patterns: ["apri wallet", "vai al wallet", "portafoglio"],
          route: "/wallet",
          response: "Apro il tuo wallet!",
        },
        {
          patterns: ["apri mappa", "cerca sulla mappa", "mappa"],
          route: "/map-search",
          response: "Apro la mappa!",
        },
        {
          patterns: ["vai allo shop", "apri shop", "negozio"],
          route: "/shop",
          response: "Apro lo shop!",
        },
        {
          patterns: ["vai alle missioni", "apri missioni"],
          route: "/missions",
          response: "Ecco le tue missioni!",
        },
        {
          patterns: ["gira la ruota", "ruota della fortuna"],
          route: "/spin",
          response: "Apro la ruota della fortuna!",
        },
        {
          patterns: ["vai in live", "apri live"],
          route: "/live",
          response: "Ti porto nella sezione live!",
        },
        { patterns: ["apri radio", "musica"], route: "/radio", response: "Apro la radio!" },
        {
          patterns: ["impostazioni", "apri impostazioni"],
          route: "/settings",
          response: "Apro le impostazioni!",
        },
        {
          patterns: ["esplora", "apri esplora"],
          route: "/explore",
          response: "Apro la sezione esplora!",
        },
        {
          patterns: ["crea post", "pubblica"],
          route: "/create-post",
          response: "Apro la creazione di un nuovo post!",
        },
        {
          patterns: ["le mie prenotazioni", "mostra prenotazioni"],
          route: "/my-bookings",
          response: "Ecco le tue prenotazioni!",
        },
        {
          patterns: ["classifica", "leaderboard"],
          route: "/leaderboard",
          response: "Apro la classifica!",
        },
        {
          patterns: ["sfide", "challenge"],
          route: "/challenges",
          response: "Ecco le sfide attive!",
        },
        { patterns: ["shorts", "video brevi"], route: "/shorts", response: "Apro i video shorts!" },
        { patterns: ["eventi", "apri eventi"], route: "/events", response: "Ecco gli eventi!" },
        {
          patterns: ["marketplace", "apri marketplace"],
          route: "/marketplace",
          response: "Apro il marketplace!",
        },
        {
          patterns: ["spa", "terme", "benessere"],
          route: "/spa-terme",
          response: "Ecco le Spa e Terme!",
        },
        {
          patterns: ["quiz", "gioca al quiz"],
          route: "/quiz-live",
          response: "Apro il Quiz Live!",
        },
        {
          patterns: ["talent", "gioco talent"],
          route: "/talent-game",
          response: "Apro il Talent Game!",
        },
        {
          patterns: ["referral", "invita amici"],
          route: "/referral",
          response: "Apro il programma referral!",
        },
        {
          patterns: ["abbonamento", "abbonamenti", "subscription"],
          route: "/subscriptions",
          response: "Ecco i piani di abbonamento!",
        },
        {
          patterns: ["promemoria", "reminder"],
          route: "/reminders",
          response: "Ecco i tuoi promemoria!",
        },
      ];

      for (const nav of navRoutes) {
        if (nav.patterns.some((p) => t.includes(p))) {
          return {
            id: Date.now().toString(),
            type: "navigate",
            text,
            response: nav.response,
            requiresConfirmation: false,
            execute: () => navigate(nav.route),
          };
        }
      }

      // ── BACK / SCROLL ─────────────────────────────────────────────────────
      if (t.includes("torna indietro") || t.includes("vai indietro") || t === "indietro") {
        return {
          id: Date.now().toString(),
          type: "navigate",
          text,
          response: "Torno indietro!",
          requiresConfirmation: false,
          execute: () => window.history.back(),
        };
      }
      if (t.includes("scorri su") || t.includes("vai su")) {
        return {
          id: Date.now().toString(),
          type: "navigate",
          text,
          response: "Scorro verso l'alto!",
          requiresConfirmation: false,
          execute: () => window.scrollBy({ top: -400, behavior: "smooth" }),
        };
      }
      if (t.includes("scorri giù") || t.includes("vai giù")) {
        return {
          id: Date.now().toString(),
          type: "navigate",
          text,
          response: "Scorro verso il basso!",
          requiresConfirmation: false,
          execute: () => window.scrollBy({ top: 400, behavior: "smooth" }),
        };
      }

      // ── MESSAGE (requires confirmation) ───────────────────────────────────
      const msgMatch = t.match(
        /(?:invia|scrivi|manda)\s+(?:un\s+)?messaggio\s+a\s+([^:,]+?)(?:\s*[,:]\s*|\s+(?:che|dicendo|scrivendo)\s+)(.+)/
      );
      if (msgMatch) {
        const recipient = msgMatch[1].trim();
        const content = msgMatch[2].trim();
        return {
          id: Date.now().toString(),
          type: "message",
          text,
          response: `Vuoi che invii a ${recipient}: "${content}"? Confermi?`,
          requiresConfirmation: true,
          execute: () => {
            navigate("/chat");
            toast.info(`Cerco "${recipient}" per inviare: "${content}"`);
          },
        };
      }
      const msgSimple = t.match(/(?:invia|scrivi|manda)\s+(?:un\s+)?messaggio\s+a\s+(.+)/);
      if (msgSimple) {
        return {
          id: Date.now().toString(),
          type: "message",
          text,
          response: `Vuoi aprire la chat con ${msgSimple[1]}? Confermi?`,
          requiresConfirmation: true,
          execute: () => {
            navigate("/chat");
            toast.info(`Cerco "${msgSimple[1]}"...`);
          },
        };
      }

      // ── LIKE (limited to 20/hour, no confirmation) ────────────────────────
      if (t.match(/metti\s+like|dai\s+like|mi\s+piace/)) {
        return {
          id: Date.now().toString(),
          type: "like",
          text,
          response: "Like aggiunto! ❤️",
          requiresConfirmation: false,
          execute: () => {
            toast.success("Like aggiunto!");
            recordAction("like");
          },
        };
      }

      // ── FOLLOW (requires confirmation) ────────────────────────────────────
      const followMatch = t.match(/(?:segui|aggiungi)\s+(.+)/);
      if (followMatch) {
        const target = followMatch[1].trim();
        return {
          id: Date.now().toString(),
          type: "follow",
          text,
          response: `Vuoi seguire ${target}? Confermi?`,
          requiresConfirmation: true,
          execute: () => {
            navigate("/search");
            toast.info(`Cerco "${target}" per seguirlo`);
          },
        };
      }

      // ── BOOKING (requires confirmation) ───────────────────────────────────
      if (t.includes("prenota") || t.includes("prenotazione") || t.includes("appuntamento")) {
        return {
          id: Date.now().toString(),
          type: "book",
          text,
          response: "Vuoi cercare professionisti per prenotare? Confermi?",
          requiresConfirmation: true,
          execute: () => navigate("/stylists"),
        };
      }

      // ── CALL (requires confirmation) ──────────────────────────────────────
      const callMatch = t.match(/(?:chiama|telefona|videochiama)\s+(.+)/);
      if (callMatch) {
        return {
          id: Date.now().toString(),
          type: "call",
          text,
          response: `Vuoi chiamare ${callMatch[1]}? Confermi?`,
          requiresConfirmation: true,
          execute: () => {
            navigate("/chat");
            toast.info(`Cerco "${callMatch[1]}" per la chiamata...`);
          },
        };
      }

      // ── SEARCH ────────────────────────────────────────────────────────────
      const searchMatch = t.match(/^cerca\s+(.+)$/);
      if (searchMatch) {
        const q = searchMatch[1].trim();
        return {
          id: Date.now().toString(),
          type: "search",
          text,
          response: `Cerco "${q}"!`,
          requiresConfirmation: false,
          execute: () => navigate(`/search?q=${encodeURIComponent(q)}`),
        };
      }

      // ── MAP SEARCH with distance ──────────────────────────────────────────
      const mapMatch = t.match(
        /cerca\s+(?:match|amici|persone|stilisti)\s+(?:a|entro|vicino|nel\s+raggio\s+di)\s*(\d+)\s*km/
      );
      if (mapMatch) {
        return {
          id: Date.now().toString(),
          type: "search",
          text,
          response: `Cerco match entro ${mapMatch[1]} km!`,
          requiresConfirmation: false,
          execute: () => navigate(`/map-search?radius=${mapMatch[1]}`),
        };
      }
      if (t.includes("cerca match") || t.includes("match vicini")) {
        return {
          id: Date.now().toString(),
          type: "search",
          text,
          response: "Apro la mappa dei match!",
          requiresConfirmation: false,
          execute: () => navigate("/map-search"),
        };
      }

      // ── INFO queries ──────────────────────────────────────────────────────
      if (t.includes("quanti coin") || t.includes("quante monete") || t.includes("saldo")) {
        const coins = profile?.qr_coins ?? 0;
        return {
          id: Date.now().toString(),
          type: "info",
          text,
          response: `Hai ${coins} QR Coins nel tuo wallet!`,
          requiresConfirmation: false,
          execute: () => {},
        };
      }
      if (t.includes("prossimo appuntamento") || t.includes("prossima prenotazione")) {
        return {
          id: Date.now().toString(),
          type: "info",
          text,
          response: "Apro le tue prenotazioni per verificare!",
          requiresConfirmation: false,
          execute: () => navigate("/my-bookings"),
        };
      }

      // ── THEME ─────────────────────────────────────────────────────────────
      if (t.includes("tema chiaro") || t.includes("light mode") || t.includes("modalità chiara")) {
        return {
          id: Date.now().toString(),
          type: "navigate",
          text,
          response: "Attivo il tema chiaro! ☀️",
          requiresConfirmation: false,
          execute: () => {
            document.documentElement.classList.remove("dark");
            document.documentElement.classList.add("light");
            toast.success("Tema chiaro attivato");
          },
        };
      }
      if (t.includes("tema scuro") || t.includes("dark mode") || t.includes("modalità scura")) {
        return {
          id: Date.now().toString(),
          type: "navigate",
          text,
          response: "Attivo il tema scuro! 🌙",
          requiresConfirmation: false,
          execute: () => {
            document.documentElement.classList.remove("light");
            document.documentElement.classList.add("dark");
            toast.success("Tema scuro attivato");
          },
        };
      }

      // ── SCHEDULING (requires confirmation) ────────────────────────────────
      const scheduleMatch = t.match(
        /(?:ricordami|promemoria|schedula|programma)\s+(?:di\s+)?(.+?)(?:\s+(?:tra|fra|per|il|domani|dopodomani)\s+(.+))?$/
      );
      if (scheduleMatch && user) {
        const actionDesc = scheduleMatch[1]?.trim() || "azione programmata";
        const timeDesc = scheduleMatch[2]?.trim() || "domani";
        // Simple time parsing
        const scheduledDate = new Date();
        if (timeDesc.includes("domani")) scheduledDate.setDate(scheduledDate.getDate() + 1);
        else if (timeDesc.includes("dopodomani"))
          scheduledDate.setDate(scheduledDate.getDate() + 2);
        else if (timeDesc.match(/(\d+)\s*(?:ore|ora|h)/)) {
          const hours = parseInt(timeDesc.match(/(\d+)\s*(?:ore|ora|h)/)![1]);
          scheduledDate.setHours(scheduledDate.getHours() + hours);
        } else if (timeDesc.match(/(\d+)\s*(?:minuti|min)/)) {
          const mins = parseInt(timeDesc.match(/(\d+)\s*(?:minuti|min)/)![1]);
          scheduledDate.setMinutes(scheduledDate.getMinutes() + mins);
        } else if (timeDesc.match(/(\d+)\s*(?:giorni|giorno|gg)/)) {
          const days = parseInt(timeDesc.match(/(\d+)\s*(?:giorni|giorno|gg)/)![1]);
          scheduledDate.setDate(scheduledDate.getDate() + days);
        }

        return {
          id: Date.now().toString(),
          type: "schedule" as StellaCommand["type"],
          text,
          response: `Programmo "${actionDesc}" per ${scheduledDate.toLocaleDateString("it-IT")} ${scheduledDate.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}. Confermi?`,
          requiresConfirmation: true,
          execute: () => {
            supabase
              .from("stella_scheduled_actions")
              .insert({
                user_id: user.id,
                action_type: "booking_reminder",
                action_params: { message: actionDesc },
                scheduled_for: scheduledDate.toISOString(),
              })
              .then(({ error }) => {
                if (error) toast.error("Errore nella programmazione");
                else toast.success("Azione programmata con successo!");
              });
          },
        };
      }

      return null;
    },
    [navigate, profile]
  );

  // ── Handle command ──────────────────────────────────────────────────────
  const handleCommand = useCallback(
    (text: string) => {
      addMessage({ role: "user", content: text });

      const cmd = parseCommand(text);
      if (!cmd) {
        const fallback =
          'Non ho capito. Prova: "apri chat", "prenota", "cerca [termine]", "invia messaggio a...", "torna indietro".';
        addMessage({ role: "stella", content: fallback });
        stellaSpeak(fallback);
        return;
      }

      // Rate limit check
      const limit = checkLimit(cmd.type);
      if (!limit.allowed) {
        const msg = `Hai raggiunto il limite di ${cmd.type} per quest'ora. Rimanenti: ${limit.remaining}`;
        addMessage({ role: "stella", content: msg });
        stellaSpeak(msg);
        return;
      }

      if (cmd.requiresConfirmation) {
        setPendingCommand(cmd);
        addMessage({ role: "stella", content: cmd.response, type: "confirmation", pending: cmd });
        stellaSpeak(cmd.response);
      } else {
        cmd.execute();
        recordAction(cmd.type);
        addMessage({ role: "stella", content: cmd.response, type: "action_result" });
        stellaSpeak(cmd.response);

        // Log to DB
        if (user) {
          supabase
            .from("stella_commands")
            .insert({
              user_id: user.id,
              command_text: text,
              command_type: cmd.type,
              status: "completed",
              executed_at: new Date().toISOString(),
            })
            .then(() => {});
        }
      }
    },
    [addMessage, parseCommand, stellaSpeak, user]
  );

  // ── Confirm / Cancel pending action ─────────────────────────────────────
  const confirmAction = useCallback(() => {
    if (!pendingCommand) return;
    pendingCommand.execute();
    recordAction(pendingCommand.type);
    addMessage({ role: "stella", content: "Fatto! ✅", type: "action_result" });
    stellaSpeak("Fatto!");

    if (user) {
      supabase
        .from("stella_commands")
        .insert({
          user_id: user.id,
          command_text: pendingCommand.text,
          command_type: pendingCommand.type,
          status: "completed",
          requires_confirmation: true,
          confirmed_at: new Date().toISOString(),
          executed_at: new Date().toISOString(),
        })
        .then(() => {});
    }

    setPendingCommand(null);
  }, [pendingCommand, addMessage, stellaSpeak, user]);

  const cancelAction = useCallback(() => {
    setPendingCommand(null);
    addMessage({ role: "stella", content: "Azione annullata." });
    stellaSpeak("Annullato.");
  }, [addMessage, stellaSpeak]);

  // ── Text input handler ──────────────────────────────────────────────────
  const sendTextCommand = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      handleCommand(text.trim());
    },
    [handleCommand]
  );

  // ── Wake word toggle ────────────────────────────────────────────────────
  const toggleWakeWord = useCallback(() => {
    if (wakeWordActive) {
      stopWakeWordListening();
      setWakeWordActive(false);
    } else {
      startWakeWordListening();
      setWakeWordActive(true);
    }
  }, [wakeWordActive, startWakeWordListening, stopWakeWordListening]);

  const toggleTTS = useCallback(() => {
    setTtsEnabled((prev) => !prev);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    messages,
    isOpen,
    setIsOpen,
    wakeWordActive,
    ttsEnabled,
    isListening,
    isWakeWordListening,
    interimTranscript,
    speaking,
    pendingCommand,
    isSupported,
    toggleWakeWord,
    toggleTTS,
    toggleListening,
    sendTextCommand,
    confirmAction,
    cancelAction,
    clearMessages: useCallback(() => setMessages([]), []),
  };
}
