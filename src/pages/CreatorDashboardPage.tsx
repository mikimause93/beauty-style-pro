import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp, DollarSign, Users, Play, BookOpen,
  ArrowLeft, Sparkles, Crown, BadgeCheck, Zap, ChevronRight,
  Gift, Handshake, BarChart3, Wallet, Plus, Loader2, CheckCircle, Star
} from "lucide-react";
import { motion } from "framer-motion";
import MobileLayout from "@/components/layout/MobileLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────
interface CreatorProfile {
  creator_tier: "free" | "verified" | "pro" | "partner";
  total_followers: number;
  total_revenue: number;
  total_courses_sold: number;
  total_live_views: number;
  revenue_share_percentage: number;
  minimum_payout: number;
  payout_method: string | null;
  is_verified: boolean;
  open_to_partnerships: boolean;
}

interface Earning {
  id: string;
  source_type: string;
  gross_amount: number;
  net_amount: number;
  status: string;
  created_at: string;
}

interface Membership {
  id: string;
  tier_name: string;
  tier_price: number;
  benefits: string[];
  is_active: boolean;
}

interface Partnership {
  id: string;
  brand_name: string;
  campaign_description: string;
  payment_amount: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
}

// ── Tier config ────────────────────────────────────────────────────────────
const TIER_CONFIG = {
  free:     { label: "Free Creator",   color: "text-muted-foreground", bg: "bg-muted/50",      Icon: Sparkles, share: 60 },
  verified: { label: "Verified",       color: "text-blue-400",         bg: "bg-blue-500/10",   Icon: BadgeCheck, share: 70 },
  pro:      { label: "Pro Creator",    color: "text-purple-400",       bg: "bg-purple-500/10", Icon: Zap, share: 75 },
  partner:  { label: "Partner",        color: "text-amber-400",        bg: "bg-amber-500/10",  Icon: Crown, share: 80 },
} as const;

const SOURCE_LABELS: Record<string, string> = {
  course_sale:   "Corso",
  live_shopping: "Live Shopping",
  tip:           "Tip",
  sponsorship:   "Sponsorizzazione",
  membership:    "Membership",
  consultation:  "Consulenza",
};

type TabType = "overview" | "earnings" | "memberships" | "partnerships";

export default function CreatorDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [requestingPayout, setRequestingPayout] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [cpRes, earnRes, memRes, partRes] = await Promise.all([
        supabase.from("creator_profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("creator_earnings").select("*").eq("creator_id", user.id).order("created_at", { ascending: false }).limit(20),
        supabase.from("creator_memberships").select("*").eq("creator_id", user.id),
        supabase.from("brand_partnerships").select("*").eq("creator_id", user.id).order("created_at", { ascending: false }).limit(10),
      ]);

      if (cpRes.data) setCreatorProfile(cpRes.data as CreatorProfile);
      if (earnRes.data) {
        const list = earnRes.data as Earning[];
        setEarnings(list);
        const pending = list.filter(e => e.status === "pending").reduce((s, e) => s + (e.net_amount ?? 0), 0);
        setPendingTotal(pending);
      }
      if (memRes.data) {
        setMemberships(memRes.data.map(m => ({
          ...m,
          benefits: Array.isArray(m.benefits) ? (m.benefits as string[]) : [],
        })) as Membership[]);
      }
      if (partRes.data) setPartnerships(partRes.data as Partnership[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const requestPayout = async () => {
    if (!user || !creatorProfile) return;
    const minPayout = creatorProfile.minimum_payout ?? 50;
    if (pendingTotal < minPayout) {
      toast.error(`Minimo prelievo: €${minPayout}. Hai €${pendingTotal.toFixed(2)} in attesa.`);
      return;
    }
    setRequestingPayout(true);
    try {
      const { error } = await supabase.from("creator_payouts").insert({
        creator_id: user.id,
        amount: pendingTotal,
        currency: "EUR",
        payout_method: creatorProfile.payout_method ?? "bank_transfer",
        status: "pending",
      });
      if (error) throw error;
      toast.success(`Richiesta prelievo di €${pendingTotal.toFixed(2)} inviata! ✅`);
      loadData();
    } catch {
      toast.error("Errore nella richiesta di prelievo");
    } finally {
      setRequestingPayout(false);
    }
  };

  const createMembership = async () => {
    if (!user) return;
    const { error } = await supabase.from("creator_memberships").insert({
      creator_id: user.id,
      tier_name: "Bronze",
      tier_price: 4.99,
      benefits: ["Contenuti esclusivi", "Badge speciale"],
      is_active: true,
    });
    if (error) { toast.error("Errore nella creazione della membership"); return; }
    toast.success("Membership Bronze creata! 🎉");
    loadData();
  };

  if (!user) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
          <Crown className="w-16 h-16 text-amber-400 mb-4" />
          <h2 className="text-xl font-bold mb-2">Accedi per continuare</h2>
          <button onClick={() => navigate("/auth")} className="mt-4 px-6 py-2 rounded-full gradient-primary text-primary-foreground font-semibold">
            Accedi
          </button>
        </div>
      </MobileLayout>
    );
  }

  const tier = (creatorProfile?.creator_tier ?? "free") as keyof typeof TIER_CONFIG;
  const tierConf = TIER_CONFIG[tier];
  const TierIcon = tierConf.Icon;

  return (
    <MobileLayout>
      <div className="pb-24">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/50 px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold">Creator Dashboard</h1>
            <p className="text-xs text-muted-foreground">Gestisci i tuoi guadagni</p>
          </div>
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${tierConf.bg}`}>
            <TierIcon className={`w-3.5 h-3.5 ${tierConf.color}`} />
            <span className={`text-[11px] font-semibold ${tierConf.color}`}>{tierConf.label}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="px-4 pt-4 space-y-4">
            {/* Revenue summary card */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl gradient-primary p-5 text-primary-foreground">
              <p className="text-sm opacity-80">Guadagni Totali</p>
              <p className="text-3xl font-bold mt-1">€{(creatorProfile?.total_revenue ?? 0).toFixed(2)}</p>
              <div className="flex items-center justify-between mt-3">
                <div>
                  <p className="text-xs opacity-70">In attesa di pagamento</p>
                  <p className="text-lg font-semibold">€{pendingTotal.toFixed(2)}</p>
                </div>
                <button onClick={requestPayout} disabled={requestingPayout || pendingTotal < (creatorProfile?.minimum_payout ?? 50)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-sm font-semibold disabled:opacity-50 transition-colors">
                  {requestingPayout ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                  Preleva
                </button>
              </div>
              <p className="text-[10px] opacity-60 mt-2">
                Revenue share: {creatorProfile?.revenue_share_percentage ?? tierConf.share}% · Min. prelievo: €{creatorProfile?.minimum_payout ?? 50}
              </p>
            </motion.div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Followers", value: creatorProfile?.total_followers ?? 0, Icon: Users, color: "text-blue-400" },
                { label: "Corsi Venduti", value: creatorProfile?.total_courses_sold ?? 0, Icon: BookOpen, color: "text-green-400" },
                { label: "Visualiz. Live", value: creatorProfile?.total_live_views ?? 0, Icon: Play, color: "text-red-400" },
              ].map(stat => (
                <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="bg-muted/40 rounded-xl p-3 text-center border border-border/30">
                  <stat.Icon className={`w-5 h-5 ${stat.color} mx-auto mb-1`} />
                  <p className="text-base font-bold">{stat.value.toLocaleString("it-IT")}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-muted/30 rounded-xl p-1">
              {(["overview", "earnings", "memberships", "partnerships"] as TabType[]).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                    activeTab === tab ? "bg-background shadow text-foreground" : "text-muted-foreground"
                  }`}>
                  {tab === "overview" ? "📊" : tab === "earnings" ? "💰" : tab === "memberships" ? "👑" : "🤝"}
                </button>
              ))}
            </div>

            {/* TAB: Overview */}
            {activeTab === "overview" && (
              <div className="space-y-3">
                <div className="bg-muted/40 rounded-2xl p-4 border border-border/30">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Revenue per Fonte</h3>
                  {Object.entries(SOURCE_LABELS).map(([key, label]) => {
                    const total = earnings.filter(e => e.source_type === key).reduce((s, e) => s + (e.net_amount ?? 0), 0);
                    return (
                      <div key={key} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <span className="text-xs font-semibold">€{total.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>

                {(tier === "free" || tier === "verified") && (
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-4 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-bold">Passa a Creator Pro</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">75% revenue share · Memberships · Consulenze 1-on-1 · Payout giornaliero</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-purple-400">€49.99<span className="text-xs font-normal">/mese</span></span>
                      <button onClick={() => navigate("/settings")}
                        className="px-3 py-1.5 rounded-full bg-purple-500 text-white text-xs font-semibold flex items-center gap-1">
                        Scopri di più <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Crea Corso", Icon: BookOpen, path: "/create-course", color: "text-blue-400" },
                    { label: "Vai in Live", Icon: Play, path: "/go-live", color: "text-red-400" },
                    { label: "Analitiche", Icon: TrendingUp, path: "/analytics", color: "text-green-400" },
                    { label: "Wallet", Icon: Wallet, path: "/wallet", color: "text-amber-400" },
                  ].map(a => (
                    <button key={a.path} onClick={() => navigate(a.path)}
                      className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border border-border/30 hover:border-primary/30 transition-colors">
                      <a.Icon className={`w-5 h-5 ${a.color}`} />
                      <span className="text-xs font-semibold">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Earnings */}
            {activeTab === "earnings" && (
              <div className="space-y-2">
                {earnings.length === 0 ? (
                  <div className="text-center py-10">
                    <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
                    <p className="text-sm text-muted-foreground">Nessun guadagno ancora</p>
                    <p className="text-xs text-muted-foreground mt-1">Pubblica un corso o vai in live!</p>
                  </div>
                ) : earnings.map(e => (
                  <div key={e.id} className="bg-muted/40 rounded-xl p-3 border border-border/30 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold">{SOURCE_LABELS[e.source_type] ?? e.source_type}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(e.created_at).toLocaleDateString("it-IT")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-400">+€{(e.net_amount ?? 0).toFixed(2)}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        e.status === "paid" ? "bg-green-500/10 text-green-400" :
                        e.status === "approved" ? "bg-blue-500/10 text-blue-400" :
                        "bg-amber-500/10 text-amber-400"
                      }`}>{e.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: Memberships */}
            {activeTab === "memberships" && (
              <div className="space-y-3">
                {memberships.length === 0 ? (
                  <div className="text-center py-8">
                    <Crown className="w-10 h-10 text-amber-400 mx-auto mb-2 opacity-60" />
                    <p className="text-sm text-muted-foreground">Nessuna membership attiva</p>
                    <button onClick={createMembership}
                      className="mt-3 flex items-center gap-1.5 mx-auto px-4 py-2 rounded-full gradient-primary text-primary-foreground text-sm font-semibold">
                      <Plus className="w-4 h-4" /> Crea Membership Bronze
                    </button>
                  </div>
                ) : memberships.map(m => (
                  <div key={m.id} className="bg-muted/40 rounded-xl p-4 border border-border/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-bold">{m.tier_name}</span>
                      </div>
                      <span className="text-base font-bold text-primary">€{m.tier_price}/mese</span>
                    </div>
                    {m.benefits.map((b, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <CheckCircle className="w-3 h-3 text-green-400 shrink-0" /> {b}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* TAB: Partnerships */}
            {activeTab === "partnerships" && (
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl p-4 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Handshake className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-bold">Brand Partnership Marketplace</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Ricevi proposte da brand beauty. Fee piattaforma: 15%</p>
                </div>
                {partnerships.length === 0 ? (
                  <div className="text-center py-6">
                    <Star className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
                    <p className="text-sm text-muted-foreground">Nessuna partnership attiva</p>
                    <p className="text-xs text-muted-foreground mt-1">I brand ti contatteranno quando il tuo profilo è ottimizzato</p>
                  </div>
                ) : partnerships.map(p => (
                  <div key={p.id} className="bg-muted/40 rounded-xl p-4 border border-border/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold">{p.brand_name}</span>
                      <span className="text-sm font-bold text-green-400">€{p.payment_amount}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.campaign_description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        p.status === "completed" ? "bg-green-500/10 text-green-400" :
                        p.status === "in_progress" ? "bg-blue-500/10 text-blue-400" :
                        "bg-amber-500/10 text-amber-400"
                      }`}>{p.status}</span>
                      {p.start_date && p.end_date && (
                        <span className="text-[10px] text-muted-foreground">{p.start_date} → {p.end_date}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
