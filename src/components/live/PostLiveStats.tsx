import { Trophy, Users, MessageCircle, Coins, Heart, Clock, Target } from "lucide-react";

interface PostLiveStatsProps {
  stats: {
    totalViewers: number;
    peakViewers: number;
    totalComments: number;
    totalReactions: number;
    totalTips: number;
    qrCoinsDistributed: number;
    durationMinutes: number;
    interactionGoal: number;
    interactionsAchieved: number;
  };
  onClose: () => void;
}

export default function PostLiveStats({ stats, onClose }: PostLiveStatsProps) {
  const goalPct = stats.interactionGoal > 0
    ? Math.min(100, Math.round((stats.interactionsAchieved / stats.interactionGoal) * 100))
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-sm glass rounded-3xl p-6 slide-up space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-display font-bold">Live Terminata!</h2>
          <p className="text-sm text-muted-foreground">Ecco le statistiche della sessione</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<Users className="w-4 h-4" />} label="Spettatori" value={stats.totalViewers} sub={`Picco: ${stats.peakViewers}`} />
          <StatCard icon={<Clock className="w-4 h-4" />} label="Durata" value={`${stats.durationMinutes}m`} />
          <StatCard icon={<MessageCircle className="w-4 h-4" />} label="Commenti" value={stats.totalComments} />
          <StatCard icon={<Heart className="w-4 h-4" />} label="Reazioni" value={stats.totalReactions} />
          <StatCard icon={<Coins className="w-4 h-4 text-gold" />} label="QRC Distribuiti" value={stats.qrCoinsDistributed} highlight />
          <StatCard icon={<Coins className="w-4 h-4 text-gold" />} label="Tips Ricevuti" value={stats.totalTips} highlight />
        </div>

        {/* Interaction Goal */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-accent" /> Obiettivo Interazioni
            </span>
            <span className="text-xs font-bold text-primary">{goalPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full gradient-primary transition-all duration-1000"
              style={{ width: `${goalPct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.interactionsAchieved} / {stats.interactionGoal} interazioni
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-bold"
        >
          Chiudi
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, highlight }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? "border border-gold/30 bg-gold/5" : "bg-card border border-border"}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`text-lg font-bold ${highlight ? "text-gold" : ""}`}>{typeof value === "number" ? value.toLocaleString() : value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
