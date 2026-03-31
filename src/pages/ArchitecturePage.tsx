import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import {
  ArrowLeft,
  Copy,
  Check,
  Lock,
  Brain,
  Mic,
  MapPin,
  Phone,
  Bell,
  User,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle,
} from "lucide-react";

/* ─── Master Prompt text ─────────────────────────────────────────────────── */
const MASTER_PROMPT = `═══════════════════════════════════════════════════════════════
BEAUTY STYLE PRO — SUPER PROMPT MASTER v3.0
Sistema AI Autonomo Intelligente — Architettura Enterprise
═══════════════════════════════════════════════════════════════

## IDENTITÀ E MISSIONE

Sei l'architetto e sviluppatore principale di Beauty Style Pro, una Super App intelligente e autonoma che combina le funzionalità di Google Assistant, Telegram, WeChat, Life360 e ChatGPT in un'unica piattaforma nativa per iOS e Android.

Il sistema deve essere progettato come un ecosistema intelligente continuo, non come una semplice applicazione. Ogni modulo comunica con gli altri attraverso un Core centralizzato. L'utente non percepisce mai i confini tra i servizi — tutto scorre in modo fluido e intelligente.

## VINCOLI TECNICI FONDAMENTALI (NON NEGOZIABILI)

MOBILE NATIVO OBBLIGATORIO:
— Wake word + mic sempre attiva → SOLO app nativa (React Native o Flutter)
— Overlay sopra tutto → foreground service Android / iOS background mode
— Location sempre attiva → permessi "Always Allow" nativi
— NON è costruibile come web app / PWA

WAKE WORD — SOLO ON-DEVICE:
— Libreria: Porcupine (Picovoice) — modello ML locale, zero latenza
— NON usare API cloud per wake word detection (privacy + latenza)
— Modello custom: "Hey Style" o "Hey [NomeUtente]"
— Training disponibile su Picovoice Console (gratuito per uso commerciale limitato)

AI MEMORIA UTENTE — ARCHITETTURA RAG:
— Vector DB: Pinecone o Weaviate per embedding semantici
— Ogni azione utente → evento loggato → embedding → memoria persistente
— Retrieval: top-K similarity search prima di ogni risposta AI
— Modello: GPT-4o (OpenAI) o Claude 3.5 Sonnet (Anthropic) via API

## ARCHITETTURA CORE — 7 SERVIZI PRINCIPALI

CLIENT LAYER
  iOS App (Swift/RN)  ·  Android App (Kotlin/RN)
  Wake Word Engine · Overlay Service · Location · WebRTC

API GATEWAY
  Kong / AWS API Gateway / Traefik
  Rate Limiting · JWT Auth · Routing · Logging

MICROSERVIZI:
  AUTH SERVICE    — JWT + OAuth · PostgreSQL · Redis sessions
  AI SERVICE      — GPT-4o + RAG · Pinecone · Context
  VOICE SERVICE   — Whisper STT · ElevenLabs TTS
  LOCATION SERVICE — PostGIS + Supabase · Geofencing
  CALL SERVICE    — LiveKit · WebRTC
  NOTIFY SERVICE  — FCM + APNs · AI Rules

DATA LAYER
  PostgreSQL · Redis · Pinecone · Supabase · S3/Azure Blob

## STACK TECNOLOGICO DEFINITIVO

Mobile: React Native 0.74+ (unico codebase iOS + Android)
Backend: NestJS · FastAPI Python · Node.js puro
Database: PostgreSQL 16 + PostGIS · Redis 7 · Pinecone · Supabase
Infrastructure: Docker Compose → Kubernetes · GitHub Actions CI/CD
AI/ML: GPT-4o · Whisper STT · ElevenLabs TTS · Porcupine · text-embedding-3-large

## COMPLIANCE GDPR — OBBLIGATORIA

— Privacy Policy completa con legal basis per ogni tipo di dato
— Consent Management: consenso granulare, revocabile, tracciato
— DPIA obbligatoria per: localizzazione continua, dati biometrici, profilazione AI
— Data Retention Policy con cancellazione automatica
— Breach Notification al Garante entro 72h
— Diritti utente Art. 15-22: accesso, rettifica, cancellazione, portabilità

═══════════════════════════════════════════════════════════════
END OF MASTER PROMPT — Beauty Style Pro v3.0
═══════════════════════════════════════════════════════════════`;

/* ─── 7 Core Services ────────────────────────────────────────────────────── */
const SERVICES = [
  {
    icon: Lock,
    emoji: "🔐",
    title: "Auth Service",
    stack: "NestJS · PostgreSQL · Redis",
    description:
      "JWT RS256, OAuth 2.0, biometrico, 2FA TOTP, sessioni multi-device con revoca remota, audit log completo con device fingerprint.",
    color: "from-violet-600/20 to-purple-900/10",
    border: "border-violet-500/30",
  },
  {
    icon: Brain,
    emoji: "🧠",
    title: "AI Service",
    stack: "FastAPI · GPT-4o · Pinecone",
    description:
      "RAG memory con embedding semantici, intent classifier distilbert, streaming SSE, profilo utente semantico costruito nel tempo.",
    color: "from-blue-600/20 to-indigo-900/10",
    border: "border-blue-500/30",
  },
  {
    icon: Mic,
    emoji: "🎙",
    title: "Voice Service",
    stack: "Porcupine · Whisper · ElevenLabs",
    description:
      'Wake word on-device (zero latenza), STT cloud Whisper, TTS naturale ElevenLabs, pipeline completa comandi vocali "Hey Style".',
    color: "from-green-600/20 to-emerald-900/10",
    border: "border-green-500/30",
  },
  {
    icon: MapPin,
    emoji: "📍",
    title: "Location Service",
    stack: "PostGIS · Supabase RT · Redis",
    description:
      "Live tracking aggiornabile (1s→manual), geofencing personalizzato con trigger, sharing con scadenza, 3 livelli privacy (EXACT/AREA/CITY).",
    color: "from-orange-600/20 to-amber-900/10",
    border: "border-orange-500/30",
  },
  {
    icon: Phone,
    emoji: "📞",
    title: "Call Service",
    stack: "LiveKit · STUN/TURN · WebRTC",
    description:
      "Chiamate P2P audio con fallback TURN, videochiamate gruppo (max 8), qualità adattiva 8kbps→2Mbps, registrazione con consenso bilaterale.",
    color: "from-pink-600/20 to-rose-900/10",
    border: "border-pink-500/30",
  },
  {
    icon: Bell,
    emoji: "🔔",
    title: "Notification Service",
    stack: "FCM · APNs · AI Rules",
    description:
      "Push intelligente contestuale, notifiche SOS priorità massima bypass DND, Rules Engine TRIGGER→CONDITION→ACTION, automazioni personalizzabili.",
    color: "from-yellow-600/20 to-amber-900/10",
    border: "border-yellow-500/30",
  },
  {
    icon: User,
    emoji: "👤",
    title: "User Profile Service",
    stack: "Python · PostgreSQL · Pinecone · Redis",
    description:
      "Apprendimento abitudini orarie, grafo relazioni con peso, luoghi frequenti clustering PostGIS, preferenze comunicazione — tutto opt-in GDPR.",
    color: "from-teal-600/20 to-cyan-900/10",
    border: "border-teal-500/30",
  },
];

/* ─── GDPR Compliance items ──────────────────────────────────────────────── */
const COMPLIANCE = [
  {
    icon: ShieldCheck,
    level: "critical",
    badge: "⛔ Critico — Prima del lancio",
    title: "DPIA Obbligatoria",
    description:
      "Data Protection Impact Assessment richiesta per: localizzazione continua, profilazione AI, registrazione audio. Senza DPIA il servizio non può essere lanciato in EU.",
  },
  {
    icon: AlertTriangle,
    level: "critical",
    badge: "⛔ Critico — Registrazione chiamate",
    title: "Consenso Bilaterale",
    description:
      "In Italia art. 617 c.p.: registrare chiamata senza consenso è reato penale. Notifica audio automatica + conferma entrambe le parti obbligatoria in ogni caso.",
  },
  {
    icon: Info,
    level: "warning",
    badge: "⚠ Importante — App Store",
    title: "Mic Always-On Disclosure",
    description:
      "Apple e Google richiedono disclosure esplicita in listing. Indicatore visivo obbligatorio quando il microfono è attivo. Nessun audio cloud senza wake word.",
  },
  {
    icon: Info,
    level: "warning",
    badge: "⚠ Importante — Minori",
    title: "GDPR Art.8 + COPPA",
    description:
      "Verifica età obbligatoria. Per under 16 in Italia: consenso genitoriale verificabile. Vietato raccogliere location e profilazione per under 16.",
  },
  {
    icon: CheckCircle,
    level: "ok",
    badge: "✓ Implementabile — Diritti utente",
    title: "GDPR Art. 15-22",
    description:
      "Accesso dati (30gg), rettifica, cancellazione (72h), portabilità, opposizione profilazione. Ogni endpoint dati deve avere il corrispettivo di cancellazione.",
  },
  {
    icon: CheckCircle,
    level: "ok",
    badge: "✓ Best Practice — Sicurezza",
    title: "Security Architecture",
    description:
      "JWT RS256, cifratura AES-256 at rest, TLS 1.3 in transit, zero-knowledge per audio, rate limiting, WAF, breach notification entro 72h al Garante.",
  },
];

/* ─── Roadmap phases ─────────────────────────────────────────────────────── */
const ROADMAP = [
  {
    phase: "Fase 1",
    weeks: "Settimane 1-4",
    title: "Foundation & Auth",
    description:
      "API Gateway, Auth Service completo con JWT + biometrico, PostgreSQL + Redis setup, app mobile base React Native con design system e navigazione.",
    tags: ["NestJS", "PostgreSQL", "Redis", "React Native", "Docker"],
    color: "from-violet-600 to-purple-700",
  },
  {
    phase: "Fase 2",
    weeks: "Settimane 5-8",
    title: "Chat Realtime",
    description:
      "Messaggistica 1:1 e gruppi con Supabase Realtime, notifiche push FCM + APNs, invio media (immagini/audio), stato online/offline, ricevute di lettura.",
    tags: ["Supabase", "WebSocket", "FCM", "APNs"],
    color: "from-blue-600 to-indigo-700",
  },
  {
    phase: "Fase 3",
    weeks: "Settimane 9-11",
    title: "Location Live",
    description:
      "Posizione live con 3 livelli privacy, geofencing personalizzato, sharing con scadenza temporale, mappa realtime contatti, SOS con auto-invio posizione.",
    tags: ["PostGIS", "Mapbox", "Background Location"],
    color: "from-green-600 to-emerald-700",
  },
  {
    phase: "Fase 4",
    weeks: "Settimane 12-15",
    title: "AI Core + Memoria",
    description:
      "GPT-4o integrato nella chat, sistema RAG con Pinecone, profilo utente che apprende nel tempo, risposte contestuali, traduzione live, riassunti intelligenti.",
    tags: ["GPT-4o", "Pinecone", "FastAPI", "SSE"],
    color: "from-orange-600 to-amber-700",
  },
  {
    phase: "Fase 5",
    weeks: "Settimane 16-21",
    title: "Chiamate & Voce",
    description:
      "LiveKit WebRTC per chiamate/video, Porcupine wake word on-device, pipeline Whisper STT → AI → ElevenLabs TTS, comandi vocali completi.",
    tags: ["LiveKit", "Porcupine", "Whisper", "ElevenLabs"],
    color: "from-pink-600 to-rose-700",
  },
  {
    phase: "Fase 6",
    weeks: "Settimane 22-28",
    title: "Overlay & Automazioni",
    description:
      "Overlay nativo Android (foreground service) + iOS, Rules Engine trigger/action, AI suggestions proattive, automazioni personalizzabili, profilo utente completo.",
    tags: ["Native Modules", "Rules Engine", "Foreground Service"],
    color: "from-teal-600 to-cyan-700",
  },
];

/* ─── Badge colours by level ─────────────────────────────────────────────── */
function complianceBadgeClass(level: string) {
  if (level === "critical") return "text-destructive border-destructive/40 bg-destructive/10";
  if (level === "warning") return "text-accent border-accent/40 bg-accent/10";
  return "text-success border-success/40 bg-success/10";
}

/* ─── Section header ─────────────────────────────────────────────────────── */
function SectionHeader({
  index,
  label,
  title,
  subtitle,
}: {
  index: string;
  label: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="px-5 pt-10 pb-4">
      <p className="text-xs font-mono text-primary/60 tracking-widest uppercase mb-1">
        {index} — {label}
      </p>
      <h2 className="text-2xl font-display font-bold leading-tight">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1 font-mono tracking-wide">{subtitle}</p>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function ArchitecturePage() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(MASTER_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for environments without clipboard API
      const ta = document.createElement("textarea");
      ta.value = MASTER_PROMPT;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 glass px-5 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          aria-label="Indietro"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-display font-bold truncate">Master Architecture</h1>
          <p className="text-[10px] text-muted-foreground font-mono">beauty-style-pro · v3.0</p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-primary/40 text-primary font-mono bg-primary/10">
          Enterprise
        </span>
      </header>

      {/* Hero */}
      <div className="px-5 pt-8 pb-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-mono mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          AI Core · Realtime · GDPR · Voice · WebRTC · Location
        </div>
        <h1 className="text-3xl font-display font-black tracking-tight text-gradient-primary mb-1">
          BEAUTY
        </h1>
        <h1 className="text-3xl font-display font-black tracking-tight text-gradient-gold mb-1">
          STYLE
        </h1>
        <h1 className="text-3xl font-display font-black tracking-tight mb-4">PRO</h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
          Super App Intelligente Autonoma — Architettura livello enterprise con AI continua, voce
          attiva, posizione live, compliance GDPR e roadmap completa di sviluppo.
        </p>

        {/* Chip badges */}
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          {["AI Core", "Realtime Engine", "GDPR Compliant", "Voice Always-On", "WebRTC Calls", "Location Live"].map(
            (chip) => (
              <span
                key={chip}
                className="text-[11px] px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary/80 font-mono"
              >
                {chip}
              </span>
            )
          )}
        </div>
      </div>

      {/* ── 01 Master Prompt ─────────────────────────────────────────── */}
      <SectionHeader
        index="01"
        label="Master Prompt"
        title="IL SUPER PROMPT COMPLETO"
        subtitle="beauty-style-pro · master-prompt-v3.0"
      />

      <div className="px-5 pb-2">
        <div className="luxury-card rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <span className="text-xs font-mono text-muted-foreground">master-prompt-v3.0.txt</span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-mono"
              aria-label="Copia prompt"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copiato!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Prompt
                </>
              )}
            </button>
          </div>
          <div className="p-4 max-h-72 overflow-y-auto">
            <pre className="text-[10px] leading-relaxed font-mono text-muted-foreground whitespace-pre-wrap break-words">
              {MASTER_PROMPT}
            </pre>
          </div>
        </div>
      </div>

      {/* ── 02 Architecture ──────────────────────────────────────────── */}
      <SectionHeader
        index="02"
        label="Architettura"
        title="I 7 CORE SERVICES"
        subtitle="Microservizi e data layer"
      />

      <div className="px-5 space-y-3 pb-2">
        {SERVICES.map((svc) => {
          const Icon = svc.icon;
          return (
            <div
              key={svc.title}
              className={`rounded-2xl border ${svc.border} bg-gradient-to-br ${svc.color} p-4`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-background/40 border border-white/10">
                  {svc.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-display font-bold">{svc.title}</h3>
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5 mb-2">
                    {svc.stack}
                  </p>
                  <p className="text-xs text-foreground/75 leading-relaxed">{svc.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 03 Compliance Legale ─────────────────────────────────────── */}
      <SectionHeader
        index="03"
        label="Compliance Legale"
        title="GDPR & SICUREZZA"
        subtitle="Regolamenti e requisiti di sicurezza"
      />

      <div className="px-5 space-y-3 pb-2">
        {COMPLIANCE.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="luxury-card rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${complianceBadgeClass(item.level)}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className={`inline-block text-[9px] font-mono px-2 py-0.5 rounded-full border mb-1 ${complianceBadgeClass(item.level)}`}
                  >
                    {item.badge}
                  </span>
                  <h3 className="text-sm font-display font-bold">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 04 Roadmap ───────────────────────────────────────────────── */}
      <SectionHeader
        index="04"
        label="Roadmap"
        title="6 FASI DI SVILUPPO"
        subtitle="Timeline di implementazione 28 settimane"
      />

      <div className="px-5 space-y-3 pb-8">
        {ROADMAP.map((phase, idx) => (
          <div key={phase.phase} className="luxury-card rounded-2xl overflow-hidden">
            <div className={`bg-gradient-to-r ${phase.color} px-4 py-3 flex items-center gap-3`}>
              <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-display font-black text-white">
                {idx + 1}
              </span>
              <div>
                <p className="text-[10px] text-white/70 font-mono">{phase.weeks}</p>
                <p className="text-sm font-display font-bold text-white">{phase.title}</p>
              </div>
              <span className="ml-auto text-xs font-mono text-white/60">{phase.phase}</span>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                {phase.description}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {phase.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono border border-border/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 pb-10 text-center">
        <p className="text-[10px] text-muted-foreground/50 font-mono">
          BEAUTY STYLE PRO · Master Architecture Document · v3.0 · 2026
        </p>
      </div>
    </MobileLayout>
  );
}
