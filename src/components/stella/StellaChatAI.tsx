/**
 * StellaChatAI.tsx — Beauty Style Pro v2.0.0
 * Chat con Stella AI potenziata da GPT-4o e RAG Memory.
 * Estende la chat esistente aggiungendo streaming e contesto personale.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { Send, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useStellaMemory } from "@/hooks/useStellaMemory";
import { stellaChatStream } from "@/services/stellaAI";
import { buildStellaSystemPrompt, buildRAGContext } from "./StellaMemory";

interface ChatMessage {
  id: string;
  role: "user" | "stella";
  content: string;
  streaming?: boolean;
}

const WELCOME_MSG: ChatMessage = {
  id: "welcome",
  role: "stella",
  content:
    "Ciao! Sono Stella AI v2 ✨ Sono aggiornata con GPT-4o e ricordo le tue preferenze beauty. Come posso aiutarti oggi?",
};

export default function StellaChatAI() {
  const { user, profile } = useAuth();
  const { query: queryMemory, save: saveMemory } = useStellaMemory();

  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const updateLastMessage = useCallback((delta: string) => {
    setMessages(prev => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last?.role === "stella") {
        copy[copy.length - 1] = { ...last, content: last.content + delta, streaming: true };
      }
      return copy;
    });
  }, []);

  const finalizeLastMessage = useCallback(() => {
    setMessages(prev => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last) copy[copy.length - 1] = { ...last, streaming: false };
      return copy;
    });
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    if (!user?.id) {
      toast.error("Accedi per usare Stella AI v2");
      return;
    }

    setInput("");
    setIsLoading(true);
    addMessage({ id: Date.now().toString(), role: "user", content: text });

    // Aggiungi placeholder risposta Stella
    const stellaId = (Date.now() + 1).toString();
    addMessage({ id: stellaId, role: "stella", content: "", streaming: true });

    try {
      // RAG Memory
      const memories = await queryMemory(text);
      const ragContext = buildRAGContext(memories);
      const systemPrompt = buildStellaSystemPrompt(
        profile?.display_name ?? "utente",
        ragContext,
      );

      abortRef.current = new AbortController();
      let fullReply = "";

      await stellaChatStream(
        {
          userId: user.id,
          userName: profile?.display_name ?? "utente",
          message: text,
          context: { memories, relevanceScore: 1 },
        },
        (chunk) => {
          fullReply += chunk.delta;
          updateLastMessage(chunk.delta);
        },
        abortRef.current.signal,
      );

      finalizeLastMessage();

      // Salva in memoria
      if (fullReply) {
        saveMemory(`Utente: ${text}\nStella: ${fullReply}`);
      }

      void systemPrompt; // usato via stellaChatStream server-side
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        finalizeLastMessage();
        return;
      }
      finalizeLastMessage();
      toast.error("Stella AI non disponibile. Controlla la connessione.");
    } finally {
      setIsLoading(false);
    }
  }, [
    input, isLoading, user?.id, profile?.display_name,
    addMessage, updateLastMessage, finalizeLastMessage,
    queryMemory, saveMemory,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage],
  );

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([WELCOME_MSG]);
    setIsLoading(false);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-gradient-to-r from-purple-900/20 to-pink-900/10">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold">Stella AI v2</h2>
          <p className="text-[10px] text-muted-foreground">GPT-4o · Memoria RAG · Streaming</p>
        </div>
        <button
          type="button"
          aria-label="Nuova chat"
          onClick={clearChat}
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messaggi */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "stella" && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-purple-600 text-white rounded-br-sm"
                    : "bg-card border border-border text-foreground rounded-bl-sm"
                }`}
              >
                {msg.content}
                {msg.streaming && (
                  <span className="inline-block w-1 h-3.5 bg-purple-400 animate-pulse ml-0.5 align-middle" />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scrivi a Stella..."
            rows={1}
            className="flex-1 resize-none rounded-2xl bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500 max-h-32 overflow-y-auto"
          />
          <button
            type="button"
            aria-label="Invia messaggio"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white disabled:opacity-40 transition-opacity shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
