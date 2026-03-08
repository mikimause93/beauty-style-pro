import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/layout/MobileLayout";
import { Check, Crown, Rocket, Star, Zap, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const PLAN_ICONS: Record<string, any> = {
  free: Star,
  pro: Zap,
  business: Rocket,
  premium: Crown,
};

const PLAN_COLORS: Record<string, string> = {
  free: "border-border",
  pro: "border-primary/60",
  business: "border-primary",
  premium: "border-yellow-500 ring-2 ring-yellow-500/20",
};

export default function SubscriptionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<any[]>([]);
  const [currentSub, setCurrentSub] = useState<any>(null);
  const [yearly, setYearly] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [promoActive, setPromoActive] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    const [plansRes, countRes, promoRes] = await Promise.all([
      supabase.from("subscription_plans").select("*").eq("active", true).order("sort_order"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("platform_settings").select("value").eq("key", "promo_first_1000").single(),
    ]);
    if (plansRes.data) setPlans(plansRes.data);
    setTotalUsers(countRes.count || 0);

    const promo = promoRes.data?.value as any;
    setPromoActive(promo?.enabled && (countRes.count || 0) < (promo?.max_users || 1000));

    if (user) {
      const { data } = await supabase
        .from("user_subscriptions")
        .select("*, subscription_plans(*)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setCurrentSub(data);
    }
  };

  const subscribe = async (plan: any) => {
    if (!user) { navigate("/auth"); return; }
    if (plan.slug === "free") return;

    setLoading(plan.id);
    try {
      const isPremiumTrial = plan.slug === "premium" && promoActive && !currentSub;
      const expiresAt = new Date();
      if (isPremiumTrial) {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      } else if (yearly) {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      // Cancel existing
      if (currentSub) {
        await supabase.from("user_subscriptions").update({ status: "cancelled" }).eq("id", currentSub.id);
      }

      await supabase.from("user_subscriptions").insert({
        user_id: user.id,
        plan_id: plan.id,
        is_trial: isPremiumTrial,
        expires_at: expiresAt.toISOString(),
        payment_method: isPremiumTrial ? "promo" : "wallet",
      });

      toast.success(isPremiumTrial ? "🎉 1 mese Premium gratis attivato!" : `Piano ${plan.name} attivato!`);
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-5 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-display font-bold">Abbonamenti</h1>
      </header>

      <div className="px-5 py-6 space-y-6">
        {/* Promo Banner */}
        {promoActive && (
          <div className="rounded-2xl bg-gradient-to-r from-yellow-500/20 to-primary/20 border border-yellow-500/30 p-4 text-center">
            <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm font-bold">🎉 Promo Primi 1000 Utenti</p>
            <p className="text-xs text-muted-foreground mt-1">
              1 mese Premium GRATIS • {1000 - totalUsers} posti rimasti
            </p>
          </div>
        )}

        {/* Toggle yearly/monthly */}
        <div className="flex items-center justify-center gap-3">
          <span className={`text-sm ${!yearly ? "font-bold text-foreground" : "text-muted-foreground"}`}>Mensile</span>
          <button onClick={() => setYearly(!yearly)}
            className={`w-12 h-6 rounded-full relative transition-colors ${yearly ? "bg-primary" : "bg-muted"}`}>
            <div className={`w-5 h-5 rounded-full bg-primary-foreground absolute top-0.5 transition-all ${yearly ? "left-6" : "left-0.5"}`} />
          </button>
          <span className={`text-sm ${yearly ? "font-bold text-foreground" : "text-muted-foreground"}`}>
            Annuale <span className="text-xs text-primary">-17%</span>
          </span>
        </div>

        {/* Plans */}
        <div className="space-y-4">
          {plans.map((plan) => {
            const Icon = PLAN_ICONS[plan.slug] || Star;
            const isCurrent = currentSub?.plan_id === plan.id;
            const price = yearly ? plan.price_yearly : plan.price_monthly;
            const features = (plan.features as string[]) || [];

            return (
              <div key={plan.id}
                className={`rounded-2xl border-2 ${PLAN_COLORS[plan.slug]} bg-card p-5 transition-all ${plan.slug === "premium" ? "relative overflow-hidden" : ""}`}>
                {plan.slug === "premium" && (
                  <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                    MIGLIORE
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.slug === "premium" ? "bg-yellow-500/20" : "bg-primary/10"}`}>
                    <Icon className={`w-5 h-5 ${plan.slug === "premium" ? "text-yellow-500" : "text-primary"}`} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold">{plan.name}</h3>
                    <p className="text-lg font-bold">
                      {price === 0 ? "Gratis" : `€${price}`}
                      {price > 0 && <span className="text-xs text-muted-foreground font-normal">/{yearly ? "anno" : "mese"}</span>}
                    </p>
                  </div>
                </div>

                <ul className="space-y-1.5 mb-4">
                  {features.map((f: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="w-full py-2.5 rounded-xl bg-primary/10 text-center text-sm font-semibold text-primary">
                    Piano Attuale
                  </div>
                ) : plan.slug === "free" ? null : (
                  <button onClick={() => subscribe(plan)} disabled={!!loading}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      plan.slug === "premium"
                        ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-black"
                        : "bg-primary text-primary-foreground"
                    }`}>
                    {loading === plan.id ? "..." : promoActive && plan.slug === "premium" ? "Prova Gratis 1 Mese" : "Abbonati"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </MobileLayout>
  );
}
