import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Sparkles, Bot, User, Loader2, Mic as MicIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStellaVoiceActions } from "@/hooks/useStellaVoiceActions";
import { useVoiceSynthesis } from "@/hooks/useVoiceSynthesis";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import MobileLayout from "@/components/layout/MobileLayout";
import { toast } from "sonner";
import { streamChat } from "@/lib/streamChat";
import AIQuickActions from "@/components/ai/AIQuickActions";
import AIChatMessages from "@/components/ai/AIChatMessages";
import AIVoiceControls from "@/components/ai/AIVoiceControls";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const suggestedQuestions = [
  "Quale taglio va di moda questa stagione?",
  "Come curare i capelli ricci?",
  "Consigliami un trattamento viso",
  "Come funziona il wallet QR Coins?",
  "Come prenotare un servizio?",
  "Come andare in live?",
];

export default function AIAssistantPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Ciao${profile?.display_name ? ` ${profile.display_name}` : ""}! 👋 Sono Stella AI, il tuo assistente STYLE. Chiedimi consigli beauty, come usare l'app, prenotare servizi o qualsiasi altra cosa!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [isTTSEnabled, setIsTTSEnabled] = useState(false);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  
  const { speak, cancel: cancelTTS } = useVoiceSynthesis();
  const { processVoiceCommand } = useStellaVoiceActions();
  
  const {
    isListening, transcript, startListening, stopListening, resetTranscript,
    isWakeWordListening, startWakeWordListening, stopWakeWordListening
  } = useVoiceRecognition({
    continuous: false, interimResults: true, language: 'it-IT',
    wakeWordEnabled,
    wakeWords: ['stella', 'hey stella', 'ehi stella', 'ciao stella'],
    onWakeWordDetected: () => { if (isTTSEnabled) speak("Ciao! Come posso aiutarti?"); }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (transcript && !isListening) {
      // Try voice command first
      const { matched, response } = processVoiceCommand(transcript);
      if (matched) {
        if (isTTSEnabled) speak(response);
        toast.success(response);
        resetTranscript();
        return;
      }
      setInput(transcript);
      resetTranscript();
    }
  }, [transcript, isListening, resetTranscript, processVoiceCommand, isTTSEnabled, speak]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading || !user) return;

    const userMsg: ChatMsg = { id: Date.now().toString(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const history = [...messages.filter(m => m.id !== "welcome"), userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    let assistantSoFar = "";

    const upsertAssistant = (nextChunk: string) => {
      assistantSoFar += nextChunk;
      const currentContent = assistantSoFar;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.id === "streaming") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: currentContent } : m);
        }
        return [...prev, { id: "streaming", role: "assistant" as const, content: currentContent }];
      });
    };

    try {
      await streamChat({
        userId: user.id,
        messages: history as any,
        onDelta: (chunk) => upsertAssistant(chunk),
        onDone: () => {
          // Finalize the streaming message with a stable ID
          setMessages(prev => prev.map(m => 
            m.id === "streaming" ? { ...m, id: (Date.now() + 1).toString() } : m
          ));
          setIsLoading(false);
          if (isTTSEnabled && assistantSoFar) speak(assistantSoFar);
        },
        onError: (error) => {
          toast.error(error);
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Mi dispiace, c'è stato un problema. Riprova tra poco! 🙏",
          }]);
          setIsLoading(false);
        },
      });
    } catch (err: any) {
      console.error("AI stream error:", err);
      toast.error("Errore nella risposta AI");
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Mi dispiace, c'è stato un problema. Riprova tra poco! 🙏",
      }]);
      setIsLoading(false);
    }
  }, [input, isLoading, user, messages, isTTSEnabled, speak]);

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
          <h1 className="text-sm font-bold">Stella AI</h1>
          <p className="text-[10px] text-muted-foreground">
            {isWakeWordListening ? "🎤 Ascolto per 'Stella'..." : "Assistente STYLE con streaming AI"}
          </p>
        </div>
      </header>

      <AIQuickActions onCommand={(cmd) => {
        setInput(cmd);
        // Auto-send slash commands
        setTimeout(() => {
          const btn = document.querySelector('[data-send-btn]') as HTMLButtonElement;
          btn?.click();
        }, 100);
      }} />

      <AIChatMessages
        messages={messages}
        isLoading={isLoading}
        suggestedQuestions={suggestedQuestions}
        onSuggestionClick={setInput}
        messagesEndRef={messagesEndRef}
      />

      <AIVoiceControls
        wakeWordEnabled={wakeWordEnabled}
        isTTSEnabled={isTTSEnabled}
        onToggleWakeWord={() => {
          setWakeWordEnabled(!wakeWordEnabled);
          if (!wakeWordEnabled) { startWakeWordListening(); toast.success("Attivazione vocale abilitata"); }
          else { stopWakeWordListening(); toast.success("Attivazione vocale disabilitata"); }
        }}
        onToggleTTS={() => {
          setIsTTSEnabled(!isTTSEnabled);
          if (!isTTSEnabled) speak("Sintesi vocale attivata!");
          else cancelTTS();
        }}
      />

      {/* Input */}
      <div className="sticky bottom-16 glass px-4 py-3 flex items-center gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Chiedi qualsiasi cosa..."
          className="flex-1 h-11 rounded-full bg-muted px-4 text-sm focus:outline-none"
          disabled={isLoading}
        />
        <button
          onClick={() => { if (isListening) stopListening(); else startListening(); }}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            isListening ? "bg-red-500 text-white animate-pulse" : "bg-primary text-primary-foreground"
          }`}
        >
          <MicIcon className="w-5 h-5" />
        </button>
        <button onClick={sendMessage} disabled={!input.trim() || isLoading} data-send-btn
          className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center shadow-glow disabled:opacity-50">
          <Send className="w-5 h-5 text-primary-foreground" />
        </button>
      </div>
    </MobileLayout>
  );
}
