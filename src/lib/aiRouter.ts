import { supabase } from "@/integrations/supabase/client";
import {
  azureOpenAIChat,
  azureOpenAIStream,
  isAzureOpenAIEnabled,
} from "@/lib/azureAI";

type AIRole = "user" | "business" | "admin" | "beauty" | "shop" | "job" | "live" | "map" | "auto";

interface AIRouterOptions {
  role?: AIRole;
  message?: string;
  messages?: Array<{ role: string; content: string }>;
  userId?: string;
  context?: Record<string, any>;
  stream?: boolean;
}

/** System prompt per role, used when calling Azure OpenAI directly. */
const ROLE_SYSTEM_PROMPTS: Record<string, string> = {
  user:     "Sei Stella, assistente AI di STYLE. Aiuta l'utente con consigli beauty, prenotazioni e uso dell'app. Rispondi in italiano.",
  business: "Sei un consulente AI per professionisti della bellezza su STYLE. Aiuta con gestione clienti, marketing e crescita del business. Rispondi in italiano.",
  admin:    "Sei un assistente per l'amministrazione di STYLE. Rispondi in italiano.",
  beauty:   "Sei un esperto di beauty e moda su STYLE. Dai consigli su tagli, colori, tendenze e cura della persona. Rispondi in italiano.",
  shop:     "Sei un assistente per lo shop di STYLE. Aiuta con prodotti, ordini e promozioni. Rispondi in italiano.",
  job:      "Sei un recruiter AI per il settore beauty su STYLE. Aiuta con annunci di lavoro e candidature. Rispondi in italiano.",
  live:     "Sei un assistente per le live su STYLE. Aiuta streamer e spettatori. Rispondi in italiano.",
  map:      "Sei un assistente per la ricerca geolocalizzata su STYLE. Aiuta a trovare professionisti vicini. Rispondi in italiano.",
  auto:     "Sei Stella, assistente AI di STYLE. Aiuta l'utente con qualsiasi domanda. Rispondi in italiano.",
};

type AzureMsg = { role: "system" | "user" | "assistant"; content: string };

/** Build the Azure OpenAI messages array from AIRouterOptions. */
function buildAzureMessages(options: AIRouterOptions): AzureMsg[] {
  const role = options.role || "auto";
  const systemPrompt = ROLE_SYSTEM_PROMPTS[role] ?? ROLE_SYSTEM_PROMPTS.auto;
  const systemMsg: AzureMsg = { role: "system", content: systemPrompt };

  if (options.messages) {
    return [
      systemMsg,
      ...options.messages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
    ];
  }

  return [systemMsg, { role: "user", content: options.message ?? "" }];
}

/**
 * Call the AI Router for role-based AI responses.
 * Uses Azure OpenAI when configured, otherwise falls back to the Supabase Edge Function.
 */
export async function askAI(options: AIRouterOptions): Promise<string> {
  if (isAzureOpenAIEnabled()) {
    return azureOpenAIChat({ messages: buildAzureMessages(options) });
  }

  // Fallback: Supabase Edge Function
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
 * Stream AI response.
 * Uses Azure OpenAI when configured, otherwise falls back to the Supabase Edge Function SSE stream.
 */
export async function streamAI(options: AIRouterOptions & {
  onDelta: (text: string) => void;
  onDone: () => void;
  onError?: (error: string) => void;
}) {
  if (isAzureOpenAIEnabled()) {
    await azureOpenAIStream({
      messages: buildAzureMessages(options),
      onDelta: options.onDelta,
      onDone: options.onDone,
      onError: options.onError,
    });
    return;
  }

  // Fallback: Supabase Edge Function SSE stream
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
    try {
      const fallback = await resp.json();
      if (fallback?.reply) {
        options.onDelta(fallback.reply);
        options.onDone();
        return;
      }
    } catch { /* Intentionally ignored: fallback already handled above */ }
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
