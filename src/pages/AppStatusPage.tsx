import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, Zap, Users, ShoppingBag, MessageCircle, Calendar, Radio, Sparkles, Trophy, Briefcase, Shield, Smartphone, BarChart2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FeatureItem {
  name: string;
  status: "done" | "partial" | "planned";
}

interface FeatureCategory {
  icon: React.ElementType;
  title: string;
  features: FeatureItem[];
}

const STATUS_LABELS: Record<FeatureItem["status"], string> = {
  done: "Completato",
  partial: "In corso",
  planned: "Pianificato",
};

const STATUS_COLORS: Record<FeatureItem["status"], string> = {
  done: "text-green-500",
  partial: "text-amber-500",
  planned: "text-muted-foreground",
};

const STATUS_ICONS: Record<FeatureItem["status"], React.ElementType> = {
  done: CheckCircle2,
  partial: Clock,
  planned: AlertCircle,
};

const categories: FeatureCategory[] = [
  {
    icon: Shield,
    title: "Autenticazione",
    features: [
      { name: "Login / Registrazione email", status: "done" },
      { name: "OTP via SMS (stile WhatsApp)", status: "done" },
      { name: "Multi-ruolo (Cliente / Professionista / Business)", status: "done" },
      { name: "Onboarding guidato", status: "done" },
      { name: "Verifica account", status: "done" },
    ],
  },
  {
    icon: Users,
    title: "Social & Feed",
    features: [
      { name: "Feed post con like, commenti, condivisioni", status: "done" },
      { name: "Follow / Unfollow in tempo reale", status: "done" },
      { name: "Stories e contenuti verticali", status: "done" },
      { name: "Shorts (video clip)", status: "done" },
      { name: "Before / After gallery", status: "done" },
      { name: "Creazione post con media", status: "done" },
      { name: "Scroll infinito feed (paginazione reale)", status: "done" },
      { name: "Feed Realtime — nuovi post in diretta", status: "done" },
      { name: "Like count sincronizzato nel DB", status: "done" },
    ],
  },
  {
    icon: MessageCircle,
    title: "Chat & Comunicazione",
    features: [
      { name: "Chat testo, immagini, file", status: "done" },
      { name: "Messaggi vocali", status: "done" },
      { name: "Traduzione messaggi in tempo reale", status: "done" },
      { name: "Ricerca utenti / nuova conversazione", status: "done" },
      { name: "Lista conversazioni Realtime (last_message live)", status: "done" },
      { name: "Aggiornamento last_message in DB all'invio", status: "done" },
      { name: "Chiamate vocali e video (WebRTC locale)", status: "done" },
      { name: "Traduzione live durante le chiamate", status: "done" },
      { name: "Messaggi di gruppo", status: "planned" },
    ],
  },
  {
    icon: Calendar,
    title: "Prenotazioni",
    features: [
      { name: "Selezione professionista e servizio", status: "done" },
      { name: "Calendario e fasce orarie", status: "done" },
      { name: "Prenotazione a domicilio / online", status: "done" },
      { name: "Storico prenotazioni", status: "done" },
      { name: "Promemoria automatici", status: "done" },
      { name: "Recensioni post-servizio", status: "done" },
    ],
  },
  {
    icon: ShoppingBag,
    title: "E-Commerce & Wallet",
    features: [
      { name: "Shop prodotti beauty", status: "done" },
      { name: "Checkout con Stripe", status: "done" },
      { name: "Wallet e transazioni", status: "done" },
      { name: "QRCoin (moneta virtuale)", status: "done" },
      { name: "Rateizzazione acquisti", status: "done" },
      { name: "Storico acquisti e ricevute", status: "done" },
      { name: "Marketplace servizi freelance", status: "done" },
      { name: "Aste prodotti", status: "done" },
      { name: "Offerte e promozioni", status: "done" },
    ],
  },
  {
    icon: Sparkles,
    title: "AI & Assistente",
    features: [
      { name: "Stella AI — assistente vocale", status: "done" },
      { name: "Wake word 'Stella'", status: "done" },
      { name: "Comandi vocali navigazione", status: "done" },
      { name: "AI Look Generator", status: "done" },
      { name: "AI Smart Match professionisti", status: "done" },
      { name: "Chatbot integrato", status: "done" },
      { name: "Suggerimenti crescita AI", status: "done" },
    ],
  },
  {
    icon: Radio,
    title: "Live & Intrattenimento",
    features: [
      { name: "Live Streaming con chat e reazioni", status: "done" },
      { name: "Go Live (trasmissione)", status: "done" },
      { name: "Live Battle", status: "done" },
      { name: "Radio & Music Player", status: "done" },
      { name: "Quiz Live", status: "done" },
      { name: "Talent Game", status: "done" },
      { name: "WebRTC reale per streaming", status: "partial" },
    ],
  },
  {
    icon: Trophy,
    title: "Gamification",
    features: [
      { name: "Sfide e classifiche", status: "done" },
      { name: "Spin & Win", status: "done" },
      { name: "Leaderboard globale", status: "done" },
      { name: "Missioni giornaliere", status: "done" },
      { name: "Programma referral", status: "done" },
      { name: "Programma affiliati", status: "done" },
    ],
  },
  {
    icon: Briefcase,
    title: "Business & HR",
    features: [
      { name: "Dashboard business con analytics", status: "done" },
      { name: "Gestione team e turni", status: "done" },
      { name: "Annunci di lavoro (HR)", status: "done" },
      { name: "Dashboard professionista", status: "done" },
      { name: "Boost profilo", status: "done" },
      { name: "Subscription / abbonamenti", status: "done" },
    ],
  },
  {
    icon: BarChart2,
    title: "Analytics & Admin",
    features: [
      { name: "Dashboard analytics avanzata", status: "done" },
      { name: "Pannello admin (utenti, report)", status: "done" },
      { name: "Debug panel", status: "done" },
      { name: "Tracciamento pagine / azioni", status: "done" },
      { name: "Moderazione contenuti", status: "partial" },
    ],
  },
  {
    icon: Smartphone,
    title: "App & Infrastruttura",
    features: [
      { name: "PWA installabile", status: "done" },
      { name: "Splash screen", status: "done" },
      { name: "Tema Dark / Light", status: "done" },
      { name: "Build Android (AAB/Play Store)", status: "done" },
      { name: "Deploy GitHub Pages (CI/CD)", status: "done" },
      { name: "Notifiche push (Service Worker)", status: "done" },
      { name: "Index redirect → Home (no placeholder)", status: "done" },
      { name: "Pagina Stato App (/app-status)", status: "done" },
      { name: "Ottimizzazione immagini / lazy load", status: "partial" },
      { name: "Caching e performance avanzata", status: "planned" },
      { name: "Build iOS (App Store)", status: "planned" },
    ],
  },
];

const countByStatus = (cats: FeatureCategory[]) => {
  let done = 0, partial = 0, planned = 0;
  cats.forEach((c) => c.features.forEach((f) => {
    if (f.status === "done") done++;
    else if (f.status === "partial") partial++;
    else planned++;
  }));
  return { done, partial, planned, total: done + partial + planned };
};

export default function AppStatusPage() {
  const navigate = useNavigate();
  const { done, partial, planned, total } = countByStatus(categories);
  const completionPct = Math.round((done / total) * 100);

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-5 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-primary" />
        </button>
        <div>
          <h1 className="text-lg font-display font-bold leading-none">Stato dell'App</h1>
          <p className="text-[10px] text-muted-foreground mt-0.5">STYLE v1.0.0</p>
        </div>
      </header>

      <div className="px-5 py-6 space-y-6">
        {/* Overall progress */}
        <section className="rounded-2xl bg-card border border-border/50 p-5 space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold text-primary uppercase tracking-widest">Progresso totale</p>
              <p className="text-4xl font-bold mt-1">{completionPct}%</p>
            </div>
            <Zap className="w-10 h-10 text-primary/20" />
          </div>

          {/* progress bar */}
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-700"
              style={{ width: `${completionPct}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-green-500/10 p-3 text-center">
              <p className="text-xl font-bold text-green-500">{done}</p>
              <p className="text-[10px] text-green-500 font-medium">Completati</p>
            </div>
            <div className="rounded-xl bg-amber-500/10 p-3 text-center">
              <p className="text-xl font-bold text-amber-500">{partial}</p>
              <p className="text-[10px] text-amber-500 font-medium">In corso</p>
            </div>
            <div className="rounded-xl bg-muted p-3 text-center">
              <p className="text-xl font-bold text-muted-foreground">{planned}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Pianificati</p>
            </div>
          </div>
        </section>

        {/* Feature categories */}
        {categories.map((cat) => {
          const catDone = cat.features.filter((f) => f.status === "done").length;
          const catTotal = cat.features.length;
          const catPct = Math.round((catDone / catTotal) * 100);
          const CatIcon = cat.icon;

          return (
            <section key={cat.title} className="rounded-2xl bg-card border border-border/50 overflow-hidden">
              {/* category header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CatIcon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-none">{cat.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{catDone}/{catTotal} completati</p>
                </div>
                <span className={`text-xs font-bold ${catPct === 100 ? "text-green-500" : catPct >= 60 ? "text-amber-500" : "text-muted-foreground"}`}>
                  {catPct}%
                </span>
              </div>

              {/* feature list */}
              <div className="divide-y divide-border/30">
                {cat.features.map((feature) => {
                  const StatusIcon = STATUS_ICONS[feature.status];
                  return (
                    <div key={feature.name} className="flex items-center gap-3 px-4 py-2.5">
                      <StatusIcon className={`w-4 h-4 flex-shrink-0 ${STATUS_COLORS[feature.status]}`} />
                      <span className="flex-1 text-sm">{feature.name}</span>
                      <span className={`text-[10px] font-medium ${STATUS_COLORS[feature.status]}`}>
                        {STATUS_LABELS[feature.status]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        <p className="text-center text-[10px] text-muted-foreground pb-4">
          Aggiornato al 14 marzo 2026 · STYLE v1.0.0
        </p>
      </div>
    </MobileLayout>
  );
}
