import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Send } from "lucide-react";

interface Props {
  recipientName?: string;
  context?: string;
  onSelect: (message: string) => void;
}

export default function AutoMessageSuggestions({ recipientName, context, onSelect }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(false);

  const loadSuggestions = async () => {
    if (!user) return;
    setLoading(true);
    setShown(true);
    try {
      const { data } = await supabase.functions.invoke("ai-growth-engine", {
        body: {
          action: "message_suggestions",
          user_id: user.id,
          data: { recipientName, context },
        },
      });
      if (data?.messages) setMessages(data.messages);
    } catch (e) {
      // Fallback
      setMessages([
        `Ciao${recipientName ? " " + recipientName : ""}, ti ho trovato su Stayle!`,
        "Sei disponibile per un appuntamento?",
        "Vorrei prenotare un servizio.",
        "Possiamo collaborare?",
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!shown) {
    return (
      <button onClick={loadSuggestions}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
        <Sparkles className="w-3 h-3" />
        Suggerisci messaggio
      </button>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3 h-3 text-primary" />
        <span className="text-[10px] font-bold text-primary">AI Messaggi</span>
      </div>
      {loading ? (
        <div className="text-xs text-muted-foreground">Genero suggerimenti...</div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {messages.map((msg, i) => (
            <button key={i} onClick={() => onSelect(msg)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-card border border-border/50 text-xs hover:border-primary/50 transition-colors">
              <Send className="w-2.5 h-2.5 text-muted-foreground" />
              <span className="line-clamp-1 max-w-[200px]">{msg}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
