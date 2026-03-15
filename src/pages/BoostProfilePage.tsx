import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Rocket, Zap, Crown, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const BOOST_OPTIONS = [
  { days: 1, icon: Zap, label: "1 Giorno", desc: "Ideale per test rapidi" },
  { days: 7, icon: Rocket, label: "7 Giorni", desc: "Più visibilità in settimana", popular: true },
  { days: 30, icon: Crown, label: "30 Giorni", desc: "Massima esposizione" },
];

export default function BoostProfilePage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState(7);
  const [activeBoost, setActiveBoost] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    const { data: settings } = await supabase
      .from("platform_settings").select("value").eq("key", "boost_prices").single();
    if (settings?.value) setPrices((settings.value as any) || {});

    if (user) {
      const { data } = await supabase
        .from("profile_boosts")
        .select("*")
        .eq("user_id", user.id)
        .eq("active", true)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setActiveBoost(data);
    }
  };

  const purchaseBoost = async () => {
    if (!user) { navigate("/auth"); return; }
    setLoading(true);
    try {
      const price = prices[String(selected)] || 0;
      const balance = profile?.qr_coins || 0;

      if (balance < price * 100) {
        toast.error("Saldo insufficiente nel wallet");
        setLoading(false);
        return;
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + selected);

      await supabase.from("profile_boosts").insert({
        user_id: user.id,
        duration_days: selected,
        price_paid: price,
        expires_at: expiresAt.toISOString(),
      });

      toast.success(`🚀 Boost ${selected} giorni attivato!`);
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-5 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-display font-bold">Boost Profilo</h1>
      </header>

      <div className="px-5 py-6 space-y-6">
        {/* Active Boost */}
        {activeBoost && (
          <div className="rounded-2xl bg-gradient-to-r from-primary/20 to-yellow-500/20 border border-primary/30 p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold">Boost Attivo</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Scade il {new Date(activeBoost.expires_at).toLocaleDateString("it-IT")}
            </p>
          </div>
        )}

        {/* Info */}
        <div className="text-center">
          <Rocket className="w-12 h-12 text-primary mx-auto mb-3" />
          <h2 className="text-xl font-display font-bold mb-1">Aumenta la tua visibilità</h2>
          <p className="text-sm text-muted-foreground">
            Con il boost appari primo in ricerca, mappa e feed
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-3">
          {["Primo in ricerca", "Primo in mappa", "Primo nel feed"].map((b) => (
            <div key={b} className="py-3 px-2 rounded-xl bg-card border border-border/50 text-center">
              <p className="text-[11px] text-muted-foreground font-medium">{b}</p>
            </div>
          ))}
        </div>

        {/* Options */}
        <div className="space-y-3">
          {BOOST_OPTIONS.map((opt) => {
            const price = prices[String(opt.days)] || 0;
            return (
              <button key={opt.days} onClick={() => setSelected(opt.days)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                  selected === opt.days ? "border-primary bg-primary/5" : "border-border bg-card"
                } ${opt.popular ? "relative" : ""}`}>
                {opt.popular && (
                  <div className="absolute -top-2 right-4 bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full">
                    POPOLARE
                  </div>
                )}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected === opt.days ? "bg-primary/20" : "bg-muted"}`}>
                  <opt.icon className={`w-5 h-5 ${selected === opt.days ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm">{opt.label}</p>
                  <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
                </div>
                <span className="text-lg font-bold">€{price}</span>
              </button>
            );
          })}
        </div>

        <button onClick={purchaseBoost} disabled={loading || !!activeBoost}
          className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm">
          {loading ? "..." : activeBoost ? "Boost già attivo" : `Attiva Boost – €${prices[String(selected)] || 0}`}
        </button>
      </div>
    </MobileLayout>
  );
}
