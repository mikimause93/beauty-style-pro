import { ArrowDownLeft, ArrowUpRight, Coins, CreditCard, History, Plus, Wallet } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/layout/MobileLayout";
import { toast } from "sonner";

export default function WalletPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<any[]>([]);

  useEffect(() => {
    if (user) loadTransactions();
  }, [user]);

  const loadTransactions = async () => {
    const { data } = await supabase
      .from("product_purchases")
      .select("*, products(name)")
      .eq("buyer_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setPurchases(data);
  };

  const balance = profile?.qr_coins || 0;

  if (!user) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
          <Wallet className="w-10 h-10 text-primary mb-4" />
          <h2 className="text-xl font-display font-bold mb-2">Il tuo Wallet</h2>
          <p className="text-sm text-muted-foreground mb-6">Accedi per gestire il tuo portafoglio</p>
          <button onClick={() => navigate("/auth")} className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold">
            Accedi
          </button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-5 py-3">
        <h1 className="text-lg font-display font-bold">Wallet</h1>
      </header>

      <div className="px-5 py-6 space-y-6">
        {/* Balance Card */}
        <div className="rounded-2xl gradient-primary p-6 text-primary-foreground">
          <p className="text-xs opacity-80 mb-1">Saldo disponibile</p>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-display font-bold">{balance.toLocaleString()}</span>
            <span className="text-sm opacity-80">QR Coins</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => toast.info("Ricarica in arrivo!")}
              className="flex-1 py-2.5 rounded-xl bg-primary-foreground/20 text-sm font-semibold flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Ricarica
            </button>
            <button onClick={() => toast.info("Prelievo in arrivo!")}
              className="flex-1 py-2.5 rounded-xl bg-primary-foreground/20 text-sm font-semibold flex items-center justify-center gap-2">
              <ArrowUpRight className="w-4 h-4" /> Preleva
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { Icon: CreditCard, label: "Paga", action: () => navigate("/shop") },
            { Icon: Gift, label: "Invia Tip", action: () => navigate("/live") },
            { Icon: History, label: "Storico", action: () => navigate("/purchases") },
          ].map(item => (
            <button key={item.label} onClick={item.action}
              className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-card border border-border/50">
              <item.Icon className="w-5 h-5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Recent Transactions */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Transazioni recenti</h3>
          {purchases.length === 0 ? (
            <div className="text-center py-8">
              <Coins className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nessuna transazione</p>
            </div>
          ) : (
            <div className="space-y-2">
              {purchases.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <ArrowDownLeft className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.products?.name || "Acquisto"}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString("it-IT")}</p>
                  </div>
                  <span className="text-sm font-bold">-€{tx.total_price}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}

// Need Gift import
import { Gift } from "lucide-react";
