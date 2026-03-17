import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Sparkles, Mic as MicIcon, Volume2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStellaVoiceActions } from "@/hooks/useStellaVoiceActions";
import { useVoiceSynthesis } from "@/hooks/useVoiceSynthesis";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import MobileLayout from "@/components/layout/MobileLayout";
import { toast } from "sonner";
import AIQuickActions from "@/components/ai/AIQuickActions";
import AIChatMessages from "@/components/ai/AIChatMessages";
import { AIChatProvider, useAIChat } from "@/contexts/AIChatContext";

const suggestedQuestions = [
  "Quale taglio va di moda questa stagione?",
  "Come curare i capelli ricci?",
  "Consigliami un trattamento viso",
  "Come funziona il wallet QR Coins?",
  "Come prenotare un servizio?",
  "Come andare in live?",
];

// ─────────────────────────────────────────────────────────────────────────────
// Inner component (must live inside AIChatProvider)
// ─────────────────────────────────────────────────────────────────────────────

function AIAssistantInner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, isLoading, error, sendMessage, retryLastMessage } = useAIChat();

  const [input, setInput] = useState("");
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

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading || !user) return;
    setInput("");
    await sendMessage(text);
  };

  const handleSuggestionClick = (q: string) => {
    setInput(q);
  };

  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          {/* Animated AI avatar */}
          <div className={`relative w-11 h-11 rounded-full gradient-primary flex items-center justify-center shrink-0 ${isListening ? "shadow-glow" : ""}`}>
            <Sparkles className={`w-5 h-5 text-primary-foreground ${isListening ? "animate-pulse" : ""}`} />
            {(isWakeWordListening || isListening) && (
              <span className="absolute -inset-1 rounded-full border-2 border-primary/50 animate-ping" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold tracking-tight text-gradient-primary">Stella AI</h1>
            <p className="text-[10px] text-muted-foreground truncate">
              {isListening ? "🔴 Sto ascoltando..." : isWakeWordListening ? "🎤 Dì 'Stella' per attivare" : "Assistente STYLE · Voce + AI"}
            </p>
          </div>
          {/* Voice toggle */}
          <button
            onClick={() => {
              setWakeWordEnabled(!wakeWordEnabled);
              if (!wakeWordEnabled) {
                startWakeWordListening();
                toast.success("Attivazione vocale abilitata");
              } else {
                stopWakeWordListening();
                toast.success("Attivazione vocale disabilitata");
              }
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
              wakeWordEnabled ? "bg-primary text-primary-foreground shadow-glow" : "bg-muted text-muted-foreground"
            }`}
            title={wakeWordEnabled ? "Disabilita wake word" : "Abilita wake word"}
          >
            <MicIcon className="w-4 h-4" />
          </button>
          {/* TTS toggle */}
          <button
            onClick={() => {
              setIsTTSEnabled(!isTTSEnabled);
              if (!isTTSEnabled) speak("Sintesi vocale attivata!");
              else cancelTTS();
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
              isTTSEnabled ? "bg-primary text-primary-foreground shadow-glow" : "bg-muted text-muted-foreground"
            }`}
            title={isTTSEnabled ? "Disabilita voce" : "Abilita voce"}
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* Hands-free active banner */}
        {(isWakeWordListening || isListening) && (
          <div className="mt-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shrink-0" />
            <p className="text-[11px] text-primary font-medium flex-1">
              {isListening ? "🎤 Ti sto ascoltando — parla ora!" : "🤖 Modalità Mani Libere attiva · Dì \"Stella\" per iniziare"}
            </p>
          </div>
        )}
      </header>

      <AIQuickActions onCommand={(cmd) => {
        setInput(cmd);
        setTimeout(() => {
          const btn = document.querySelector('[data-send-btn]') as HTMLButtonElement;
          btn?.click();
        }, 100);
      }} />

      <AIChatMessages
        messages={messages}
        isLoading={isLoading}
        error={error}
        suggestedQuestions={suggestedQuestions}
        onSuggestionClick={handleSuggestionClick}
        onRetry={retryLastMessage}
        messagesEndRef={messagesEndRef}
      />

      {/* Input bar — respects safe-area-inset-bottom on iOS */}
      <div
        className="sticky bottom-16 glass px-4 py-3 flex items-center gap-2"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Chiedi qualsiasi cosa a Stella..."
          className="flex-1 h-11 rounded-full bg-muted px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          disabled={isLoading}
        />
        <button
          onClick={() => {
            if (isListening) {
              stopListening();
            } else {
              if (!isTTSEnabled) setIsTTSEnabled(true);
              startListening();
            }
          }}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            isListening ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30" : "bg-muted text-foreground/70 hover:bg-muted/80"
          }`}
        >
          <MicIcon className="w-5 h-5" />
        </button>
        <button onClick={handleSend} disabled={!input.trim() || isLoading} data-send-btn
          className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center shadow-glow disabled:opacity-50 active:scale-95 transition-transform">
          <Send className="w-5 h-5 text-primary-foreground" />
        </button>
      </div>
    </MobileLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Export — wraps inner component with the global AI chat provider
// ─────────────────────────────────────────────────────────────────────────────

export default function AIAssistantPage() {
  return (
    <AIChatProvider>
      <AIAssistantInner />
    </AIChatProvider>
  );
}
