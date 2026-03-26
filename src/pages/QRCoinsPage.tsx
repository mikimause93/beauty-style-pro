import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Coins, ChevronRight, Clock, TrendingUp, TrendingDown, Sparkles, Video, Target, ShoppingBag, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { logError } from "@/lib/errorLogger";
import MobileLayout from "@/components/layout/MobileLayout";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

const quickActions = [
  { Icon: Coins, label: "Guadagna Coins", desc: "Guarda stream e guadagna", color: "gradient-gold", path: "/live" },
  { Icon: Target, label: "Sfide", desc: "Completa le sfide", color: "bg-success/20", path: "/challenges" },
  { Icon: ShoppingBag, label: "Spendi QRCoins", desc: "Shop e prenota servizi", color: "bg-primary/20", path: "/shop" },
  { Icon: Trophy, label: "Classifica", desc: "Vedi la classifica", color: "bg-secondary/20", path: "/leaderboard" },
];

export default function QRCoinsPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'earned' | 'spent'>('all');

  const qrCoins = profile?.qr_coins || 0;

  useEffect(() => {
    if (user) fetchTransactions();
    else setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchTransactions = async () => {
    try {
      const { data } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) {
        setTransactions(data.map(d => ({
          id: d.id,
          type: Number(d.amount) >= 0 ? "earn" : "spend",
          amount: Math.abs(Number(d.amount)),
          description: d.description || d.type || "Transazione",
          created_at: d.created_at,
        })));
      }
    } catch (e) {
      logError({ error_type: "database", message: "Error fetching QR transactions", metadata: { error: String(e) } });
    }
    setLoading(false);
  };

  const totalEarned = transactions.filter(t => t.type === "earn").reduce((s, t) => s + t.amount, 0);
  const totalSpent = transactions.filter(t => t.type === "spend").reduce((s, t) => s + t.amount, 0);

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Oggi";
    if (days === 1) return "Ieri";
    if (days < 7) return `${days} giorni fa`;
    return d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
  };

  const filtered = transactions.filter(tx =>
    activeTab === "all" ||
    (activeTab === "earned" && tx.type === "earn") ||
    (activeTab === "spent" && tx.type === "spend")
  );

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-display font-bold text-gradient-primary">QR Coins</h1>
      </header>

      <div className="px-4 py-4 space-y-5">
        {/* Balance Card */}
        <div className="rounded-3xl bg-gradient-to-br from-card via-card to-muted/30 border border-border p-6 shadow-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gold/5 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 rounded-2xl gradient-gold flex items-center justify-center shadow-lg">
                <Coins className="w-8 h-8 text-gold-foreground" />
              </div>
              <button onClick={() => navigate("/spin")} className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Gira & Vinci</span>
              </button>
            </div>
            <p className="text-5xl font-display font-bold text-gradient-gold mb-1">{qrCoins.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Saldo QR Coins</p>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Guadagnati</p>
                <p className="text-sm font-semibold flex items-center gap-1 text-success">
                  <TrendingUp className="w-3.5 h-3.5" /> +{totalEarned} QRC
                </p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Spesi</p>
                <p className="text-sm font-semibold flex items-center gap-1 text-live">
                  <TrendingDown className="w-3.5 h-3.5" /> -{totalSpent} QRC
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          {quickActions.map(action => (
            <button key={action.label} onClick={() => navigate(action.path)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all group">
              <div className={`w-14 h-14 rounded-2xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <action.Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold">{action.label}</p>
                <p className="text-sm text-muted-foreground">{action.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>

        {/* Transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Storico Transazioni</h3>
            <div className="flex gap-1">
              {(["all", "earned", "spent"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    activeTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  }`}>
                  {tab === "all" ? "Tutte" : tab === "earned" ? "Guadagnate" : "Spese"}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-card animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Nessuna transazione</p>
              <button onClick={() => navigate("/spin")} className="mt-3 px-4 py-2 rounded-full gradient-primary text-primary-foreground text-sm font-semibold">
                Inizia a guadagnare
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === "earn" ? "bg-success/20" : "bg-live/20"}`}>
                      {tx.type === "earn" ? <TrendingUp className="w-5 h-5 text-success" /> : <TrendingDown className="w-5 h-5 text-live" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <span className={`font-bold ${tx.type === "earn" ? "text-success" : "text-live"}`}>
                    {tx.type === "earn" ? "+" : "-"}{tx.amount} QRC
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
