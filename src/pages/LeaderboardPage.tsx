import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Zap, Crown, Medal, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";
import beauty1 from "@/assets/beauty-1.jpg";
import beauty2 from "@/assets/beauty-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";

const tabs = ["Earnings", "Bookings", "Reviews", "Followers"];

const leaderboardData = [
  { rank: 1, name: "Pru Stylers", subtitle: "Fantasze / Billefiltion", score: 3100, avatar: stylist1, badge: "🥇" },
  { rank: 2, name: "Stizzi Saies", subtitle: "Saloparme / Idealistic", score: 2800, avatar: beauty2, badge: "🥈" },
  { rank: 3, name: "Enny Lomi", subtitle: "Neoslier / Idest / Melliorinze", score: 2300, avatar: beauty1, badge: "🥉" },
  { rank: 4, name: "True Font Score", subtitle: "Score Beauty / Mascolini", score: 2100, avatar: stylist2, badge: "" },
  { rank: 5, name: "Beauty Star", subtitle: "Stilista / Milano", score: 1900, avatar: beauty3, badge: "" },
  { rank: 6, name: "Hair Master", subtitle: "Colorist / Roma", score: 1750, avatar: stylist1, badge: "" },
  { rank: 7, name: "Glow Pro", subtitle: "Makeup / Torino", score: 1600, avatar: beauty2, badge: "" },
];

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Earnings");

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold">Top Stylers</h1>
          <div className="ml-auto w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4">
        {/* Top 3 Podium */}
        <div className="flex items-end justify-center gap-3 mb-6 h-44">
          {/* 2nd place */}
          <div className="flex flex-col items-center w-24">
            <div className="relative">
              <img src={leaderboardData[1].avatar} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-muted" />
              <span className="absolute -bottom-1 -right-1 text-lg">🥈</span>
            </div>
            <p className="text-xs font-semibold mt-2 truncate w-full text-center">{leaderboardData[1].name}</p>
            <div className="flex items-center gap-0.5 mt-1">
              <Zap className="w-3 h-3 text-gold" />
              <span className="text-xs font-bold">{leaderboardData[1].score.toLocaleString()}</span>
            </div>
            <div className="w-full h-16 rounded-t-xl bg-muted mt-2" />
          </div>

          {/* 1st place */}
          <div className="flex flex-col items-center w-24">
            <Crown className="w-6 h-6 text-gold mb-1" />
            <div className="relative">
              <img src={leaderboardData[0].avatar} alt="" className="w-20 h-20 rounded-full object-cover border-3 border-gold" />
              <span className="absolute -bottom-1 -right-1 text-lg">🥇</span>
            </div>
            <p className="text-xs font-semibold mt-2 truncate w-full text-center">{leaderboardData[0].name}</p>
            <div className="flex items-center gap-0.5 mt-1">
              <Zap className="w-3 h-3 text-gold" />
              <span className="text-xs font-bold text-gold">{leaderboardData[0].score.toLocaleString()}</span>
            </div>
            <div className="w-full h-24 rounded-t-xl gradient-gold mt-2" />
          </div>

          {/* 3rd place */}
          <div className="flex flex-col items-center w-24">
            <div className="relative">
              <img src={leaderboardData[2].avatar} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-muted" />
              <span className="absolute -bottom-1 -right-1 text-lg">🥉</span>
            </div>
            <p className="text-xs font-semibold mt-2 truncate w-full text-center">{leaderboardData[2].name}</p>
            <div className="flex items-center gap-0.5 mt-1">
              <Zap className="w-3 h-3 text-gold" />
              <span className="text-xs font-bold">{leaderboardData[2].score.toLocaleString()}</span>
            </div>
            <div className="w-full h-12 rounded-t-xl bg-muted mt-2" />
          </div>
        </div>

        {/* Rest of leaderboard */}
        <div className="space-y-2">
          {leaderboardData.slice(3).map(entry => (
            <div key={entry.rank} className="flex items-center gap-3 p-3 rounded-xl bg-card shadow-card">
              <span className="text-sm font-bold text-muted-foreground w-6 text-center">#{entry.rank}</span>
              <img src={entry.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{entry.name}</p>
                <p className="text-[10px] text-muted-foreground">{entry.subtitle}</p>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-gold" />
                <span className="text-sm font-bold">{entry.score.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Your position */}
        <div className="mt-4 rounded-xl gradient-card border border-primary/20 p-4 shadow-card">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-primary">#12</span>
            <div className="flex-1">
              <p className="text-sm font-semibold">La tua posizione</p>
              <p className="text-xs text-muted-foreground">Continua a salire! 🚀</p>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-gold" />
              <span className="text-sm font-bold">1,250</span>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
