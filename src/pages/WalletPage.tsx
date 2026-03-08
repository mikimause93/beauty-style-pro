import { ArrowDownLeft, ArrowUpRight, Coins, CreditCard, Gift, History, Plus, Wallet, Building2, Banknote, QrCode, Receipt, ChevronRight, Trash2, Send, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/layout/MobileLayout";
import { toast } from "sonner";
import QRTransferModal from "@/components/wallet/QRTransferModal";
import ShareAppModal from "@/components/wallet/ShareAppModal";

export default function WalletPage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [tab, setTab] = useState<"overview" | "methods" | "history">("overview");
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardForm, setCardForm] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showQRTransfer, setShowQRTransfer] = useState(false);
  const [showShareApp, setShowShareApp] = useState(false);

  useEffect(() => {
    if (user) { loadTransactions(); loadPaymentMethods(); }
  }, [user]);

  const loadTransactions = async () => {
    const { data } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) setTransactions(data);
  };

  const loadPaymentMethods = async () => {
    const { data } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setPaymentMethods(data);
  };

  const addCard = async () => {
    if (!cardForm.number || !cardForm.name) { toast.error("Compila tutti i campi"); return; }
    const lastFour = cardForm.number.replace(/\s/g, "").slice(-4);
    const brand = cardForm.number.startsWith("4") ? "Visa" : cardForm.number.startsWith("5") ? "Mastercard" : "Card";
    await supabase.from("payment_methods").insert({
      user_id: user!.id, method_type: "card", label: `${brand} •••• ${lastFour}`, last_four: lastFour, brand,
    });
    setShowAddCard(false);
    setCardForm({ number: "", expiry: "", cvv: "", name: "" });
    loadPaymentMethods();
    toast.success("Carta aggiunta!");
  };

  const addPaypal = async () => {
    await supabase.from("payment_methods").insert({
      user_id: user!.id, method_type: "paypal", label: "PayPal", brand: "PayPal",
    });
    loadPaymentMethods();
    toast.success("PayPal collegato!");
  };

  const removeMethod = async (id: string) => {
    await supabase.from("payment_methods").delete().eq("id", id);
    loadPaymentMethods();
    toast.success("Metodo rimosso");
  };

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) { toast.error("Importo non valido"); return; }
    const balance = profile?.qr_coins || 0;
    if (amt > balance) { toast.error("Saldo insufficiente"); return; }
    if (!profile?.iban) { toast.error("Aggiungi prima il tuo IBAN nelle impostazioni"); return; }

    await supabase.from("profiles").update({ qr_coins: balance - amt }).eq("user_id", user!.id);
    await supabase.from("wallet_transactions").insert({
      user_id: user!.id, type: "withdraw", amount: -amt, description: `Prelievo su IBAN ${profile.iban.slice(-4)}`, payment_method: "bank_transfer", status: "pending",
    });
    await refreshProfile();
    loadTransactions();
    setShowWithdraw(false);
    setWithdrawAmount("");
    toast.success("Prelievo richiesto!");
  };

  const balance = profile?.qr_coins || 0;

  if (!user) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
          <Wallet className="w-10 h-10 text-primary mb-4" />
          <h2 className="text-xl font-display font-bold mb-2">Il tuo Wallet</h2>
          <p className="text-sm text-muted-foreground mb-6">Accedi per gestire il tuo portafoglio</p>
          <button onClick={() => navigate("/auth")} className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold">Accedi</button>
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
            <button onClick={() => navigate("/qr-coins")}
              className="flex-1 py-2.5 rounded-xl bg-primary-foreground/20 text-sm font-semibold flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Ricarica
            </button>
            <button onClick={() => setShowWithdraw(true)}
              className="flex-1 py-2.5 rounded-xl bg-primary-foreground/20 text-sm font-semibold flex items-center justify-center gap-2">
              <ArrowUpRight className="w-4 h-4" /> Preleva
            </button>
          </div>
        </div>

        {/* IBAN Info */}
        {profile?.iban && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">IBAN collegato</p>
              <p className="text-sm font-medium truncate">•••• {profile.iban.slice(-4)}</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 font-semibold">Attivo</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {([["overview", "Panoramica"], ["methods", "Metodi"], ["history", "Storico"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${tab === key ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { Icon: CreditCard, label: "Paga", action: () => navigate("/shop") },
                { Icon: Gift, label: "Invia Tip", action: () => navigate("/live") },
                { Icon: Receipt, label: "Ricevute", action: () => navigate("/receipts") },
              ].map(item => (
                <button key={item.label} onClick={item.action}
                  className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-card border border-border/50">
                  <item.Icon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground font-medium">{item.label}</span>
                </button>
              ))}
            </div>

            {/* QR Coin Exchange */}
            <button onClick={() => setShowQRTransfer(true)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/50">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Send className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold">Scambia QR Coins</p>
                <p className="text-[11px] text-muted-foreground">Invia o ricevi tramite codice QR</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Download & Share App */}
            <button onClick={() => setShowShareApp(true)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/50">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Download className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold">Scarica & Condividi App</p>
                <p className="text-[11px] text-muted-foreground">Installa o invia agli amici</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Recent */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Ultime transazioni</h3>
              {transactions.length === 0 ? (
                <div className="text-center py-6">
                  <Coins className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nessuna transazione</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.slice(0, 5).map(tx => (
                    <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${Number(tx.amount) >= 0 ? "bg-green-500/10" : "bg-primary/10"}`}>
                        {Number(tx.amount) >= 0 ? <ArrowDownLeft className="w-4 h-4 text-green-500" /> : <ArrowUpRight className="w-4 h-4 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{tx.description || tx.type}</p>
                        <p className="text-[11px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString("it-IT")}</p>
                      </div>
                      <span className={`text-sm font-bold ${Number(tx.amount) >= 0 ? "text-green-500" : ""}`}>
                        {Number(tx.amount) >= 0 ? "+" : ""}€{Math.abs(Number(tx.amount)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Methods */}
        {tab === "methods" && (
          <div className="space-y-4">
            {paymentMethods.map(pm => (
              <div key={pm.id} className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/50">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  {pm.method_type === "card" ? <CreditCard className="w-5 h-5 text-muted-foreground" /> : <Banknote className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{pm.label}</p>
                  <p className="text-[11px] text-muted-foreground">{pm.brand || pm.method_type}</p>
                </div>
                <button onClick={() => removeMethod(pm.id)}><Trash2 className="w-4 h-4 text-muted-foreground" /></button>
              </div>
            ))}

            <button onClick={() => setShowAddCard(true)}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-border text-sm font-semibold text-muted-foreground flex items-center justify-center gap-2">
              <CreditCard className="w-4 h-4" /> Aggiungi Carta
            </button>
            <button onClick={addPaypal}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-border text-sm font-semibold text-muted-foreground flex items-center justify-center gap-2">
              <Banknote className="w-4 h-4" /> Collega PayPal
            </button>
          </div>
        )}

        {/* History */}
        {tab === "history" && (
          <div className="space-y-2">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nessuna transazione</p>
              </div>
            ) : (
              transactions.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${Number(tx.amount) >= 0 ? "bg-green-500/10" : "bg-primary/10"}`}>
                    {Number(tx.amount) >= 0 ? <ArrowDownLeft className="w-4 h-4 text-green-500" /> : <ArrowUpRight className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description || tx.type}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString("it-IT")}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                        tx.status === "completed" ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                      }`}>{tx.status === "completed" ? "Completato" : "In attesa"}</span>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${Number(tx.amount) >= 0 ? "text-green-500" : ""}`}>
                    {Number(tx.amount) >= 0 ? "+" : ""}€{Math.abs(Number(tx.amount)).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add Card Modal */}
      {showAddCard && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end">
          <div className="w-full rounded-t-3xl bg-card p-6 space-y-4 animate-slide-up">
            <h3 className="text-lg font-display font-bold">Aggiungi Carta</h3>
            <input placeholder="Nome sulla carta" value={cardForm.name} onChange={e => setCardForm({ ...cardForm, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
            <input placeholder="Numero carta" value={cardForm.number} onChange={e => setCardForm({ ...cardForm, number: e.target.value })} maxLength={19}
              className="w-full px-4 py-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
            <div className="flex gap-3">
              <input placeholder="MM/AA" value={cardForm.expiry} onChange={e => setCardForm({ ...cardForm, expiry: e.target.value })} maxLength={5}
                className="flex-1 px-4 py-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
              <input placeholder="CVV" value={cardForm.cvv} onChange={e => setCardForm({ ...cardForm, cvv: e.target.value })} maxLength={4} type="password"
                className="flex-1 px-4 py-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
            <button onClick={addCard} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold">Salva Carta</button>
            <button onClick={() => setShowAddCard(false)} className="w-full py-2 text-sm text-muted-foreground">Annulla</button>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end">
          <div className="w-full rounded-t-3xl bg-card p-6 space-y-4 animate-slide-up">
            <h3 className="text-lg font-display font-bold">Preleva</h3>
            {profile?.iban ? (
              <>
                <p className="text-xs text-muted-foreground">Invieremo su: •••• {profile.iban.slice(-4)}</p>
                <input type="number" placeholder="Importo (€)" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
                <button onClick={handleWithdraw} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold">Conferma Prelievo</button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Devi aggiungere un IBAN per prelevare. Vai all'onboarding.</p>
                <button onClick={() => navigate("/onboarding")} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold">Vai a Onboarding</button>
              </>
            )}
            <button onClick={() => setShowWithdraw(false)} className="w-full py-2 text-sm text-muted-foreground">Annulla</button>
          </div>
        </div>
      )}
    </MobileLayout>
  );
}
