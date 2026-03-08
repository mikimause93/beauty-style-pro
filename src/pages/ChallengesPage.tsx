import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Trophy, Zap, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import beauty1 from "@/assets/beauty-1.jpg";
import beauty2 from "@/assets/beauty-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";

const challenges = [
  { id: 1, title: "Consumo Smart", desc: "5 bookings questo mese", progress: 3, target: 5, reward: 50, icon: "🎯", featured: true },
  { id: 2, title: "Social Star", desc: "Condividi 10 post", progress: 7, target: 10, reward: 30, icon: "⭐", featured: false },
  { id: 3, title: "Referral Master", desc: "Invita 3 amici", progress: 1, target: 3, reward: 100, icon: "👥", featured: false },
  { id: 4, title: "Stream Watcher", desc: "Guarda 5 live", progress: 4, target: 5, reward: 25, icon: "📹", featured: false },
  { id: 5, title: "Beauty Reviewer", desc: "Lascia 3 recensioni", progress: 0, target: 3, reward: 40, icon: "📝", featured: false },
];

const leaderboard = [
  { rank: 1, name: "Beauty Masi", subtitle: "Superstars / Bellissimo!", score: 3100, avatar: stylist1, badge: "🥇" },
  { rank: 2, name: "Sar'y Glozy", subtitle: "Saloparme / Idealistic", score: 2800, avatar: beauty2, badge: "🥈" },
  { rank: 3, name: "Perfie Shew", subtitle: "Instanl Stylist / Hit Mascat", score: 2300, avatar: beauty1, badge: "🥉" },
  { rank: 4, name: "Mathe Maries", subtitle: "Learat beauty / Stylehair", score: 1900, avatar: stylist2, badge: "" },
  { rank: 5, name: "Surity Poulee", subtitle: "Masoni stylehaire / Moseiear", score: 1700, avatar: beauty3, badge: "" },
];

export default function ChallengesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"challenges" | "leaderboard">("challenges");

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold">Challenges & Leaderboard</h1>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setActiveTab("challenges")}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold ${
              activeTab === "challenges" ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            🎯 Challenges
          </button>
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold ${
              activeTab === "leaderboard" ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            🏆 Leaderboard
          </button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {activeTab === "challenges" && (
          <div className="space-y-3 fade-in">
            {/* Featured Challenge */}
            {challenges.filter(c => c.featured).map(ch => (
              <div key={ch.id} className="rounded-2xl gradient-card border border-primary/20 p-4 shadow-card">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full gradient-primary text-primary-foreground text-[10px] font-bold">Fav Product</span>
                  <span className="text-2xl">{ch.icon}</span>
                </div>
                <p className="font-display font-bold">{ch.title}</p>
                <p className="text-xs text-muted-foreground mb-3">{ch.desc}</p>
                <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full gradient-primary transition-all" style={{ width: `${(ch.progress / ch.target) * 100}%` }} />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">{ch.progress}/{ch.target}</span>
                  <span className="text-[10px] text-gold font-semibold">+{ch.reward} QRC</span>
                </div>
              </div>
            ))}

            {/* Other Challenges */}
            {challenges.filter(c => !c.featured).map(ch => (
              <div key={ch.id} className="rounded-xl bg-card p-4 shadow-card">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{ch.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{ch.title}</p>
                    <p className="text-xs text-muted-foreground">{ch.desc}</p>
                    <div className="mt-2 w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full gradient-primary transition-all" style={{ width: `${(ch.progress / ch.target) * 100}%` }} />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">{ch.progress}/{ch.target}</span>
                      <span className="text-[10px] text-gold font-semibold">+{ch.reward} QRC</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Before & After Section */}
            <div className="rounded-2xl overflow-hidden bg-card shadow-card">
              <div className="flex">
                <div className="w-1/2 aspect-square relative">
                  <img src={beauty3} alt="Before" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full glass text-[10px] font-bold">Before</div>
                </div>
                <div className="w-1/2 aspect-square relative">
                  <img src={beauty2} alt="After" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full glass text-[10px] font-bold">After</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="space-y-3 fade-in">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Top Users</h3>

            {/* Score tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {["Savings", "Score 00", "Spc 1000", "Facette"].map((tab, i) => (
                <button key={tab} className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                  i === 0 ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Leaderboard entries */}
            <div className="space-y-2">
              {leaderboard.map(entry => (
                <div key={entry.rank} className={`flex items-center gap-3 p-3 rounded-xl ${
                  entry.rank <= 3 ? "bg-card border border-gold/20" : "bg-card"
                } shadow-card`}>
                  <span className="text-lg w-8 text-center">{entry.badge || `#${entry.rank}`}</span>
                  <img src={entry.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{entry.name}</p>
                      {entry.rank <= 3 && <span className="text-primary">❤️</span>}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{entry.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-gold" />
                    <span className="text-sm font-bold">{entry.score.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* FH3 banner */}
            <div className="rounded-xl gradient-card border border-border p-4 text-center">
              <p className="text-sm font-bold text-gradient-gold">🏆 La tua posizione: #12</p>
              <p className="text-xs text-muted-foreground mt-1">Completa più sfide per salire in classifica!</p>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
