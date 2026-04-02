/**
 * StellaMemory.ts — Beauty Style Pro v2.0.0
 * Gestione della memoria vettoriale di Stella (Pinecone).
 * Layer di astrazione sopra stellaAI.ts per accesso strutturato ai ricordi.
 */

import { queryMemory, saveMemory } from "@/services/stellaAI";

export interface MemoryEntry {
  text: string;
  category: "style" | "booking" | "product" | "professional" | "preference" | "general";
  timestamp: number;
}

export interface UserBeautyProfile {
  preferredStyles: string[];
  favoriteProducts: string[];
  trustedProfessionals: string[];
  frequentedSalons: string[];
  hairType?: string;
  skinType?: string;
  lastBookingDate?: string;
}

/**
 * Salva un ricordo beauty nella memoria di Stella.
 */
export async function rememberBeauty(
  userId: string,
  entry: MemoryEntry,
): Promise<void> {
  const text = `[${entry.category}] ${entry.text}`;
  await saveMemory(userId, text, {
    category: entry.category,
    timestamp: entry.timestamp,
  });
}

/**
 * Recupera contesto RAG per la categoria specificata.
 */
export async function recallBeautyContext(
  userId: string,
  query: string,
  topK = 8,
): Promise<string[]> {
  return queryMemory(userId, query, topK);
}

/**
 * Costruisce un sistema di contesto per GPT-4o da un array di memorie.
 */
export function buildRAGContext(memories: string[]): string {
  if (memories.length === 0) return "";
  return memories.map((m, i) => `${i + 1}. ${m}`).join("\n");
}

/**
 * Crea il system prompt personalizzato di Stella con contesto RAG.
 */
export function buildStellaSystemPrompt(
  userName: string,
  ragContext: string,
): string {
  const contextSection = ragContext
    ? `\nConosci l'utente e ricordi queste informazioni su di loro:\n${ragContext}\n`
    : "";

  return `Sei Stella, l'assistente AI personale di Beauty Style Pro.
Sei esperta di beauty, moda, capelli, skincare e benessere.
Conosci l'utente ${userName} e ricordi le sue preferenze.${contextSection}
Parli in italiano, con tono caldo e professionale come una stylist di fiducia.
Puoi prenotare appuntamenti, consigliare look, cercare professionisti vicini,
tradurre messaggi, inviare la posizione, gestire lo shop.
Rispondi sempre in modo conciso e utile. Massimo 2-3 frasi per risposta.`;
}
