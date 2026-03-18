import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  Users,
  DollarSign,
  Heart,
  Briefcase,
  BarChart3,
  Coins,
  Star,
  ChevronRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/layout/MobileLayout";

export default function CreatorDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [period, setPeriod] = useState<"7d" | "30d" | "all">("30d");

  const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : 365;
  const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();

  const { data: creatorProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ["creator-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await (supabase as any)
        .from("creator_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: earningsStats } = useQuery({
    queryKey: ["creator-earnings-stats", creatorProfile?.id, period],
    queryFn: async () => {
      if (!creatorProfile) return null;
      const { data } = await (supabase as any)
        .from("creator_earnings")
        .select("source, amount")
        .eq("creator_id", creatorProfile.id)
        .gte("created_at", startDate);
      const total = data?.reduce((s: number, e: any) => s + Number(e.amount), 0) || 0;
      const bySource: Record<string, number> = {};
      data?.forEach((e: any) => {
        bySource[e.source] = (bySource[e.source] || 0) + Number(e.amount);
      });
      return { total, bySource, count: data?.length || 0 };
    },
    enabled: !!creatorProfile,
  });

  const { data: subscriptionStats } = useQuery({
    queryKey: ["creator-subscriptions", creatorProfile?.id, period],
    queryFn: async () => {
      if (!creatorProfile) return null;
      const { data } = await (supabase as any)
        .from("user_subscriptions")
        .select("id, status, started_at")
        .eq("creator_id", creatorProfile.id)
        .gte("started_at", startDate);
      const active = data?.filter((s: any) => s.status === "active").length || 0;
      return { total: data?.length || 0, active };
    },
    enabled: !!creatorProfile,
  });

  const { data: tipsStats } = useQuery({
    queryKey: ["creator-tips", creatorProfile?.id, period],
    queryFn: async () => {
      if (!creatorProfile) return null;
      const { data } = await (supabase as any)
        .from("tips")
        .select("amount")
        .eq("creator_id", creatorProfile.id)
        .gte("created_at", startDate);
      const total = data?.reduce((s: number, t: any) => s + Number(t.amount), 0) || 0;
      return { count: data?.length || 0, total };
    },
    enabled: !!creatorProfile,
  });

  const { data: partnershipsStats } = useQuery({
    queryKey: ["creator-partnerships", creatorProfile?.id, period],
    queryFn: async () => {
      if (!creatorProfile) return null;
      const { data } = await (supabase as any)
        .from("brand_partnerships")
        .select("status, value")
        .eq("creator_id", creatorProfile.id);
      const active = data?.filter((p: any) => p.status === "active") || [];
      const totalValue = active.reduce((s: number, p: any) => s + Number(p.value), 0);
      return { total: data?.length || 0, active: active.length, totalValue };
    },
    enabled: !!creatorProfile,
  });

  const { data: memberships } = useQuery({
    queryKey: ["creator-memberships", creatorProfile?.id],
    queryFn: async () => {
      if (!creatorProfile) return [];
      const { data } = await (supabase as any)
        .from("creator_memberships")
        .select("*")
        .eq("creator_id", creatorProfile.id)
        .eq("is_active", true)
        .order("price", { ascending: true });
      return data || [];
    },
    enabled: !!creatorProfile,
  });

  if (!user) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
          <Sparkles className="w-12 h-12 text-primary mb-4" />
          <h2 className="text-xl font-display font-bold mb-2">Area Creator</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Accedi per gestire il tuo profilo creator
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="px-8 py-3 rounded-full gradient-primary text-primary-foreground font-bold"
          >
            Accedi
          </button>
        </div>
      </MobileLayout>
    );
  }

  if (loadingProfile) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  if (!creatorProfile) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
          <Sparkles className="w-12 h-12 text-primary mb-4" />
          <h2 className="text-xl font-display font-bold mb-2">Non sei ancora un creator</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Candidati per diventare un creator e iniziare a monetizzare.
          </p>
          <button
            onClick={() => navigate("/become-creator")}
            className="px-8 py-3 rounded-full gradient-primary text-primary-foreground font-bold"
          >
            Diventa Creator
          </button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-display font-bold">Dashboard Creator</h1>
            {creatorProfile.display_name && (
              <p className="text-xs text-muted-foreground">{creatorProfile.display_name}</p>
            )}
          </div>
          {creatorProfile.is_verified && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary">
              <Star className="w-3 h-3" />
              <span className="text-[10px] font-bold">Verificato</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {(["7d", "30d", "all"] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                period === p
                  ? "gradient-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {p === "7d" ? "7 Giorni" : p === "30d" ? "30 Giorni" : "Sempre"}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Key metrics grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<DollarSign className="w-5 h-5" />}
            label="Entrate Totali"
            value={`€${(earningsStats?.total || 0).toFixed(2)}`}
            color="primary"
          />
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Abbonati Attivi"
            value={(subscriptionStats?.active || 0).toString()}
            color="secondary"
          />
          <StatCard
            icon={<Heart className="w-5 h-5" />}
            label="Tips Ricevuti"
            value={`€${(tipsStats?.total || 0).toFixed(2)}`}
            color="accent"
          />
          <StatCard
            icon={<Briefcase className="w-5 h-5" />}
            label="Partnership Attive"
            value={(partnershipsStats?.active || 0).toString()}
            color="gold"
          />
        </div>

        {/* Earnings breakdown */}
        {earningsStats && earningsStats.count > 0 && (
          <div className="rounded-xl bg-card border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Entrate per Fonte</h3>
            </div>
            <div className="space-y-2">
              {Object.entries(earningsStats.bySource).map(([source, amount]) => (
                <div key={source} className="flex items-center justify-between">
                  <span className="text-sm capitalize text-muted-foreground">
                    {sourceLabel(source)}
                  </span>
                  <span className="text-sm font-bold">€{(amount as number).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 flex items-center justify-between">
                <span className="text-sm font-semibold">Totale</span>
                <span className="text-sm font-bold text-primary">
                  €{earningsStats.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Memberships */}
        {memberships && memberships.length > 0 && (
          <div className="rounded-xl bg-card border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Coins className="w-5 h-5 text-gold" />
              <h3 className="font-semibold">I Tuoi Piani</h3>
            </div>
            <div className="space-y-2">
              {memberships.map((m: any) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/40"
                >
                  <div>
                    <p className="text-sm font-semibold">{m.name}</p>
                    {m.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {m.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">
                      €{Number(m.price).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      /{m.interval === "month" ? "mese" : "anno"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Partnerships */}
        {partnershipsStats && partnershipsStats.total > 0 && (
          <div className="rounded-xl bg-card border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-5 h-5 text-accent" />
              <h3 className="font-semibold">Brand Partnership</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{partnershipsStats.total}</p>
                <p className="text-[10px] text-muted-foreground">Totali</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-success">{partnershipsStats.active}</p>
                <p className="text-[10px] text-muted-foreground">Attive</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gold">
                  €{partnershipsStats.totalValue.toFixed(0)}
                </p>
                <p className="text-[10px] text-muted-foreground">Valore</p>
              </div>
            </div>
          </div>
        )}

        {/* Tips summary */}
        {tipsStats && tipsStats.count > 0 && (
          <div className="rounded-xl bg-card border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-live" />
              <h3 className="font-semibold">Suggerimenti (Tips)</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{tipsStats.count}</p>
                <p className="text-[10px] text-muted-foreground">Ricevuti</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  €{tipsStats.total.toFixed(2)}
                </p>
                <p className="text-[10px] text-muted-foreground">Totale</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="space-y-2">
          <QuickAction
            icon={<BarChart3 className="w-5 h-5 text-primary" />}
            label="Guadagni & Pagamenti"
            desc="Dettaglio entrate e richiedi pagamento"
            onClick={() => navigate("/creator-earnings")}
          />
          <QuickAction
            icon={<TrendingUp className="w-5 h-5 text-secondary" />}
            label="Analisi Avanzate"
            desc="Statistiche generali del tuo account"
            onClick={() => navigate("/analytics")}
          />
          <QuickAction
            icon={<Users className="w-5 h-5 text-accent" />}
            label="I Miei Follower"
            desc="Visualizza il tuo profilo pubblico"
            onClick={() => navigate("/profile")}
          />
        </div>
      </div>
    </MobileLayout>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    primary: "text-primary",
    secondary: "text-secondary",
    accent: "text-accent",
    gold: "text-gold",
  };
  return (
    <div className="rounded-xl bg-card border border-border p-4 text-center">
      <div className={`${colorMap[color] || "text-primary"} mx-auto mb-2 flex justify-center`}>
        {icon}
      </div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 rounded-xl bg-card border border-border text-left hover:border-primary/30 transition-colors"
    >
      <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}

function sourceLabel(source: string): string {
  const map: Record<string, string> = {
    subscription: "Abbonamenti",
    tip: "Tips",
    booking: "Prenotazioni",
    partnership: "Partnership",
    other: "Altro",
  };
  return map[source] || source;
}
