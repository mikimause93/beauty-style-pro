import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Send, Loader2, X, RefreshCw, AlertCircle } from "lucide-react";

interface Props {
  recipientName?: string;
  context?: string;
  onSelect: (message: string) => void;
}

const MAX_SUGGESTIONS = 4;
const COOLDOWN_MS = 3000;

export default function AutoMessageSuggestions({ recipientName, context, onSelect }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCall, setLastCall] = useState<number>(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const loadSuggestions = async () => {
    if (!user) return;

    // Rate limiting
    const now = Date.now();
    if (now - lastCall < COOLDOWN_MS) return;
    setLastCall(now);

    setLoading(true);
    setShown(true);
    setError(null);

    try {
      const { data, error: apiError } = await supabase.functions.invoke("ai-growth-engine", {
        body: {
          action: "message_suggestions",
          user_id: user.id,
          data: { recipientName, context },
        },
      });

      if (apiError) throw apiError;

      if (data?.messages && Array.isArray(data.messages)) {
        setMessages(data.messages.slice(0, MAX_SUGGESTIONS));
      } else {
        throw new Error("Invalid response format");
      }
    } catch (e) {
      console.error("AI suggestions error:", e);
      setError("Impossibile generare suggerimenti");

      // Fallback
      setMessages([
        `Ciao${recipientName ? " " + recipientName : ""}, ti ho trovato su Style!`,
        "Sei disponibile per un appuntamento?",
        "Vorrei prenotare un servizio.",
        "Possiamo collaborare?",
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (msg: string, index: number) => {
    setSelectedIndex(index);
    onSelect(msg);
    setTimeout(() => setSelectedIndex(null), 300);
  };

  const handleReset = () => {
    setShown(false);
    setMessages([]);
    setError(null);
  };

  if (!shown) {
    return (
      <button
        type="button"
        onClick={loadSuggestions}
        disabled={loading}
        aria-label="Genera suggerimenti con AI"
        aria-busy={loading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium transition-all ${
          loading ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/20 active:scale-95"
        }`}
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Sparkles className="w-3 h-3" />
        )}
        {loading ? "Generando..." : "Suggerisci messaggio"}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary">AI Messaggi</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={loadSuggestions}
            disabled={loading}
            className="p-1 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
            aria-label="Ricarica suggerimenti"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Chiudi suggerimenti"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-muted/50 rounded-full animate-pulse" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nessun suggerimento disponibile</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {messages.map((msg, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(msg, i)}
              aria-label={`Invia: ${msg}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all ${
                selectedIndex === i
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-card border-border/50 hover:border-primary/50 active:scale-95"
              }`}
            >
              <Send className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />
              <span className="line-clamp-1 max-w-[200px]">{msg}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
