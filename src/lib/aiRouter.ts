import { supabase } from "@/integrations/supabase/client";

type AIRole = "user" | "business" | "admin" | "beauty" | "shop" | "job" | "live" | "map" | "auto";

interface AIRouterOptions {
  role?: AIRole;
  message?: string;
  messages?: Array<{ role: string; content: string }>;
  userId?: string;
  context?: Record<string, any>;
  stream?: boolean;
}

/**
 * Call the AI Router edge function for role-based AI responses.
 * Uses Lovable AI Gateway with automatic prompt routing.
 */
export async function askAI(options: AIRouterOptions): Promise<string> {
  const { data, error } = await supabase.functions.invoke("ai-router", {
    body: {
      role: options.role || "auto",
      message: options.message,
      messages: options.messages,
      user_id: options.userId,
      context: options.context,
      stream: false,
    },
  });

  if (error) throw error;
  return data?.reply || "Mi dispiace, non riesco a rispondere.";
}

/**
 * Stream AI response from the AI Router with SSE.
 */
export async function streamAI(options: AIRouterOptions & {
  onDelta: (text: string) => void;
  onDone: () => void;
  onError?: (error: string) => void;
}) {
  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-router`;

  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      role: options.role || "auto",
      message: options.message,
      messages: options.messages,
      user_id: options.userId,
      context: options.context,
      stream: true,
    }),
  });

  if (resp.status === 429) {
    options.onError?.("Troppe richieste, riprova tra poco");
    return;
  }
  if (!resp.ok) {
    // Try to extract fallback reply from JSON response
    try {
      const fallback = await resp.json();
      if (fallback?.reply) {
        options.onDelta(fallback.reply);
        options.onDone();
        return;
      }
    } catch { /* ignore fallback fetch errors */ }
    options.onError?.("Servizio AI temporaneamente non disponibile");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { streamDone = true; break; }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) options.onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  // Final flush
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) options.onDelta(content);
      } catch { /* ignore */ }
    }
  }

  options.onDone();
}

/** Available AI roles */
export const AI_ROLES = {
  AUTO: "auto" as AIRole,
  USER: "user" as AIRole,
  BUSINESS: "business" as AIRole,
  ADMIN: "admin" as AIRole,
  BEAUTY: "beauty" as AIRole,
  SHOP: "shop" as AIRole,
  JOB: "job" as AIRole,
  LIVE: "live" as AIRole,
  MAP: "map" as AIRole,
} as const;
