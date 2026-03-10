import { ArrowLeft, CreditCard, Wallet, Banknote, QrCode, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/layout/MobileLayout";
import { toast } from "sonner";

const paymentMethods = [
  { id: "wallet", label: "QR Coins Wallet", icon: Wallet, desc: "Paga con il tuo saldo" },
  { id: "card", label: "Carta di Credito/Debito", icon: CreditCard, desc: "Visa, Mastercard" },
  { id: "paypal", label: "PayPal", icon: Banknote, desc: "Paga con PayPal" },
  { id: "klarna", label: "Klarna — 3 Rate", icon: Banknote, desc: "Paga in 3 rate senza interessi" },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [params] = useSearchParams();
  const [selected, setSelected] = useState("wallet");
  const [processing, setProcessing] = useState(false);

  const amount = parseFloat(params.get("amount") || "0");
  const description = params.get("desc") || "Pagamento";
  const type = params.get("type") || "payment";
  const refId = params.get("ref") || "";

  if (!user) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
          <ShieldCheck className="w-10 h-10 text-primary mb-4" />
          <h2 className="text-xl font-display font-bold mb-2">Pagamento Sicuro</h2>
          <p className="text-sm text-muted-foreground mb-6">Accedi per procedere al pagamento</p>
          <button onClick={() => navigate("/auth")} className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold">Accedi</button>
        </div>
      </MobileLayout>
    );
  }

  const handlePay = async () => {
    setProcessing(true);
    try {
      // Stripe-based payments (card, paypal, klarna)
      if (selected === "card" || selected === "paypal" || selected === "klarna") {
        const { data, error } = await supabase.functions.invoke("create-checkout", {
          body: {
            priceId: null, // One-off payment
            mode: "payment",
            amount: Math.round(amount * 100),
            description,
            successUrl: `${window.location.origin}/wallet?payment=success`,
            cancelUrl: `${window.location.origin}/checkout?amount=${amount}&desc=${description}&type=${type}&ref=${refId}`,
          },
        });
        if (error) throw error;
        if (data?.url) {
          window.open(data.url, "_blank");
          setProcessing(false);
          return;
        }
      }

      if (selected === "wallet") {
        const balance = profile?.qr_coins || 0;
        if (balance < amount) {
          toast.error("Saldo insufficiente");
          setProcessing(false);
          return;
        }
        await supabase.from("profiles").update({ qr_coins: balance - amount }).eq("user_id", user.id);
      }

      // Record purchase if product type
      if (type === "product" && refId) {
        await supabase.from("product_purchases").insert({
          buyer_id: user.id,
          product_id: refId,
          unit_price: amount,
          total_price: amount,
          payment_method: selected,
        });
      }

      // Create receipt
      await supabase.from("receipts").insert({
        user_id: user.id,
        receipt_type: type,
        service_name: description,
        amount,
        payment_method: selected,
        status: "paid",
      });

      toast.success("Pagamento completato!");
      navigate(`/wallet`);
    } catch (e) {
      toast.error("Errore nel pagamento");
    }
    setProcessing(false);
  };

  const klarnaInstallment = (amount / 3).toFixed(2);

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-5 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-display font-bold">Checkout</h1>
      </header>

      <div className="px-5 py-6 space-y-6">
        {/* Order Summary */}
        <div className="rounded-2xl bg-card border border-border/50 p-5">
          <p className="text-xs text-muted-foreground mb-1">Riepilogo ordine</p>
          <p className="text-sm font-medium mb-3">{description}</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-display font-bold">€{amount.toFixed(2)}</span>
            {selected === "klarna" && (
              <span className="text-xs text-muted-foreground">oppure 3 × €{klarnaInstallment}</span>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Metodo di pagamento</h3>
          <div className="space-y-2">
            {paymentMethods.map(m => (
              <button key={m.id} onClick={() => setSelected(m.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                  selected === m.id ? "border-primary bg-primary/5" : "border-border/50 bg-card"
                }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected === m.id ? "bg-primary/10" : "bg-muted"}`}>
                  <m.icon className={`w-5 h-5 ${selected === m.id ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold">{m.label}</p>
                  <p className="text-[11px] text-muted-foreground">{m.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selected === m.id ? "border-primary" : "border-border"
                }`}>
                  {selected === m.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Wallet Balance */}
        {selected === "wallet" && (
          <div className="rounded-xl bg-muted/50 p-3 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Saldo: <strong>{(profile?.qr_coins || 0).toLocaleString()} QR Coins</strong></span>
          </div>
        )}

        {/* Klarna Info */}
        {selected === "klarna" && (
          <div className="rounded-xl bg-muted/50 p-4 space-y-2">
            <p className="text-xs font-semibold">Paga in 3 rate senza interessi</p>
            {[1, 2, 3].map(i => (
              <div key={i} className="flex justify-between text-xs text-muted-foreground">
                <span>Rata {i}</span>
                <span>€{klarnaInstallment}</span>
              </div>
            ))}
          </div>
        )}

        {/* Pay Button */}
        <button onClick={handlePay} disabled={processing || amount <= 0}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base disabled:opacity-50 transition-opacity">
          {processing ? "Elaborazione..." : `Paga €${amount.toFixed(2)}`}
        </button>

        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[11px]">Pagamento sicuro e protetto</span>
        </div>
      </div>
    </MobileLayout>
  );
}
