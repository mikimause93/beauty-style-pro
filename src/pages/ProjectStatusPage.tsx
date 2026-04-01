import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Code2,
  Database,
  Globe,
  Layers,
  Lock,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Wrench,
  Zap,
} from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";

interface FeatureGroup {
  title: string;
  icon: React.ElementType;
  color: string;
  items: { label: string; done: boolean; note?: string }[];
}

const featureGroups: FeatureGroup[] = [
  {
    title: "Autenticazione & Profili",
    icon: Lock,
    color: "from-blue-500/20 to-indigo-500/20 border-blue-500/30",
    items: [
      { label: "Registrazione multi-ruolo (Cliente / Professionista / Business)", done: true },
      { label: "Login con email + password", done: true },
      { label: "OTP via SMS (stile WhatsApp)", done: true },
      { label: "Recupero password via email", done: true },
      { label: "Gestione sessione & refresh token", done: true },
      { label: "Onboarding passo-passo", done: true },
      { label: "Verifica account (badge verificato)", done: true },
      { label: "Profilo modificabile con avatar upload", done: true },
    ],
  },
  {
    title: "Social & Feed",
    icon: Star,
    color: "from-pink-500/20 to-rose-500/20 border-pink-500/30",
    items: [
      { label: "Feed principale con post e storie", done: true },
      { label: "Like, commenti, condivisioni", done: true },
      { label: "Segui / Smetti di seguire in tempo reale", done: true },
      { label: "Creazione post con immagini/video", done: true },
      { label: "Stories a scomparsa (24h)", done: true },
      { label: "Esplora & Ricerca utenti/contenuti", done: true },
      { label: "Before & After gallery", done: true },
      { label: "Shorts (video verticali)", done: true },
    ],
  },
  {
    title: "Prenotazioni & Servizi",
    icon: Clock,
    color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
    items: [
      { label: "Prenotazione con selezione data/ora/luogo", done: true },
      { label: "Storico prenotazioni per cliente", done: true },
      { label: "Gestione prenotazioni per professionista", done: true },
      { label: "Dettaglio prenotazione con ricevuta", done: true },
      { label: "Servizi a domicilio", done: true },
      { label: "Richiesta servizi sul marketplace", done: true },
      { label: "Recensioni post-prenotazione", done: true },
    ],
  },
  {
    title: "Chat & Notifiche",
    icon: Zap,
    color: "from-amber-500/20 to-orange-500/20 border-amber-500/30",
    items: [
      { label: "Chat real-time stile Messenger/WhatsApp", done: true },
      { label: "Messaggi vocali (Media Recorder API)", done: true },
      { label: "Traduzione automatica messaggi in arrivo", done: true },
      { label: "Chiamate vocali & video in-app", done: true },
      { label: "Notifiche push ad app chiusa (Service Worker)", done: true },
      { label: "Centro notifiche in-app", done: true },
      { label: "Suggerimenti automatici in chat (AI)", done: true },
    ],
  },
  {
    title: "Live Streaming & Radio",
    icon: Globe,
    color: "from-violet-500/20 to-purple-500/20 border-violet-500/30",
    items: [
      { label: "Live streaming con chat, reactions, tips", done: true },
      { label: "Live Battle tra professionisti", done: true },
      { label: "Sondaggi durante la live", done: true },
      { label: "Gestione ospiti live (invite/kick)", done: true },
      { label: "Radio & Music Player integrato", done: true },
      { label: "Quiz Live interattivo", done: true },
      { label: "Talent Game (show di talenti)", done: true },
    ],
  },
  {
    title: "E-Commerce & Pagamenti",
    icon: Layers,
    color: "from-sky-500/20 to-cyan-500/20 border-sky-500/30",
    items: [
      { label: "Shop prodotti beauty", done: true },
      { label: "Marketplace servizi & casting", done: true },
      { label: "Checkout con Stripe", done: true },
      { label: "Pagamenti a rate (installments)", done: true },
      { label: "Storico acquisti & ricevute", done: true },
      { label: "Aste prodotti (auctions)", done: true },
      { label: "Gestione prodotti per business", done: true },
      { label: "Codici promozionali & offerte speciali", done: true },
    ],
  },
  {
    title: "Wallet & QRCoin",
    icon: Sparkles,
    color: "from-yellow-500/20 to-lime-500/20 border-yellow-500/30",
    items: [
      { label: "Wallet con saldo QRCoin", done: true },
      { label: "Trasferimento QRCoin via QR code", done: true },
      { label: "Storico transazioni", done: true },
      { label: "Programma referral con ricompense", done: true },
      { label: "Programma affiliate con commissioni", done: true },
    ],
  },
  {
    title: "Gamification",
    icon: Rocket,
    color: "from-fuchsia-500/20 to-pink-500/20 border-fuchsia-500/30",
    items: [
      { label: "Sfide e Challenge (con partecipazione)", done: true },
      { label: "Transformation Challenge fotografica", done: true },
      { label: "Spin & Win (gioco a premi)", done: true },
      { label: "Leaderboard mensile/annuale", done: true },
      { label: "Missioni giornaliere & settimanali", done: true },
      { label: "Badge & achievements", done: true },
      { label: "Promemoria intelligenti (AI)", done: true },
    ],
  },
  {
    title: "Business & HR",
    icon: Wrench,
    color: "from-stone-500/20 to-zinc-500/20 border-stone-500/30",
    items: [
      { label: "Dashboard Business con statistiche", done: true },
      { label: "Analytics avanzate per professionisti", done: true },
      { label: "Gestione team & turni", done: true },
      { label: "Modulo HR con annunci di lavoro", done: true },
      { label: "Dettaglio candidature e selezione", done: true },
      { label: "Log attività dipendenti", done: true },
      { label: "Profilo Business pubblico con servizi/shop", done: true },
    ],
  },
  {
    title: "AI & Tecnologie Smart",
    icon: Sparkles,
    color: "from-indigo-500/20 to-blue-500/20 border-indigo-500/30",
    items: [
      { label: "Stella AI — assistente vocale con wake word", done: true },
      { label: "30+ comandi vocali (navigazione, messaggi, mappa…)", done: true },
      { label: "AI Look Generator (genera look beauty con AI)", done: true },
      { label: "Chatbot Widget integrato", done: true },
      { label: "Ricerca su mappa intelligente (AI + geolocalizzazione)", done: true },
      { label: "Suggerimenti AI in chat", done: true },
    ],
  },
  {
    title: "Platform & Infrastruttura",
    icon: ShieldCheck,
    color: "from-teal-500/20 to-green-500/20 border-teal-500/30",
    items: [
      { label: "PWA installabile (iOS + Android + Desktop)", done: true },
      { label: "App Android nativa (Capacitor)", done: true },
      { label: "Tema Dark / Light con salvataggio preferenza", done: true },
      { label: "Pannello Admin con gestione utenti e report", done: true },
      { label: "Panel di debug per sviluppatori", done: true },
      { label: "Stripe webhook con verifica firma", done: true },
      { label: "Error boundary + logging centralizzato", done: true },
      { label: "CI/CD con GitHub Actions (lint + test + deploy)", done: true },
      { label: "Deploy automatico su GitHub Pages", done: true },
    ],
  },
  {
    title: "UX & Accessibilità",
    icon: Smartphone,
    color: "from-rose-500/20 to-orange-500/20 border-rose-500/30",
    items: [
      { label: "Layout mobile-first con BottomNav", done: true },
      { label: "Animazioni fluide con Framer Motion", done: true },
      { label: "Splash screen & onboarding", done: true },
      { label: "Safe area inset per notch iOS/Android", done: true },
      { label: "Toast notifications (Sonner)", done: true },
      { label: "Skeleton loading states", done: true },
      { label: "Pagine legali (Termini, Privacy, Spa & Terme)", done: true },
    ],
  },
];

const recentFixes = [
  { label: "Fix navigazione post-login: guard useEffect sincronizzato", pr: 35 },
  { label: "Rimosso step IBAN superfluo dalla registrazione cliente", pr: 35 },
  { label: ".single() → .maybeSingle() su tutte le query SELECT opzionali (fix PGRST116)", pr: null },
  { label: "Localizzazione errori Supabase in italiano (localizeAuthError)", pr: null },
  { label: "Stella AI: FAB prominente in nav + UX core migliorata", pr: 30 },
  { label: "UI Luxury overhaul: token colori vivaci, CTA gradient, tipografia", pr: 29 },
  { label: "AI hands-free + VerifiedBadge coerente nel feed", pr: 28 },
  { label: "Fix deploy GitHub Pages: base path, SPA routing, bypass Jekyll", pr: 23 },
  { label: "Stripe webhook: verifica firma + documentazione Edge Function secrets", pr: 9 },
  { label: "safeStorage utility + ErrorBoundary + guard geolocalizzazione", pr: null },
];

const techStack = [
  { label: "React 18 + TypeScript", icon: Code2 },
  { label: "Vite (build tool)", icon: Zap },
  { label: "Tailwind CSS + shadcn/ui", icon: Layers },
  { label: "Supabase (DB + Auth + Realtime)", icon: Database },
  { label: "Framer Motion", icon: Sparkles },
  { label: "Capacitor (Android)", icon: Smartphone },
  { label: "Stripe (pagamenti)", icon: ShieldCheck },
  { label: "Leaflet (mappe)", icon: Globe },
];

export default function ProjectStatusPage() {
  const navigate = useNavigate();

  const totalItems = featureGroups.reduce((sum, g) => sum + g.items.length, 0);
  const doneItems = featureGroups.reduce((sum, g) => sum + g.items.filter(i => i.done).length, 0);
  const pct = Math.round((doneItems / totalItems) * 100);

  return (
    <MobileLayout>
      <div className="min-h-screen pb-24">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
            aria-label="Indietro"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold truncate">Stato del Progetto</h1>
            <p className="text-xs text-muted-foreground">STYLE — Beauty Platform v1.0.0</p>
          </div>
          <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/30">
            {pct}% completo
          </span>
        </div>

        <div className="px-4 pt-5 space-y-6">
          {/* Overview card */}
          <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Rocket className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-base">A che punto siamo?</h2>
                <p className="text-xs text-muted-foreground">Panoramica dello sviluppo</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full h-3 rounded-full bg-muted overflow-hidden mb-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mb-4">
              <span>{doneItems} funzionalità completate</span>
              <span>{totalItems - doneItems} in pipeline</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Pagine", value: "72" },
                { label: "Componenti", value: "100+" },
                { label: "Tabelle DB", value: "92" },
                { label: "Routes", value: "42" },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl bg-background/60 border border-border/50 p-3 text-center">
                  <div className="text-xl font-bold text-primary">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature groups */}
          {featureGroups.map(group => {
            const GroupIcon = group.icon;
            const groupDone = group.items.filter(i => i.done).length;
            return (
              <div
                key={group.title}
                className={`rounded-2xl bg-gradient-to-br ${group.color} border p-4 space-y-3`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GroupIcon className="w-4 h-4" />
                    <h3 className="font-semibold text-sm">{group.title}</h3>
                  </div>
                  <span className="text-xs text-muted-foreground">{groupDone}/{group.items.length}</span>
                </div>
                <ul className="space-y-2">
                  {group.items.map(item => (
                    <li key={item.label} className="flex items-start gap-2 text-xs">
                      {item.done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-0.5" />
                      )}
                      <span className={item.done ? "text-foreground" : "text-muted-foreground"}>
                        {item.label}
                        {item.note && <span className="ml-1 text-muted-foreground/70">({item.note})</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {/* Recent fixes */}
          <div className="rounded-2xl border border-border/50 bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-sm">Fix & Miglioramenti Recenti</h3>
            </div>
            <ul className="space-y-2">
              {recentFixes.map(fix => (
                <li key={fix.label} className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-foreground">
                    {fix.label}
                    {fix.pr && (
                      <span className="ml-1 text-muted-foreground">(PR #{fix.pr})</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech stack */}
          <div className="rounded-2xl border border-border/50 bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-sky-500" />
              <h3 className="font-semibold text-sm">Stack Tecnologico</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {techStack.map(tech => {
                const TechIcon = tech.icon;
                return (
                  <div
                    key={tech.label}
                    className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-xs"
                  >
                    <TechIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{tech.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Version badge */}
          <div className="text-center text-xs text-muted-foreground pb-2">
            STYLE Beauty Platform &nbsp;·&nbsp; v1.0.0 &nbsp;·&nbsp; React 18 + Supabase
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
