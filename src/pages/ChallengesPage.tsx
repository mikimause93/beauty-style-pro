import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Trophy, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import beauty2 from "@/assets/beauty-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";

const fallbackChallenges = [
  { id: "1", title: "Consumo Smart", description: "5 prenotazioni questo mese", progress: 3, target_value: 5, reward_qr_coin: 50, icon: "target", featured: true },
  { id: "2", title: "Social Star", description: "Condividi 10 post", progress: 7, target_value: 10, reward_qr_coin: 30, icon: "star", featured: false },
  { id: "3", title: "Invita Amici", description: "Invita 3 amici", progress: 1, target_value: 3, reward_qr_coin: 100, icon: "users", featured: false },
  { id: "4", title: "Spettatore Live", description: "Guarda 5 live", progress: 4, target_value: 5, reward_qr_coin: 25, icon: "video", featured: false },
  { id: "5", title: "Recensore", description: "Lascia 3 recensioni", progress: 0, target_value: 3, reward_qr_coin: 40, icon: "edit", featured: false },
];

export default function ChallengesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"challenges" | "leaderboard">("challenges");
  const [challenges, setChallenges] = useState(fallbackChallenges);

  useEffect(() => {
    loadChallenges();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadChallenges = async () => {
    const { data } = await supabase
      .from("challenges")
      .select("*")
      .eq("active", true)
      .order("featured", { ascending: false });

    if (data && data.length > 0) {
      // Load user participations if logged in
      let participationMap = new Map();
      if (user) {
        const { data: parts } = await supabase
          .from("challenge_participations")
          .select("*")
          .eq("user_id", user.id);
        if (parts) {
          participationMap = new Map(parts.map(p => [p.challenge_id, p]));
        }
      }

      setChallenges(data.map(c => ({
        ...c,
        progress: participationMap.get(c.id)?.progress || 0,
      })));
    }
  };

  const joinChallenge = async (challengeId: string) => {
    if (!user) { navigate("/auth"); return; }
    await supabase.from("challenge_participations").insert({
      challenge_id: challengeId,
      user_id: user.id,
    });
    loadChallenges();
  };

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold">Sfide & Classifica</h1>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={() => setActiveTab("challenges")}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold ${
              activeTab === "challenges" ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
            Sfide
          </button>
          <button onClick={() => { setActiveTab("leaderboard"); navigate("/leaderboard"); }}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold ${
              activeTab === "leaderboard" ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
            Classifica
          </button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        <div className="space-y-3 fade-in">
          {/* Featured */}
          {challenges.filter(c => c.featured).map(ch => (
            <div key={ch.id} className="rounded-2xl gradient-card border border-primary/20 p-4 shadow-card">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-full gradient-primary text-primary-foreground text-xs font-bold">In Evidenza</span>
                <span className="text-2xl">{ch.icon}</span>
              </div>
              <p className="font-display font-bold">{ch.title}</p>
              <p className="text-xs text-muted-foreground mb-3">{ch.description}</p>
              <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full gradient-primary transition-all" style={{ width: `${(ch.progress / ch.target_value) * 100}%` }} />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">{ch.progress}/{ch.target_value}</span>
                <span className="text-xs text-gold font-semibold">+{ch.reward_qr_coin} QRC</span>
              </div>
            </div>
          ))}

          {/* Others */}
          {challenges.filter(c => !c.featured).map(ch => (
            <div key={ch.id} className="rounded-xl bg-card p-4 shadow-card">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{ch.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{ch.title}</p>
                  <p className="text-xs text-muted-foreground">{ch.description}</p>
                  <div className="mt-2 w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full gradient-primary transition-all" style={{ width: `${(ch.progress / ch.target_value) * 100}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{ch.progress}/{ch.target_value}</span>
                    <span className="text-xs text-gold font-semibold">+{ch.reward_qr_coin} QRC</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Before & After */}
          <div className="rounded-2xl overflow-hidden bg-card shadow-card">
            <div className="flex">
              <div className="w-1/2 aspect-square relative">
                <img src={beauty3} alt="Prima" className="w-full h-full object-cover" />
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full glass text-xs font-bold">Prima</div>
              </div>
              <div className="w-1/2 aspect-square relative">
                <img src={beauty2} alt="Dopo" className="w-full h-full object-cover" />
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full glass text-xs font-bold">Dopo</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
