import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Coins, Trophy, Star, Users, Crown, Heart, Flame, Sparkles, Play, Eye, Music, Video, Mic, Share2, ChevronRight, Award, Zap, Flag } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/layout/MobileLayout";
import { toast } from "sonner";
import beauty1 from "@/assets/beauty-1.jpg";
import beauty2 from "@/assets/beauty-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";

interface Contestant {
  id: string;
  name: string;
  avatar: string;
  category: string;
  score: number;
  votes: number;
  isLive: boolean;
  thumbnail: string;
  description: string;
}

const fallbackContestants: Contestant[] = [
  { id: "c1", name: "Martina Rossi", avatar: stylist2, category: "Hairstyling", score: 840, votes: 234, isLive: true, thumbnail: beauty1, description: "Balayage artistico in diretta" },
  { id: "c2", name: "Marco Barberi", avatar: beauty1, category: "Barber Art", score: 720, votes: 189, isLive: true, thumbnail: beauty2, description: "Fade design creativo" },
  { id: "c3", name: "Sylvie Beauty", avatar: stylist1, category: "Makeup", score: 690, votes: 156, isLive: false, thumbnail: beauty3, description: "Smokey eyes tutorial" },
  { id: "c4", name: "Luca Styling", avatar: beauty2, category: "Nail Art", score: 560, votes: 98, isLive: false, thumbnail: stylist1, description: "Design geometrico avanzato" },
  { id: "c5", name: "Elena Nails", avatar: beauty3, category: "Nail Art", score: 480, votes: 76, isLive: false, thumbnail: stylist2, description: "Chrome effect trendy" },
];

const categories = ["Tutti", "Hairstyling", "Makeup", "Barber Art", "Nail Art"];

const weeklyPrizes = [
  { rank: 1, prize: "5.000 QRC + Badge Gold + Weekend SPA", icon: Crown },
  { rank: 2, prize: "2.000 QRC + Badge Silver + Sconto 50%", icon: Award },
  { rank: 3, prize: "1.000 QRC + Badge Bronze", icon: Trophy },
];

type ViewState = "list" | "watch";

export default function TalentGamePage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [viewState, setViewState] = useState<ViewState>("list");
  const [activeCategory, setActiveCategory] = useState("Tutti");
  const [contestants, setContestants] = useState<Contestant[]>(fallbackContestants);
  const [selectedContestant, setSelectedContestant] = useState<Contestant | null>(null);
  const [hasVoted, setHasVoted] = useState<string[]>([]);
  const [voteAnimation, setVoteAnimation] = useState(false);

  const filtered = activeCategory === "Tutti" ? contestants : contestants.filter(c => c.category === activeCategory);

  const handleVote = (contestant: Contestant) => {
    if (!user) { toast.error("Accedi per votare"); navigate("/auth"); return; }
    if (hasVoted.includes(contestant.id)) { toast.error("Hai già votato per questo artista!"); return; }

    setHasVoted(prev => [...prev, contestant.id]);
    setContestants(prev => prev.map(c =>
      c.id === contestant.id ? { ...c, votes: c.votes + 1, score: c.score + 10 } : c
    ));
    setVoteAnimation(true);
    setTimeout(() => setVoteAnimation(false), 600);
    toast.success(`❤️ Voto per ${contestant.name}! +5 QRC`);
  };

  const handleSuperVote = (contestant: Contestant, amount: number) => {
    if (!user) { toast.error("Accedi per votare"); navigate("/auth"); return; }
    const balance = profile?.qr_coins || 0;
    if (balance < amount) { toast.error("QRCoin insufficienti"); return; }

    setContestants(prev => prev.map(c =>
      c.id === contestant.id ? { ...c, votes: c.votes + amount, score: c.score + amount * 10 } : c
    ));
    toast.success(`🔥 Super voto x${amount} per ${contestant.name}!`);
  };

  const watchContestant = (contestant: Contestant) => {
    setSelectedContestant(contestant);
    setViewState("watch");
  };

  // ===== WATCH VIEW =====
  if (viewState === "watch" && selectedContestant) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-background">
          {/* Video Area */}
          <div className="relative aspect-[9/16] max-h-[60vh] bg-card">
            <img src={selectedContestant.thumbnail} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />

            {/* Top Bar */}
            <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between">
              <button onClick={() => setViewState("list")} className="w-10 h-10 rounded-full glass flex items-center justify-center">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                {selectedContestant.isLive && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-destructive-foreground animate-pulse" /> LIVE
                  </span>
                )}
                <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-full glass text-xs font-semibold">
                  <Eye className="w-3 h-3" /> {selectedContestant.votes}
                </span>
              </div>
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-0 inset-x-0 p-4">
              <div className="flex items-center gap-3 mb-3">
                <img src={selectedContestant.avatar} alt="" className="w-12 h-12 rounded-full border-2 border-primary object-cover" />
                <div>
                  <p className="font-bold text-sm">{selectedContestant.name}</p>
                  <p className="text-[11px] text-muted-foreground">{selectedContestant.category}</p>
                </div>
              </div>
              <p className="text-sm mb-3">{selectedContestant.description}</p>
            </div>
          </div>

          {/* Voting Section */}
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-accent" />
                <span className="text-sm font-bold">Punteggio: {selectedContestant.score}</span>
              </div>
              <span className="text-xs text-muted-foreground">{selectedContestant.votes} voti</span>
            </div>

            {/* Vote Button */}
            <button onClick={() => handleVote(selectedContestant)}
              disabled={hasVoted.includes(selectedContestant.id)}
              className={`w-full py-4 rounded-2xl text-lg font-bold transition-all ${
                hasVoted.includes(selectedContestant.id)
                  ? "bg-muted text-muted-foreground"
                  : "gradient-primary text-primary-foreground shadow-glow hover:scale-[1.02] active:scale-[0.98]"
              }`}>
              {hasVoted.includes(selectedContestant.id) ? "✓ Votato" : "❤️ Vota"}
            </button>

            {/* Super Votes */}
            <div className="grid grid-cols-3 gap-2">
              {[5, 10, 25].map(amount => (
                <button key={amount} onClick={() => handleSuperVote(selectedContestant, amount)}
                  className="py-3 rounded-xl glass border border-primary/20 text-center hover:bg-primary/10 transition-all">
                  <p className="text-sm font-bold text-primary">x{amount}</p>
                  <p className="text-[10px] text-muted-foreground">{amount * 10} QRC</p>
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={() => { navigator.share?.({ title: `Vota ${selectedContestant.name} su Style!`, url: window.location.href }); }}
                className="flex-1 py-3 rounded-xl glass text-sm font-semibold flex items-center justify-center gap-2">
                <Share2 className="w-4 h-4" /> Condividi
              </button>
              <button onClick={() => navigate("/chat")}
                className="flex-1 py-3 rounded-xl glass text-sm font-semibold flex items-center justify-center gap-2">
                <Mic className="w-4 h-4" /> Messaggio
              </button>
            </div>
          </div>
        </div>
      </MobileLayout>
    );
  }

  // ===== LIST VIEW =====
  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 space-y-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-display font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Talent Game
            </h1>
            <p className="text-[11px] text-muted-foreground">Vota i migliori talenti Beauty</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full gradient-gold">
            <Coins className="w-4 h-4 text-gold-foreground" />
            <span className="text-sm font-bold text-gold-foreground">{profile?.qr_coins?.toLocaleString() || "0"}</span>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Weekly Prizes */}
        <div className="rounded-2xl gradient-card border border-primary/20 p-4">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Crown className="w-4 h-4 text-accent" /> Premi Settimanali
          </h3>
          {weeklyPrizes.map(p => (
            <div key={p.rank} className={`flex items-center gap-3 py-2 ${p.rank < 3 ? "border-b border-border/30" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                p.rank === 1 ? "gradient-gold" : p.rank === 2 ? "bg-muted" : "bg-accent/20"
              }`}>
                <p.icon className={`w-4 h-4 ${p.rank === 1 ? "text-gold-foreground" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold">{p.rank}° Posto</p>
                <p className="text-[10px] text-muted-foreground">{p.prize}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Live Contestants */}
        {filtered.filter(c => c.isLive).length > 0 && (
          <div>
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" /> In Diretta Ora
            </h3>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {filtered.filter(c => c.isLive).map(c => (
                <button key={c.id} onClick={() => watchContestant(c)}
                  className="min-w-[160px] rounded-2xl bg-card border border-border/50 overflow-hidden shrink-0 text-left hover:border-primary/30 transition-all">
                  <div className="relative aspect-[4/3]">
                    <img src={c.thumbnail} alt="" className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive-foreground animate-pulse" /> LIVE
                    </div>
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full glass text-[9px]">
                      <Eye className="w-3 h-3" /> {c.votes}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold truncate">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground">{c.category}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* All Contestants */}
        <div>
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Classifica Talenti
          </h3>
          {filtered.sort((a, b) => b.score - a.score).map((c, i) => (
            <button key={c.id} onClick={() => watchContestant(c)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-all mb-2 text-left">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                i === 0 ? "gradient-gold text-gold-foreground" :
                i === 1 ? "bg-muted text-foreground" :
                i === 2 ? "bg-accent/20 text-accent" :
                "bg-card text-muted-foreground"
              }`}>
                {i + 1}
              </div>
              <img src={c.avatar} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{c.name}</p>
                  {c.isLive && <span className="w-2 h-2 rounded-full bg-destructive animate-pulse shrink-0" />}
                </div>
                <p className="text-[11px] text-muted-foreground">{c.category}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-primary font-semibold flex items-center gap-0.5">
                    <Trophy className="w-3 h-3" /> {c.score}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Heart className="w-3 h-3" /> {c.votes}
                  </span>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleVote(c); }}
                disabled={hasVoted.includes(c.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 ${
                  hasVoted.includes(c.id) ? "bg-muted text-muted-foreground" : "gradient-primary text-primary-foreground"
                }`}>
                {hasVoted.includes(c.id) ? "✓" : "❤️ Vota"}
              </button>
            </button>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-2xl glass border border-primary/20 p-4 flex items-center gap-3">
          <Video className="w-8 h-8 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Vuoi partecipare?</p>
            <p className="text-[11px] text-muted-foreground">Mostra il tuo talento e vinci premi!</p>
          </div>
          <button onClick={() => navigate("/go-live")} className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-xs font-bold">
            Iscriviti
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}
