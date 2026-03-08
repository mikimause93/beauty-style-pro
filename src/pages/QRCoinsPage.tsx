import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Coins, ChevronRight, Gift, Trophy, Heart, ShoppingBag, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const earnOptions = [
  { icon: "💰", label: "Hart Ccoins", desc: "Watch streams & earn", color: "gradient-gold", path: "/live" },
  { icon: "🎯", label: "Earn QRCoins", desc: "Complete challenges", color: "bg-success/20", path: "/challenges" },
  { icon: "🛍️", label: "Spend QRCoins", desc: "Shop & book services", color: "bg-primary/20", path: "/shop" },
  { icon: "🏆", label: "Earnings", desc: "View your earnings", color: "bg-secondary/20", path: "/leaderboard" },
];

const transactions = [
  { id: 1, label: "Produk blast", amount: "+200.00", type: "earn" },
  { id: 2, label: "Slot Summed", amount: "-200.00", type: "spend" },
  { id: 3, label: "Challenge reward", amount: "+50.00", type: "earn" },
  { id: 4, label: "Tip received", amount: "+25.00", type: "earn" },
  { id: 5, label: "Product purchase", amount: "-34.99", type: "spend" },
];

export default function QRCoinsPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const qrCoins = profile?.qr_coins || 3450;

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-display font-bold text-gradient-primary">Stayle</h1>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Balance Card */}
        <div className="rounded-2xl gradient-card border border-border p-6 shadow-card text-center">
          <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center mx-auto mb-3">
            <Coins className="w-8 h-8 text-gold-foreground" />
          </div>
          <p className="text-4xl font-display font-bold text-gradient-gold">{qrCoins.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground mt-1">QR Coins Balance</p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {earnOptions.map(opt => (
            <button
              key={opt.label}
              onClick={() => navigate(opt.path)}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-card shadow-card hover:bg-muted transition-all"
            >
              <div className={`w-12 h-12 rounded-xl ${opt.color} flex items-center justify-center text-xl`}>
                {opt.icon}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Recent Transactions */}
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Transazioni Recenti</h3>
        <div className="space-y-2">
          {transactions.map(tx => (
            <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-card shadow-card">
              <p className="text-sm font-medium">{tx.label}</p>
              <span className={`text-sm font-bold ${tx.type === "earn" ? "text-success" : "text-live"}`}>
                {tx.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
