import { useState, useEffect } from "react";
import { Flame, Check, Coins } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQRCoinRewards } from "@/hooks/useQRCoinRewards";
import safeStorage from "@/lib/safeStorage";

const WEEKLY_GOAL = 5;
const MILESTONE_REWARD = 10;

export default function WeeklyLiveTracker() {
  const { profile } = useAuth();
  const { awardCoins } = useQRCoinRewards();
  // In a real app, fetch from DB. Here we use localStorage for demo.
  const [liveCount, setLiveCount] = useState(0);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    const key = `weekly_live_${new Date().toISOString().slice(0, 10).replace(/-\d{2}$/, '')}`;
    const data = safeStorage.getJSON<{ count: number; claimed: boolean }>(key, { count: 0, claimed: false });
    setLiveCount(data.count || 0);
    setClaimed(data.claimed || false);
  }, []);

  const claimReward = () => {
    if (liveCount >= WEEKLY_GOAL && !claimed) {
      awardCoins("complete_mission");
      setClaimed(true);
      const key = `weekly_live_${new Date().toISOString().slice(0, 10).replace(/-\d{2}$/, '')}`;
      safeStorage.setJSON(key, { count: liveCount, claimed: true });
    }
  };

  const pct = Math.min(100, (liveCount / WEEKLY_GOAL) * 100);
  const completed = liveCount >= WEEKLY_GOAL;

  return (
    <div className="glass rounded-2xl p-4 border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
            <Flame className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="text-xs font-bold">Sfida Settimanale</p>
            <p className="text-[10px] text-muted-foreground">Partecipa a {WEEKLY_GOAL} live</p>
          </div>
        </div>
        {completed && !claimed ? (
          <button onClick={claimReward} className="px-3 py-1.5 rounded-full gradient-gold text-gold-foreground text-xs font-bold flex items-center gap-1">
            <Coins className="w-3 h-3" /> +{MILESTONE_REWARD} QRC
          </button>
        ) : completed && claimed ? (
          <span className="flex items-center gap-1 text-xs font-bold text-accent">
            <Check className="w-3.5 h-3.5" /> Riscattato
          </span>
        ) : null}
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {Array.from({ length: WEEKLY_GOAL }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className={`w-full h-2 rounded-full transition-all ${
              i < liveCount ? "gradient-primary" : "bg-muted"
            }`} />
            <span className="text-[8px] text-muted-foreground">{i + 1}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-2 text-center">
        {liveCount}/{WEEKLY_GOAL} live completate questa settimana
      </p>
    </div>
  );
}
