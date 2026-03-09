import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Sparkles, Bot, User, Loader2, Mic as MicIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/layout/MobileLayout";
import { toast } from "sonner";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const suggestedQuestions = [
  "Quale taglio va di moda questa stagione?",
  "Come curare i capelli ricci?",
  "Consigliami un trattamento viso",
  "Miglior colore per pelle chiara?",
  "Come mantenere la tinta più a lungo?",
  "Routine skincare serale consigliata",
];

export default function AIAssistantPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Ciao! Sono il tuo assistente beauty AI. Chiedimi qualsiasi cosa su tagli, colori, skincare, trattamenti o prodotti. Sono qui per aiutarti!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMsg = { id: Date.now().toString(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const allMessages = [...messages.filter(m => m.id !== "welcome"), userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke("ai-beauty-assistant", {
        body: { messages: allMessages },
      });

      if (error) throw error;

      const aiContent = data?.content || data?.choices?.[0]?.message?.content || "Mi dispiace, non riesco a rispondere in questo momento.";

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiContent,
      }]);
    } catch (err: any) {
      console.error("AI error:", err);
      if (err?.message?.includes("429") || err?.status === 429) {
        toast.error("Troppe richieste, riprova tra poco");
      } else {
        toast.error("Errore nella risposta AI");
      }
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Mi dispiace, c'è stato un problema. Riprova tra poco! 🙏",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestion = (q: string) => {
    setInput(q);
  };

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h1 className="text-sm font-bold">Stella - Beauty AI Assistant</h1>
          <p className="text-[10px] text-muted-foreground">
            {isWakeWordListening ? "🎤 Ascolto per 'Stella'..." : "Consigli personalizzati in tempo reale"}
          </p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 px-4 py-4 space-y-4 min-h-[60vh]">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2.5 fade-in ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === "assistant" ? "gradient-primary" : "bg-muted"
            }`}>
              {msg.role === "assistant" ? (
                <Bot className="w-4 h-4 text-primary-foreground" />
              ) : (
                <User className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === "user"
                ? "gradient-primary text-primary-foreground rounded-br-md"
                : "bg-card border border-border rounded-bl-md"
            }`}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5 fade-in">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Sto pensando...</span>
              </div>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {messages.length <= 2 && !isLoading && (
          <div className="space-y-2 pt-2">
            <p className="text-xs text-muted-foreground font-medium">💡 Prova a chiedere:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map(q => (
                <button
                  key={q}
                  onClick={() => handleSuggestion(q)}
                  className="px-3 py-1.5 rounded-full bg-card border border-border text-xs hover:border-primary/50 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice Controls */}
      <div className="sticky bottom-20 px-4 py-2 flex justify-center gap-2">
        <button
          onClick={() => {
            setWakeWordEnabled(!wakeWordEnabled);
            if (!wakeWordEnabled) {
              startWakeWordListening();
              toast.success("Attivazione vocale 'Stella' abilitata");
            } else {
              stopWakeWordListening();
              toast.success("Attivazione vocale disabilitata");
            }
          }}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            wakeWordEnabled 
              ? "bg-green-500/20 text-green-400 border border-green-500/30" 
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          🎤 Wake Word {wakeWordEnabled ? "ON" : "OFF"}
        </button>
        
        <button
          onClick={() => {
            setIsTTSEnabled(!isTTSEnabled);
            if (!isTTSEnabled) {
              speak("Sintesi vocale attivata!");
            } else {
              cancelTTS();
            }
          }}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            isTTSEnabled 
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          🔊 Audio {isTTSEnabled ? "ON" : "OFF"}
        </button>
      </div>

      {/* Input */}
      <div className="sticky bottom-16 glass px-4 py-3 flex items-center gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder={isWakeWordListening ? "Dì 'Stella' per attivare..." : "Chiedi qualcosa sulla bellezza..."}
          className="flex-1 h-11 rounded-full bg-muted px-4 text-sm focus:outline-none"
          disabled={isLoading}
        />
        
        <button
          onClick={() => {
            if (isListening) {
              stopListening();
              setIsSTTActive(false);
            } else {
              startListening();
              setIsSTTActive(true);
            }
          }}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            isListening 
              ? "bg-red-500 text-white animate-pulse" 
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          <MicIcon className="w-5 h-5" />
        </button>

        <button
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center shadow-glow disabled:opacity-50"
        >
          <Send className="w-5 h-5 text-primary-foreground" />
        </button>
      </div>
    </MobileLayout>
  );
}
