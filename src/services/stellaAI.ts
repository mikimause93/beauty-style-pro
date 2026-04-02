/**
 * stellaAI.ts — Beauty Style Pro v2.0.0
 * Client per il microservizio FastAPI Stella AI (GPT-4o + RAG Pinecone).
 * Endpoint base configurabile via VITE_STELLA_AI_URL.
 */

const AI_URL = import.meta.env.VITE_STELLA_AI_URL ?? "http://localhost:8001";

export interface StellaRAGContext {
  memories: string[];
  relevanceScore: number;
}

export interface StellaAIRequest {
  userId: string;
  userName: string;
  message: string;
  context?: StellaRAGContext;
  sessionId?: string;
}

export interface StellaAIResponse {
  reply: string;
  intent: string;
  action?: {
    type: string;
    payload: Record<string, unknown>;
  };
  sessionId: string;
}

export interface StellaStreamChunk {
  delta: string;
  done: boolean;
  intent?: string;
  action?: StellaAIResponse["action"];
}

/**
 * Invia un messaggio a Stella AI e riceve la risposta completa.
 */
export async function stellaChat(req: StellaAIRequest): Promise<StellaAIResponse> {
  const res = await fetch(`${AI_URL}/v2/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    throw new Error(`Stella AI error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<StellaAIResponse>;
}

/**
 * Invia un messaggio a Stella AI con risposta in streaming (SSE).
 * Chiama onChunk per ogni frammento ricevuto.
 */
export async function stellaChatStream(
  req: StellaAIRequest,
  onChunk: (chunk: StellaStreamChunk) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${AI_URL}/v2/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal,
  });
  if (!res.ok) {
    throw new Error(`Stella AI stream error: ${res.status} ${res.statusText}`);
  }
  const reader = res.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const chunk = JSON.parse(line.slice(6)) as StellaStreamChunk;
          onChunk(chunk);
        } catch {
          // skip malformed line
        }
      }
    }
  }
}

/**
 * Salva un'interazione nella memoria vettoriale di Stella (Pinecone).
 */
export async function saveMemory(
  userId: string,
  text: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await fetch(`${AI_URL}/v2/memory`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, text, metadata }),
  });
}

/**
 * Recupera le memorie più rilevanti per un dato contesto.
 */
export async function queryMemory(
  userId: string,
  query: string,
  topK = 8,
): Promise<string[]> {
  const res = await fetch(`${AI_URL}/v2/memory/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, query, topK }),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { memories: string[] };
  return data.memories ?? [];
}
