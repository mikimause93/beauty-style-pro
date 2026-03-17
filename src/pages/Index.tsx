import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Scissors,
  Sparkles,
  Video,
  ShoppingBag,
  MapPin,
  Coins,
  Star,
  Users,
  Calendar,
  Wand2,
  Radio,
  Trophy,
  ChevronRight,
  Heart,
  Shield,
  Zap,
} from "lucide-react";
import logo from "@/assets/logo.png";

const features = [
  { icon: Scissors, label: "Prenota Stilisti", desc: "Trova e prenota i migliori professionisti della bellezza vicino a te." },
  { icon: Sparkles, label: "Stella AI", desc: "Il tuo assistente vocale personale per consigli di stile su misura." },
  { icon: Wand2, label: "AI Look Generator", desc: "Scopri il tuo look ideale grazie all'intelligenza artificiale." },
  { icon: Video, label: "Live Streaming", desc: "Guarda tutorial dal vivo, segui i tuoi stilisti preferiti in tempo reale." },
  { icon: ShoppingBag, label: "Shop & Prodotti", desc: "Acquista prodotti professionali direttamente nell'app." },
  { icon: MapPin, label: "Mappa Saloni", desc: "Trova saloni ed estetiste nella tua zona con ricerca AI." },
  { icon: Coins, label: "QR Coins & Premi", desc: "Guadagna monete virtuali e sblocca premi esclusivi ogni giorno." },
  { icon: Radio, label: "Radio Beauty", desc: "Musica e podcast di bellezza per ispirarsi mentre ti prepari." },
  { icon: Trophy, label: "Sfide & Leaderboard", desc: "Partecipa a challenge e scala la classifica dei creator." },
];

const stats = [
  { value: "50K+", label: "Utenti attivi" },
  { value: "3K+", label: "Professionisti" },
  { value: "500+", label: "Saloni partner" },
  { value: "4.9★", label: "Valutazione media" },
];

const steps = [
  { icon: Users, title: "Crea il tuo profilo", desc: "Registrati come cliente, professionista o azienda in pochi secondi." },
  { icon: Calendar, title: "Prenota o Esplora", desc: "Sfoglia il feed, scopri stilisti e prenota il tuo appuntamento." },
  { icon: Heart, title: "Vivi l'esperienza", desc: "Goditi la bellezza, guadagna premi e condividi la tua trasformazione." },
];

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect authenticated users directly to the home feed
  useEffect(() => {
    if (!loading && user) {
      navigate("/home", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-10 h-10 rounded-full gradient-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav className="glass sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-5 py-3">
          <img src={logo} alt="Style" className="h-8 w-auto" />
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/auth")}
              className="text-sm font-semibold text-foreground/70 hover:text-primary transition-colors"
            >
              Accedi
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="px-4 py-2 rounded-full gradient-primary text-white text-sm font-semibold shadow-glow"
            >
              Iscriviti gratis
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center text-center px-5 pt-20 pb-16 overflow-hidden">
        {/* decorative blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full gradient-primary opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full gradient-gold opacity-10 blur-3xl pointer-events-none" />

        <span className="mb-4 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full gradient-gold text-black text-xs font-bold shadow-glow-gold">
          <Zap className="w-3.5 h-3.5" /> La piattaforma beauty n°1 in Italia
        </span>
        <h1 className="font-display text-5xl sm:text-6xl font-bold leading-tight mb-5">
          La bellezza,{" "}
          <span className="text-gradient-luxury">reinventata</span>
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground mb-8 leading-relaxed">
          Prenota stilisti, segui live beauty, scopri il tuo stile con l'AI e guadagna premi ogni giorno.
          Tutto in un'unica app.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <button
            onClick={() => navigate("/auth")}
            className="px-8 py-3.5 rounded-full gradient-primary text-white font-bold text-base shadow-glow flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            Inizia ora <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate("/explore")}
            className="px-8 py-3.5 rounded-full border border-primary/30 text-primary font-semibold text-base hover:bg-primary/5 transition-colors"
          >
            Esplora l'app
          </button>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-5 py-10">
        <div className="glass-light rounded-3xl border border-border/30 grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border/20">
          {stats.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center py-6 px-4">
              <span className="text-3xl font-display font-bold text-gradient-luxury">{value}</span>
              <span className="text-xs text-muted-foreground mt-1">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-5 py-14">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">
            Tutto quello che ami,{" "}
            <span className="text-gradient-primary">in un posto solo</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Dalla prenotazione al pagamento, dal live streaming alla gamification: Style ha tutto.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="rounded-2xl border border-border/30 bg-card/60 backdrop-blur p-5 hover:shadow-glow transition-shadow duration-300 group"
            >
              <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center mb-4 shadow-glow group-hover:scale-105 transition-transform">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-base mb-1">{label}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-5 py-14">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl font-bold mb-3">Come funziona</h2>
          <p className="text-muted-foreground">Tre semplici passi per iniziare.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-6">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="flex-1 flex flex-col items-center text-center gap-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl gradient-luxury flex items-center justify-center shadow-glow">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full gradient-gold flex items-center justify-center text-[10px] font-bold text-black">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-semibold text-base">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRUST ─────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-5 py-10">
        <div className="rounded-3xl gradient-primary p-px shadow-glow">
          <div className="rounded-3xl bg-background/90 backdrop-blur px-8 py-10 flex flex-col sm:flex-row items-center gap-8">
            <div className="flex-1 text-center sm:text-left">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">
                Sicuro, veloce e pensato per te
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Pagamenti protetti con Stripe, prenotazioni confermate in tempo reale,
                dati personali al sicuro. Unisciti a migliaia di utenti soddisfatti.
              </p>
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start text-sm text-muted-foreground">
                {["Pagamenti sicuri", "Assistenza 24/7", "Privacy garantita"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-primary" /> {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => navigate("/auth")}
                className="px-8 py-3.5 rounded-full gradient-primary text-white font-bold text-base shadow-glow flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                Registrati ora <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="border-t border-border/30 mt-10 py-8 px-5 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-3">
          <img src={logo} alt="Style" className="h-5 w-auto opacity-70" />
          <span className="font-display font-bold text-sm text-gradient-luxury">Style</span>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mb-3">
          <button onClick={() => navigate("/terms")} className="hover:text-primary transition-colors">Termini</button>
          <button onClick={() => navigate("/privacy")} className="hover:text-primary transition-colors">Privacy</button>
          <button onClick={() => navigate("/auth")} className="hover:text-primary transition-colors">Accedi</button>
        </div>
        <p>© {new Date().getFullYear()} Style · Beauty & Fashion Platform · Italia</p>
      </footer>
    </div>
  );
}
