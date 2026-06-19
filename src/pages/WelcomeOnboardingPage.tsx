import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import safeStorage from "@/lib/safeStorage";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Mic, Globe2, ArrowRight, Check, Loader2, Volume2, MessageCircle,
} from "lucide-react";

const STORAGE_KEY = "stayle_welcome_completed";

type Step = 1 | 2 | 3 | 4 | 5;

export default function WelcomeOnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);

  // Step 2 - Register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Step 3 - Stella demo
  const [stellaHeard, setStellaHeard] = useState("");
  const [stellaListening, setStellaListening] = useState(false);
  const recRef = useRef<any>(null);

  // Step 4 - Voice translation demo
  const [targetLang, setTargetLang] = useState("en");
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [translated, setTranslated] = useState("");
  const [translating, setTranslating] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Skip if already done
  useEffect(() => {
    if (safeStorage.getItem(STORAGE_KEY) === "1") navigate("/", { replace: true });
  }, [navigate]);

  // Skip auth step if already logged
  useEffect(() => {
    if (user && step === 2) setStep(3);
  }, [user, step]);

  const finish = () => {
    safeStorage.setItem(STORAGE_KEY, "1");
    toast.success("Benvenutə! Buon viaggio su Stayle ✨");
    navigate("/", { replace: true });
  };

  const signUp = async () => {
    if (!email || !password || password.length < 6) {
      toast.error("Email valida e password (min 6 caratteri)");
      return;
    }
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: displayName || email.split("@")[0], user_type: "client" },
        },
      });
      if (error) throw error;
      toast.success("Account creato!");
      setStep(3);
    } catch (e: any) {
      toast.error(e.message || "Errore registrazione");
    } finally {
      setAuthLoading(false);
    }
  };

  const startStellaDemo = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Riconoscimento vocale non disponibile su questo browser");
      return;
    }
    const r = new SR();
    r.lang = "it-IT";
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e: any) => {
      const text = Array.from(e.results).map((res: any) => res[0].transcript).join(" ").trim();
      setStellaHeard(text);
      if (e.results[e.results.length - 1].isFinal) {
        setStellaListening(false);
        setTimeout(() => setStep(4), 1200);
      }
    };
    r.onerror = () => setStellaListening(false);
    r.onend = () => setStellaListening(false);
    r.start();
    recRef.current = r;
    setStellaListening(true);
    setStellaHeard("");
  };

  const startVoiceTranslate = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t)) || "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        if (blob.size < 1024) { toast.error("Registrazione troppo breve"); return; }
        setTranslating(true);
        try {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => resolve((reader.result as string).split(",")[1] || "");
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          const { data, error } = await supabase.functions.invoke("voice-transcribe", {
            body: { audioBase64: base64, mimeType: mime, targetLanguage: targetLang },
          });
          if (error) throw error;
          setTranscript(data?.transcript || "");
          setTranslated(data?.translated || "");
        } catch {
          toast.error("Errore traduzione");
        } finally {
          setTranslating(false);
        }
      };
      rec.start();
      mediaRef.current = rec;
      setRecording(true);
      setTimeout(() => { if (mediaRef.current?.state === "recording") mediaRef.current.stop(); setRecording(false); }, 5000);
    } catch {
      toast.error("Microfono non disponibile");
    }
  };

  const stopVoiceTranslate = () => {
    if (mediaRef.current?.state === "recording") mediaRef.current.stop();
    setRecording(false);
  };

  const totalSteps = 5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-purple-950/30 to-background flex flex-col items-center px-5 py-8">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs text-muted-foreground">Step {step} di {totalSteps}</span>
          <button type="button" aria-label="Salta onboarding" onClick={finish} className="text-xs text-muted-foreground hover:text-foreground">
            Salta
          </button>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden mb-8">
          <div className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all" style={{ width: `${(step / totalSteps) * 100}%` }} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>

            {step === 1 && (
              <div className="text-center space-y-6">
                <div className="mx-auto w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-purple-500/40">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">Benvenutə in Stayle</h1>
                  <p className="text-muted-foreground">In 2 minuti completi la registrazione, conosci Stella AI e provi la chat vocale tradotta.</p>
                </div>
                <button type="button" aria-label="Inizia onboarding" onClick={() => setStep(user ? 3 : 2)} className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white font-semibold flex items-center justify-center gap-2">
                  Inizia <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Crea il tuo account</h2>
                <p className="text-sm text-muted-foreground">Bastano email e password.</p>
                <input type="text" placeholder="Nome" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full h-12 rounded-xl bg-muted/50 border border-border px-4 text-sm" />
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 rounded-xl bg-muted/50 border border-border px-4 text-sm" />
                <input type="password" placeholder="Password (min 6)" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 rounded-xl bg-muted/50 border border-border px-4 text-sm" />
                <button type="button" aria-label="Registrati" onClick={signUp} disabled={authLoading}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                  {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Registrati <ArrowRight className="w-4 h-4" /></>}
                </button>
                <button type="button" aria-label="Ho già un account" onClick={() => navigate("/auth")} className="w-full text-xs text-muted-foreground">
                  Ho già un account
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5 text-center">
                <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center shadow-xl">
                  <Mic className={`w-9 h-9 text-white ${stellaListening ? "animate-pulse" : ""}`} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">Conosci Stella ✨</h2>
                  <p className="text-sm text-muted-foreground">Premi e dì: <span className="text-foreground font-semibold">"Ciao Stella"</span> o un comando come "vai alla home".</p>
                </div>
                {stellaHeard && (
                  <div className="rounded-xl bg-purple-500/10 border border-purple-500/30 p-3 text-sm text-left">
                    <span className="text-xs text-purple-400 block mb-1">Stella ha sentito:</span>
                    <span>"{stellaHeard}"</span>
                  </div>
                )}
                <button type="button" aria-label="Parla con Stella" onClick={startStellaDemo} disabled={stellaListening}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                  {stellaListening ? <><Loader2 className="w-4 h-4 animate-spin" /> Sto ascoltando...</> : <><Mic className="w-4 h-4" /> Parla con Stella</>}
                </button>
                <button type="button" aria-label="Continua" onClick={() => setStep(4)} className="w-full text-xs text-muted-foreground">
                  Continua →
                </button>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <Globe2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Chat vocale tradotta</h2>
                    <p className="text-xs text-muted-foreground">Parla per 5 secondi, traduciamo in tempo reale.</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-2">Traduci in:</label>
                  <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}
                    className="w-full h-11 rounded-xl bg-muted/50 border border-border px-4 text-sm">
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="pt">Português</option>
                    <option value="ar">العربية</option>
                    <option value="zh">中文</option>
                    <option value="it">Italiano</option>
                  </select>
                </div>

                <button type="button"
                  aria-label={recording ? "Ferma registrazione" : "Avvia registrazione"}
                  onClick={recording ? stopVoiceTranslate : startVoiceTranslate}
                  disabled={translating}
                  className={`w-full h-14 rounded-2xl font-semibold flex items-center justify-center gap-2 text-white ${recording ? "bg-red-500 animate-pulse" : "bg-gradient-to-r from-cyan-500 to-blue-600"} disabled:opacity-60`}>
                  {translating ? <><Loader2 className="w-5 h-5 animate-spin" /> Traduzione...</> : recording ? <><Volume2 className="w-5 h-5" /> Sto registrando... (max 5s)</> : <><Mic className="w-5 h-5" /> Registra messaggio vocale</>}
                </button>

                {transcript && (
                  <div className="rounded-xl bg-muted/40 border border-border p-3 space-y-2 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground block">Hai detto:</span>
                      <span>{transcript}</span>
                    </div>
                    {translated && translated !== transcript && (
                      <div className="pt-2 border-t border-border/50">
                        <span className="text-xs text-cyan-400 block">Traduzione ({targetLang.toUpperCase()}):</span>
                        <span className="font-medium">{translated}</span>
                      </div>
                    )}
                  </div>
                )}

                <button type="button" aria-label="Continua" onClick={() => setStep(5)}
                  className="w-full h-12 rounded-2xl bg-foreground/10 text-foreground font-semibold flex items-center justify-center gap-2">
                  Continua <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {step === 5 && (
              <div className="text-center space-y-6">
                <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                  <Check className="w-12 h-12 text-white" strokeWidth={3} />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-2">Tutto pronto! 🎉</h2>
                  <p className="text-muted-foreground text-sm">Ora puoi esplorare il feed, prenotare servizi, chattare e usare Stella in qualsiasi schermata.</p>
                </div>
                <div className="grid grid-cols-1 gap-2 text-left">
                  <div className="rounded-xl bg-muted/40 border border-border p-3 flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-purple-400" />
                    <span className="text-sm">Stella sempre attiva: di' "Stella" + un comando</span>
                  </div>
                  <div className="rounded-xl bg-muted/40 border border-border p-3 flex items-center gap-3">
                    <Globe2 className="w-5 h-5 text-cyan-400" />
                    <span className="text-sm">Traduzione live in chat, vocali, chiamate</span>
                  </div>
                </div>
                <button type="button" aria-label="Entra nell'app" onClick={finish}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white font-semibold flex items-center justify-center gap-2">
                  Entra nell'app <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}