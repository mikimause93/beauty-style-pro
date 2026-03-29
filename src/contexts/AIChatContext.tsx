import { createContext, useCallback, useContext, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { streamChat } from "@/lib/streamChat";
import type { ChatMsg } from "@/types/chat";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AIChatContextValue {
  messages: ChatMsg[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  retryLastMessage: () => void;
  clearMessages: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const AIChatContext = createContext<AIChatContextValue | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

function buildWelcomeMsg(displayName?: string): ChatMsg {
  return {
    id: "welcome",
    role: "assistant",
    content: `Ciao${displayName ? ` ${displayName}` : ""}! 👋 Sono Stella AI, il tuo assistente STYLE. Chiedimi consigli beauty, come usare l'app, prenotare servizi o qualsiasi altra cosa!`,
    createdAt: Date.now(),
    status: "sent",
    type: "text",
  };
}

export function AIChatProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();

  const [messages, setMessages] = useState<ChatMsg[]>(() => [
    buildWelcomeMsg(profile?.display_name),
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep last user text so retry can resend it
  const lastUserTextRef = useRef<string | null>(null);

  const doSend = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading || !user) return;

      setError(null);
      lastUserTextRef.current = text;

      const userMsg: ChatMsg = {
        id: Date.now().toString(),
        role: "user",
        content: text,
        createdAt: Date.now(),
        status: "sending",
        type: "text",
        userId: user.id,
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      // Mark user message as sent
      setMessages((prev) =>
        prev.map((m) => (m.id === userMsg.id ? { ...m, status: "sent" } : m))
      );

      const history = messages
        .filter((m) => m.id !== "welcome")
        .concat(userMsg)
        .filter((m): m is ChatMsg & { role: "user" | "assistant" } =>
          m.role === "user" || m.role === "assistant"
        )
        .map((m) => ({ role: m.role, content: m.content }));

      let assistantSoFar = "";

      try {
        await streamChat({
          userId: user.id,
          messages: history,
          onDelta: (chunk) => {
            assistantSoFar += chunk;
            const current = assistantSoFar;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant" && last.id === "streaming") {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: current } : m
                );
              }
              return [
                ...prev,
                {
                  id: "streaming",
                  role: "assistant" as const,
                  content: current,
                  createdAt: Date.now(),
                  status: "sending" as const,
                  type: "text" as const,
                },
              ];
            });
          },
          onDone: () => {
            // Finalize streaming message
            setMessages((prev) =>
              prev.map((m) =>
                m.id === "streaming"
                  ? { ...m, id: (Date.now() + 1).toString(), status: "sent" }
                  : m
              )
            );
            setIsLoading(false);
          },
          onError: (errMsg) => {
            setError(errMsg);
            toast.error(errMsg);
            // Mark streaming bubble as error if present, otherwise add fallback
            setMessages((prev) => {
              const hasStreaming = prev.some((m) => m.id === "streaming");
              if (hasStreaming) {
                return prev.map((m) =>
                  m.id === "streaming" ? { ...m, id: (Date.now() + 1).toString(), status: "error" } : m
                );
              }
              return [
                ...prev,
                {
                  id: (Date.now() + 1).toString(),
                  role: "assistant" as const,
                  content: "Mi dispiace, c'è stato un problema. Premi 🔄 per riprovare.",
                  createdAt: Date.now(),
                  status: "error" as const,
                  type: "text" as const,
                },
              ];
            });
            setIsLoading(false);
          },
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Errore nella risposta AI";
        setError(msg);
        toast.error(msg);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant" as const,
            content: "Mi dispiace, c'è stato un problema. Premi 🔄 per riprovare.",
            createdAt: Date.now(),
            status: "error" as const,
            type: "text" as const,
          },
        ]);
        setIsLoading(false);
      }
    },
    [isLoading, user, messages]
  );

  const retryLastMessage = useCallback(() => {
    if (!lastUserTextRef.current) return;
    // Remove any trailing error bubble before retrying
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      return last?.status === "error" ? prev.slice(0, -1) : prev;
    });
    doSend(lastUserTextRef.current);
  }, [doSend]);

  const clearMessages = useCallback(() => {
    setMessages([buildWelcomeMsg(profile?.display_name)]);
    setError(null);
    lastUserTextRef.current = null;
  }, [profile?.display_name]);

  return (
    <AIChatContext.Provider
      value={{ messages, isLoading, error, sendMessage: doSend, retryLastMessage, clearMessages }}
    >
      {children}
    </AIChatContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useAIChat(): AIChatContextValue {
  const ctx = useContext(AIChatContext);
  if (!ctx) throw new Error("useAIChat must be used inside AIChatProvider");
  return ctx;
}
