/**
 * StellaVoiceV2.tsx — Beauty Style Pro v2.0.0
 * Upgrade del componente vocale Stella: pipeline GPT-4o + Whisper STT + ElevenLabs TTS.
 * Mantiene compatibilità con StellaVoiceAgent v1 e aggiunge la pipeline v2.
 */

import { useState, useCallback, useRef } from "react";
import { Mic, MicOff, Loader2, Volume2, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useStellaMemory } from "@/hooks/useStellaMemory";
import { transcribeAudio } from "@/services/stellaVoice";
import { stellaChat } from "@/services/stellaAI";
import { buildStellaSystemPrompt, buildRAGContext } from "./StellaMemory";
import { speakWithElevenLabs } from "@/services/stellaVoice";

type Phase = "idle" | "recording" | "transcribing" | "thinking" | "speaking";

interface Message {
  id: string;
  role: "user" | "stella";
  content: string;
}

export default function StellaVoiceV2() {
  const { user, profile } = useAuth();
  const { query: queryMemory, save: saveMemory } = useStellaMemory();

  const [phase, setPhase] = useState<Phase>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const addMessage = useCallback((role: "user" | "stella", content: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), role, content }]);
  }, []);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
  }, []);

  const startRecording = useCallback(async () => {
    if (!user?.id) {
      toast.error("Accedi per usare Stella v2");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });

        // STT con Whisper
        setPhase("transcribing");
        let transcript = "";
        try {
          transcript = await transcribeAudio(blob, { language: "it" });
        } catch {
          toast.error("Errore trascrizione audio");
          setPhase("idle");
          return;
        }
        if (!transcript.trim()) {
          setPhase("idle");
          return;
        }
        addMessage("user", transcript);

        // RAG Memory
        setPhase("thinking");
        const memories = await queryMemory(transcript);
        const ragContext = buildRAGContext(memories);
        const systemPrompt = buildStellaSystemPrompt(
          profile?.display_name ?? "utente",
          ragContext,
        );

        // GPT-4o
        let reply = "";
        try {
          const res = await stellaChat({
            userId: user.id,
            userName: profile?.display_name ?? "utente",
            message: transcript,
            context: { memories, relevanceScore: 1 },
          });
          reply = res.reply;
        } catch {
          // fallback a risposta di errore
          reply = "Mi dispiace, non riesco a rispondere in questo momento.";
        }

        // Salva memoria
        saveMemory(`Utente: ${transcript}\nStella: ${reply}`);

        addMessage("stella", reply);

        // ElevenLabs TTS
        setPhase("speaking");
        try {
          const audio = await speakWithElevenLabs(reply);
          audioRef.current = audio;
          audio.onended = () => setPhase("idle");
        } catch {
          // fallback Web Speech TTS
          const utt = new SpeechSynthesisUtterance(reply);
          utt.lang = "it-IT";
          utt.onend = () => setPhase("idle");
          window.speechSynthesis.speak(utt);
        }

        void systemPrompt; // usato implicitamente via stellaChat server-side
      };

      recorder.start();
      setPhase("recording");
    } catch {
      toast.error("Impossibile accedere al microfono");
      setPhase("idle");
    }
  }, [user?.id, profile?.display_name, addMessage, queryMemory, saveMemory]);

  const handleMicToggle = useCallback(() => {
    if (phase === "recording") {
      stopRecording();
    } else if (phase === "idle") {
      startRecording();
    }
  }, [phase, startRecording, stopRecording]);

  const stopSpeaking = useCallback(() => {
    audioRef.current?.pause();
    window.speechSynthesis.cancel();
    setPhase("idle");
  }, []);

  const phaseLabel: Record<Phase, string> = {
    idle: 'Dì "Stella"...',
    recording: "Ti ascolto...",
    transcribing: "Trascrivo...",
    thinking: "Sto pensando...",
    speaking: "Sto parlando...",
  };

  return (
    <div className="fixed bottom-24 right-4 z-[110]">
      {/* FAB Stella v2 */}
      <motion.button
        type="button"
        aria-label="Apri Stella v2"
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(o => !o)}
        className="relative w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/40"
      >
        <Sparkles className="w-6 h-6 text-white" />
        {phase !== "idle" && (
          <span className="absolute -inset-1 rounded-full border-2 border-purple-400/60 animate-ping" />
        )}
        {/* Badge v2 */}
        <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[9px] font-bold rounded-full px-1 leading-4">
          v2
        </span>
      </motion.button>

      {/* Pannello Stella v2 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-16 right-0 w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-3 border-b border-border bg-gradient-to-r from-purple-900/30 to-pink-900/20">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">Stella AI v2</p>
                <p className="text-[10px] text-muted-foreground">{phaseLabel[phase]}</p>
              </div>
              <button
                type="button"
                aria-label="Chiudi"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Messaggi */}
            <div className="h-48 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Premi il microfono e parla con Stella!<br />
                  <span className="opacity-60">Powered by GPT-4o + ElevenLabs</span>
                </p>
              )}
              {messages.map(m => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                      m.role === "user"
                        ? "bg-purple-600 text-white rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Controlli */}
            <div className="p-3 border-t border-border flex items-center justify-center gap-4">
              <motion.button
                type="button"
                aria-label={phase === "recording" ? "Ferma registrazione" : "Inizia a parlare"}
                whileTap={{ scale: 0.9 }}
                onClick={handleMicToggle}
                disabled={phase === "transcribing" || phase === "thinking"}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  phase === "recording"
                    ? "bg-red-500 text-white animate-pulse"
                    : phase === "transcribing" || phase === "thinking"
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-purple-600 text-white"
                }`}
              >
                {phase === "transcribing" || phase === "thinking" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : phase === "recording" ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </motion.button>

              {phase === "speaking" && (
                <button
                  type="button"
                  aria-label="Interrompi voce"
                  onClick={stopSpeaking}
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
                >
                  <Volume2 className="w-4 h-4 text-pink-400" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
