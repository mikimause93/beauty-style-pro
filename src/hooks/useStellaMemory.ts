/**
 * useStellaMemory.ts — Beauty Style Pro v2.0.0
 * Hook per accedere alla memoria RAG di Stella (Pinecone via AI service).
 * Fornisce save/query con gestione loading ed errori.
 */

import { useState, useCallback } from "react";
import { queryMemory, saveMemory } from "@/services/stellaAI";
import { useAuth } from "@/hooks/useAuth";

export interface UseStellaMemoryReturn {
  memories: string[];
  isLoading: boolean;
  error: string | null;
  query: (text: string, topK?: number) => Promise<string[]>;
  save: (text: string, metadata?: Record<string, unknown>) => Promise<void>;
}

export function useStellaMemory(): UseStellaMemoryReturn {
  const { user } = useAuth();
  const [memories, setMemories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useCallback(
    async (text: string, topK = 8): Promise<string[]> => {
      if (!user?.id) return [];
      setIsLoading(true);
      setError(null);
      try {
        const result = await queryMemory(user.id, text, topK);
        setMemories(result);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Errore memoria Stella";
        setError(msg);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id],
  );

  const save = useCallback(
    async (text: string, metadata?: Record<string, unknown>): Promise<void> => {
      if (!user?.id) return;
      try {
        await saveMemory(user.id, text, metadata);
      } catch {
        // silently ignore — memory save is best-effort
      }
    },
    [user?.id],
  );

  return { memories, isLoading, error, query, save };
}
