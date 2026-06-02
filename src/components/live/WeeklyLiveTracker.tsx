import { useState, useEffect } from "react";
import { Flame, Check, Coins } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQRCoinRewards } from "@/hooks/useQRCoinRewards";

const WEEKLY_GOAL = 5;
const MILESTONE_REWARD = 10;

interface WeeklyLiveProfile {
  weekly_live_count?: number;
  weekly_live_claimed?: boolean;
}

export default function WeeklyLiveTracker() {
  const { profile } = useAuth();
  const { awardCoins } = useQRCoinRewards();
  const typedProfile = profile as WeeklyLiveProfile | null;
  const [liveCount, setLiveCount] = useState<number>(typedProfile?.weekly_live_count ?? 0);
  const [claimed, setClaimed] = useState<boolean>(typedProfile?.weekly_live_claimed ?? false);

  useEffect(() => {
    setLiveCount(typedProfile?.weekly_live_count ?? 0);
    setClaimed(typedProfile?.weekly_live_claimed ?? false);
  }, [typedProfile?.weekly_live_count, typedProfile?.weekly_live_claimed]);

  const claimReward = () => {
    if (liveCount >= WEEKLY_GOAL && !claimed) {
      awardCoins("complete_mission");
      setClaimed(true);
    }
  };

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
            <p className="text-xs text-muted-foreground">Partecipa a {WEEKLY_GOAL} live</p>
          </div>
        </div>
        {completed && !claimed ? (
          <button
            type="button"
            onClick={claimReward}
            aria-label="Riscatta ricompensa settimanale"
            className="px-3 py-1.5 rounded-full gradient-gold text-gold-foreground text-xs font-bold flex items-center gap-1"
          >
            <Coins className="w-3 h-3" /> +{MILESTONE_REWARD} QRC
          </button>
        ) : completed && claimed ? (
          <span className="flex items-center gap-1 text-xs font-bold text-accent">
            <Check className="w-3.5 h-3.5" /> Riscattato
          </span>
        ) : null}
      </div>

      <div className="flex gap-2">
        {Array.from({ length: WEEKLY_GOAL }).map((_, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-1">
            <div className={`w-full h-2 rounded-full transition-all ${index < liveCount ? "gradient-primary" : "bg-muted"}`} />
            <span className="text-xs text-muted-foreground">{index + 1}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        {liveCount}/{WEEKLY_GOAL} live completate questa settimana
      </p>
    </div>
  );
}
