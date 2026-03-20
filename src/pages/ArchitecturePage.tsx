import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Copy, Check, Lock, Brain, Mic, MapPin, Phone,
  Bell, User, Shield, AlertTriangle, CheckCircle, ChevronDown,
  ChevronUp, Zap, Layers, Server, Database, Smartphone, Globe
} from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */

const SERVICES = [
  {
    icon: Lock,
    emoji: "🔐",
    title: "Auth Service",
    stack: "NestJS · PostgreSQL · Redis",
    color: "from-violet-600 to-purple-700",
    border: "border-violet-500/30",
    glow: "shadow-violet-500/20",
    features: [
      "JWT RS256, OAuth 2.0, biometrico, 2FA",
      "Sessioni multi-device con revoca remota",
      "OTP SMS via Twilio",
      "Rate limiting + audit log completo",
    ],
  },
  {
    icon: Brain,
    emoji: "🧠",
    title: "AI Service",
    stack: "FastAPI · GPT-4o · Pinecone",
    color: "from-blue-600 to-cyan-600",
    border: "border-blue-500/30",
    glow: "shadow-blue-500/20",
    features: [
      "RAG memory con Pinecone vector DB",
      "Intent classifier (15+ comandi)",
      "Streaming SSE response",
      "Profilo utente semantico continuo",
    ],
  },
  {
    icon: Mic,
    emoji: "🎙",
    title: "Voice Service",
    stack: "Porcupine · Whisper · ElevenLabs",
    color: "from-emerald-600 to-teal-600",
    border: "border-emerald-500/30",
    glow: "shadow-emerald-500/20",
    features: [
      "Wake word on-device (Porcupine ML)",
      "Whisper STT — cloud post-wake",
      "ElevenLabs TTS voce naturale",
      "Command pipeline con AI routing",
    ],
  },
  {
    icon: MapPin,
    emoji: "📍",
    title: "Location Service",
    stack: "PostGIS · Supabase RT · Redis",
    color: "from-orange-500 to-amber-500",
    border: "border-orange-500/30",
    glow: "shadow-orange-500/20",
    features: [
      "Live tracking (1s / 5s / 30s / manual)",
      "Geofencing personalizzato",
      "Sharing con scadenza temporale",
      "3 livelli privacy: EXACT / AREA / CITY",
    ],
  },
  {
    icon: Phone,
    emoji: "📞",
    title: "Call Service",
    stack: "LiveKit · STUN/TURN · WebRTC",
    color: "from-rose-500 to-pink-600",
    border: "border-rose-500/30",
    glow: "shadow-rose-500/20",
    features: [
      "Chiamate P2P con fallback TURN",
      "Videochiamate gruppo (max 8)",
      "Qualità adattiva 8kbps → 2Mbps",
      "Registrazione con consenso bilaterale",
    ],
  },
  {
    icon: Bell,
    emoji: "🔔",
    title: "Notification Service",
    stack: "FCM · APNs · AI Rules",
    color: "from-yellow-500 to-orange-500",
    border: "border-yellow-500/30",
    glow: "shadow-yellow-500/20",
    features: [
      "Push intelligente contestuale",
      "SOS priority bypass DND",
      "AI Rules Engine trigger/action",
      "Geofence-driven automazioni",
    ],
  },
  {
    icon: User,
    emoji: "👤",
    title: "User Profile Service",
    stack: "Python · PostgreSQL · Pinecone · Redis",
    color: "from-indigo-500 to-violet-600",
    border: "border-indigo-500/30",
    glow: "shadow-indigo-500/20",
    features: [
      "Apprendimento abitudini orarie",
      "Grafo relazioni con peso",
      "Luoghi frequenti via PostGIS clustering",
      "Tutto opt-in e cancellabile GDPR",
    ],
  },
];

const COMPLIANCE = [
  {
    level: "critical",
    icon: AlertTriangle,
    iconColor: "text-red-400",
    bg: "bg-red-500/10 border-red-500/30",
    badge: "bg-red-500/20 text-red-400",
    badgeLabel: "⛔ Critico — Prima del lancio",
    title: "DPIA Obbligatoria",
    body:
      "Data Protection Impact Assessment richiesta per: localizzazione continua, profilazione AI, registrazione audio. Senza DPIA il servizio non può essere lanciato in EU.",
  },
  {
    level: "critical",
    icon: AlertTriangle,
    iconColor: "text-red-400",
    bg: "bg-red-500/10 border-red-500/30",
    badge: "bg-red-500/20 text-red-400",
    badgeLabel: "⛔ Critico — Registrazione chiamate",
    title: "Consenso Bilaterale",
    body:
      "In Italia art. 617 c.p.: registrare chiamata senza consenso è reato penale. Notifica audio automatica + conferma entrambe le parti obbligatoria in ogni caso.",
  },
  {
    level: "warning",
    icon: Shield,
    iconColor: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/30",
    badge: "bg-yellow-500/20 text-yellow-400",
    badgeLabel: "⚠ Importante — App Store",
    title: "Mic Always-On Disclosure",
    body:
      "Apple e Google richiedono disclosure esplicita in listing. Indicatore visivo obbligatorio quando il microfono è attivo. Nessun audio cloud senza wake word.",
  },
  {
    level: "warning",
    icon: Shield,
    iconColor: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/30",
    badge: "bg-yellow-500/20 text-yellow-400",
    badgeLabel: "⚠ Importante — Minori",
    title: "GDPR Art.8 + COPPA",
    body:
      "Verifica età obbligatoria. Per under 16 in Italia: consenso genitoriale verificabile. Vietato raccogliere location e profilazione per under 16.",
  },
  {
    level: "ok",
    icon: CheckCircle,
    iconColor: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    badge: "bg-emerald-500/20 text-emerald-400",
    badgeLabel: "✓ Implementabile — Diritti utente",
    title: "GDPR Art. 15-22",
    body:
      "Accesso dati (30gg), rettifica, cancellazione (72h), portabilità, opposizione profilazione. Ogni endpoint dati deve avere il corrispettivo di cancellazione.",
  },
  {
    level: "ok",
    icon: CheckCircle,
    iconColor: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    badge: "bg-emerald-500/20 text-emerald-400",
    badgeLabel: "✓ Best Practice — Sicurezza",
    title: "Security Architecture",
    body:
      "JWT RS256, cifratura AES-256 at rest, TLS 1.3 in transit, zero-knowledge per audio, rate limiting, WAF, breach notification entro 72h al Garante.",
  },
];

const PHASES = [
  {
    num: 1,
    weeks: "Settimane 1-4",
    title: "Foundation & Auth",
    desc: "API Gateway, Auth Service completo con JWT + biometrico, PostgreSQL + Redis setup, app mobile base React Native con design system e navigazione.",
    tags: ["NestJS", "PostgreSQL", "Redis", "React Native", "Docker"],
    color: "from-violet-600 to-purple-700",
    border: "border-violet-500/30",
  },
  {
    num: 2,
    weeks: "Settimane 5-8",
    title: "Chat Realtime",
    desc: "Messaggistica 1:1 e gruppi con Supabase Realtime, notifiche push FCM + APNs, invio media (immagini/audio), stato online/offline, ricevute di lettura.",
    tags: ["Supabase", "WebSocket", "FCM", "APNs"],
    color: "from-blue-600 to-cyan-600",
    border: "border-blue-500/30",
  },
  {
    num: 3,
    weeks: "Settimane 9-11",
    title: "Location Live",
    desc: "Posizione live con 3 livelli privacy, geofencing personalizzato, sharing con scadenza temporale, mappa realtime contatti, SOS con auto-invio posizione.",
    tags: ["PostGIS", "Mapbox", "Background Location"],
    color: "from-emerald-600 to-teal-600",
    border: "border-emerald-500/30",
  },
  {
    num: 4,
    weeks: "Settimane 12-15",
    title: "AI Core + Memoria",
    desc: "GPT-4o integrato nella chat, sistema RAG con Pinecone, profilo utente che apprende nel tempo, risposte contestuali, traduzione live, riassunti intelligenti.",
    tags: ["GPT-4o", "Pinecone", "FastAPI", "SSE"],
    color: "from-orange-500 to-amber-500",
    border: "border-orange-500/30",
  },
  {
    num: 5,
    weeks: "Settimane 16-21",
    title: "Chiamate & Voce",
    desc: "LiveKit WebRTC per chiamate/video, Porcupine wake word on-device, pipeline Whisper STT → AI → ElevenLabs TTS, comandi vocali completi.",
    tags: ["LiveKit", "Porcupine", "Whisper", "ElevenLabs"],
    color: "from-rose-500 to-pink-600",
    border: "border-rose-500/30",
  },
  {
    num: 6,
    weeks: "Settimane 22-28",
    title: "Overlay & Automazioni",
    desc: "Overlay nativo Android (foreground service) + iOS, Rules Engine trigger/action, AI suggestions proattive, automazioni personalizzabili, profilo utente completo.",
    tags: ["Native Modules", "Rules Engine", "Foreground Service"],
    color: "from-indigo-500 to-violet-600",
    border: "border-indigo-500/30",
  },
];

const MASTER_PROMPT = `═══════════════════════════════════════════════════════════════
BEAUTY STYLE PRO — SUPER PROMPT MASTER v3.0
Sistema AI Autonomo Intelligente — Architettura Enterprise
═══════════════════════════════════════════════════════════════

## IDENTITÀ E MISSIONE

Sei l'architetto e sviluppatore principale di Beauty Style Pro,
una Super App intelligente e autonoma che combina le funzionalità
di Google Assistant, Telegram, WeChat, Life360 e ChatGPT in
un'unica piattaforma nativa per iOS e Android.

## VINCOLI TECNICI FONDAMENTALI (NON NEGOZIABILI)

MOBILE NATIVO OBBLIGATORIO:
— Wake word + mic sempre attiva → SOLO app nativa (React Native)
— Overlay sopra tutto → foreground service Android / iOS background
— Location sempre attiva → permessi "Always Allow" nativi
— NON è costruibile come web app / PWA

WAKE WORD — SOLO ON-DEVICE:
— Libreria: Porcupine (Picovoice) — modello ML locale, zero latenza
— NON usare API cloud per wake word detection (privacy + latenza)
— Modello custom: "Hey Style" o "Hey [NomeUtente]"

AI MEMORIA UTENTE — ARCHITETTURA RAG:
— Vector DB: Pinecone o Weaviate per embedding semantici
— Ogni azione utente → evento loggato → embedding → memoria
— Retrieval: top-K similarity search prima di ogni risposta AI
— Modello: GPT-4o (OpenAI) o Claude 3.5 Sonnet (Anthropic)

## ARCHITETTURA CORE — 7 SERVIZI PRINCIPALI

Auth Service · AI Service · Voice Service · Location Service
Call Service · Notification Service · User Profile Service

## STACK TECNOLOGICO

Mobile: React Native 0.74+ — build nativa obbligatoria
Backend: NestJS, FastAPI Python, Node.js puro
Database: PostgreSQL 16 + PostGIS, Redis 7, Pinecone, Supabase
AI/ML: GPT-4o, Whisper, ElevenLabs, Porcupine, text-embedding-3-large
Infra: Docker → Kubernetes, Nginx, GitHub Actions CI/CD

## OUTPUT RICHIESTO

Per ogni modulo: struttura directory, schema DB, API endpoints,
codice implementazione, Dockerfile, checklist GDPR, test unitari.

═══════════════════════════════════════════════════════════════
END OF MASTER PROMPT — Beauty Style Pro v3.0
═══════════════════════════════════════════════════════════════`;

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */

function SectionLabel({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="text-xs font-mono text-primary/60 tracking-widest">{num} —</span>
      <span className="text-xs font-mono text-foreground/40 tracking-widest uppercase">{label}</span>
      <div className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent" />
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-primary/10 text-primary/80 border border-primary/20">
      {label}
    </span>
  );
}

function ArchBadge({ label }: { label: string }) {
  return (
    <span className="px-3 py-1 rounded-full text-[11px] font-semibold border border-primary/30 bg-primary/10 text-primary">
      {label}
    </span>
  );
}

/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */

export default function ArchitecturePage() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(MASTER_PROMPT);
    } catch {
      // fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = MASTER_PROMPT;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <MobileLayout hideNav>
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-30 glass flex items-center gap-3 px-4 py-3 border-b border-border/30">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl chrome-border active:scale-95 transition-transform"
          aria-label="Torna indietro"
        >
          <ArrowLeft className="w-4 h-4 text-foreground/70" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-mono text-primary/60 tracking-widest uppercase truncate">
            beauty-style-pro · master-prompt-v3.0
          </p>
        </div>
        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30 animate-pulse">
          v3.0
        </span>
      </div>

      <div className="px-4 pb-20 space-y-12 max-w-2xl mx-auto">

        {/* ── Hero ── */}
        <div className="pt-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold mb-2">
            <Layers className="w-3.5 h-3.5" />
            MASTER ARCHITECTURE DOCUMENT
          </div>

          <h1 className="text-3xl sm:text-4xl font-display font-bold leading-tight">
            <span className="text-gradient-primary">BEAUTY</span>
            <br />
            <span className="text-gradient-gold">STYLE</span>
            <br />
            <span className="text-foreground">PRO</span>
          </h1>

          <p className="text-xs text-foreground/50 max-w-xs mx-auto leading-relaxed">
            Super App Intelligente Autonoma — Architettura livello enterprise con AI continua,
            voce attiva, posizione live, compliance GDPR e roadmap completa di sviluppo.
          </p>

          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {["AI Core", "Realtime Engine", "GDPR Compliant", "Voice Always-On", "WebRTC Calls", "Location Live"].map(b => (
              <ArchBadge key={b} label={b} />
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════
            SECTION 01 — MASTER PROMPT
        ══════════════════════════════════════ */}
        <section>
          <SectionLabel num="01" label="Master Prompt" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                IL SUPER PROMPT<br />
                <span className="text-gradient-primary">COMPLETO</span>
              </h2>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl chrome-border text-xs font-semibold transition-all active:scale-95 text-foreground/70 hover:text-foreground"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copiato!" : "Copy Prompt"}
              </button>
            </div>

            <div className="chrome-card rounded-2xl overflow-hidden">
              <button
                onClick={() => setPromptOpen(p => !p)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <span className="text-xs font-mono text-primary/70">
                  beauty-style-pro · master-prompt-v3.0
                </span>
                {promptOpen
                  ? <ChevronUp className="w-4 h-4 text-foreground/40" />
                  : <ChevronDown className="w-4 h-4 text-foreground/40" />
                }
              </button>

              {promptOpen && (
                <div className="px-4 pb-4">
                  <pre className="text-[10px] font-mono text-foreground/60 leading-relaxed whitespace-pre-wrap break-words overflow-x-auto">
                    {MASTER_PROMPT}
                  </pre>
                </div>
              )}
            </div>

            {/* Architecture diagram */}
            <div className="chrome-card rounded-2xl p-4 space-y-3">
              <p className="text-xs font-mono text-foreground/40 tracking-widest uppercase">Architettura Core</p>
              <div className="space-y-2 text-[10px] font-mono text-foreground/60 leading-relaxed">
                <div className="p-2.5 rounded-xl border border-border/50 bg-secondary/40 text-center">
                  <span className="text-primary/80">CLIENT LAYER</span>
                  <br />iOS App (Swift/RN) · Android App (Kotlin/RN)
                  <br /><span className="text-foreground/40">Wake Word · Overlay · Location · WebRTC</span>
                </div>
                <div className="flex justify-center text-foreground/30">│ HTTPS / WSS / WebRTC</div>
                <div className="p-2.5 rounded-xl border border-border/50 bg-secondary/40 text-center">
                  <span className="text-yellow-400/80">API GATEWAY</span>
                  <br />Kong / AWS API Gateway / Traefik
                  <br /><span className="text-foreground/40">Rate Limiting · JWT Auth · Routing · Logging</span>
                </div>
                <div className="flex justify-center text-foreground/30">│</div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: "AUTH", color: "text-violet-400", sub: "JWT+OAuth\nPostgreSQL" },
                    { name: "AI", color: "text-blue-400", sub: "GPT-4o+RAG\nPinecone" },
                    { name: "VOICE", color: "text-emerald-400", sub: "Whisper STT\nElevenLabs" },
                  ].map(s => (
                    <div key={s.name} className="p-2 rounded-lg border border-border/40 bg-secondary/30 text-center">
                      <div className={`font-bold ${s.color}`}>{s.name}</div>
                      <div className="text-foreground/40 whitespace-pre-line">{s.sub}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: "LOCATION", color: "text-orange-400", sub: "PostGIS+Supa\nGeofencing" },
                    { name: "CALL", color: "text-rose-400", sub: "LiveKit\nWebRTC" },
                    { name: "NOTIFY", color: "text-yellow-400", sub: "FCM+APNs\nAI Rules" },
                  ].map(s => (
                    <div key={s.name} className="p-2 rounded-lg border border-border/40 bg-secondary/30 text-center">
                      <div className={`font-bold ${s.color}`}>{s.name}</div>
                      <div className="text-foreground/40 whitespace-pre-line">{s.sub}</div>
                    </div>
                  ))}
                </div>
                <div className="p-2.5 rounded-xl border border-border/50 bg-secondary/40 text-center">
                  <span className="text-foreground/50">DATA LAYER</span>
                  <br />PostgreSQL · Redis · Pinecone · Supabase · S3
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            SECTION 02 — 7 CORE SERVICES
        ══════════════════════════════════════ */}
        <section>
          <SectionLabel num="02" label="Architettura" />

          <div className="space-y-3">
            <h2 className="text-lg font-bold">
              I 7 CORE<br />
              <span className="text-gradient-primary">SERVICES</span>
            </h2>

            <div className="grid gap-3">
              {SERVICES.map(svc => {
                const Icon = svc.icon;
                return (
                  <div key={svc.title} className={`chrome-card rounded-2xl p-4 border ${svc.border} shadow-lg ${svc.glow}`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${svc.color} shrink-0`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm">{svc.emoji}</span>
                          <h3 className="font-bold text-sm text-foreground">{svc.title}</h3>
                        </div>
                        <p className="text-[11px] font-mono text-foreground/40 mb-2">{svc.stack}</p>
                        <ul className="space-y-1">
                          {svc.features.map(f => (
                            <li key={f} className="flex items-start gap-1.5 text-[11px] text-foreground/60">
                              <span className="text-primary/50 mt-0.5 shrink-0">—</span>
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            SECTION 03 — GDPR & SICUREZZA
        ══════════════════════════════════════ */}
        <section>
          <SectionLabel num="03" label="Compliance Legale" />

          <div className="space-y-3">
            <h2 className="text-lg font-bold">
              GDPR &<br />
              <span className="text-gradient-gold">SICUREZZA</span>
            </h2>

            <div className="grid gap-3">
              {COMPLIANCE.map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className={`rounded-2xl p-4 border ${item.bg}`}>
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 ${item.iconColor} shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <div className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mb-1.5 border ${item.badge} border-current/20`}>
                          {item.badgeLabel}
                        </div>
                        <h3 className="font-bold text-sm text-foreground mb-1">{item.title}</h3>
                        <p className="text-[11px] text-foreground/60 leading-relaxed">{item.body}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            SECTION 04 — ROADMAP
        ══════════════════════════════════════ */}
        <section>
          <SectionLabel num="04" label="Roadmap" />

          <div className="space-y-3">
            <h2 className="text-lg font-bold">
              6 FASI DI<br />
              <span className="text-gradient-primary">SVILUPPO</span>
            </h2>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-6 bottom-6 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent pointer-events-none" />

              <div className="space-y-4">
                {PHASES.map(phase => (
                  <div key={phase.num} className="flex gap-4">
                    {/* Phase number bubble */}
                    <div className={`shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${phase.color} flex items-center justify-center shadow-lg z-10`}>
                      <span className="text-white font-bold text-sm">{phase.num}</span>
                    </div>

                    <div className={`flex-1 chrome-card rounded-2xl p-4 border ${phase.border}`}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-sm text-foreground">{phase.title}</h3>
                        <span className="text-[10px] font-mono text-foreground/40 shrink-0">{phase.weeks}</span>
                      </div>
                      <p className="text-[11px] text-foreground/60 leading-relaxed mb-2">{phase.desc}</p>
                      <div className="flex flex-wrap gap-1">
                        {phase.tags.map(t => <Tag key={t} label={t} />)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="pt-4 pb-8 text-center space-y-2 border-t border-border/20">
          <div className="flex justify-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] text-foreground/30">
              <Server className="w-3 h-3" /> Enterprise
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-foreground/30">
              <Shield className="w-3 h-3" /> GDPR
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-foreground/30">
              <Smartphone className="w-3 h-3" /> Native
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-foreground/30">
              <Globe className="w-3 h-3" /> v3.0
            </div>
          </div>
          <p className="text-[10px] font-mono text-foreground/20">
            BEAUTY STYLE PRO · Master Architecture Document · v3.0
          </p>
          <p className="text-[10px] text-foreground/20">
            Generato con Claude · 2026
          </p>
        </footer>

      </div>
    </MobileLayout>
  );
}
