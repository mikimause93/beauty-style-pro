import { Users, Calendar, CreditCard, ShieldCheck, BarChart3, Clock, Crown, Rocket, DollarSign, Flag, FileCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/layout/MobileLayout";

export default function AdminPage() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<"overview" | "reports" | "verify">("overview");
  const [stats, setStats] = useState({ users: 0, bookings: 0, professionals: 0, businesses: 0, posts: 0, products: 0, subscriptions: 0, boosts: 0 });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [commission, setCommission] = useState(5);
  const [subBreakdown, setSubBreakdown] = useState<any[]>([]);

  useEffect(() => { loadStats(); }, [tab]);

  const loadStats = async () => {
    const [users, bookings, pros, biz, posts, products, subs, boosts, commissionRes, subDetail] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("bookings").select("id", { count: "exact", head: true }),
      supabase.from("professionals").select("id", { count: "exact", head: true }),
      supabase.from("businesses").select("id", { count: "exact", head: true }),
      supabase.from("posts").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("user_subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("profile_boosts").select("id", { count: "exact", head: true }).eq("active", true),
      supabase.from("platform_settings").select("value").eq("key", "booking_commission_percent").single(),
      supabase.from("user_subscriptions").select("*, subscription_plans(name, slug)").eq("status", "active"),
    ]);

    setStats({
      users: users.count || 0, bookings: bookings.count || 0,
      professionals: pros.count || 0, businesses: biz.count || 0,
      posts: posts.count || 0, products: products.count || 0,
      subscriptions: subs.count || 0, boosts: boosts.count || 0,
    });

    const cv = commissionRes.data?.value as any;
    if (cv?.value) setCommission(cv.value);
    if (subDetail.data) setSubBreakdown(subDetail.data);

    const { data: usersData } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(10);
    if (usersData) setRecentUsers(usersData);

    const { data: reps } = await supabase.from("user_reports").select("*").order("created_at", { ascending: false }).limit(50);
    if (reps) setReports(reps);

    const { data: veri } = await supabase.from("verification_requests").select("*").order("created_at", { ascending: false }).limit(50);
    if (veri) setVerifications(veri);
  };

  const planCounts = subBreakdown.reduce((acc: Record<string, number>, s: any) => {
    const name = s.subscription_plans?.name || "Unknown";
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const statCards = [
    { label: "Utenti", value: stats.users, Icon: Users, color: "text-primary" },
    { label: "Prenotazioni", value: stats.bookings, Icon: Calendar, color: "text-primary" },
    { label: "Professionisti", value: stats.professionals, Icon: ShieldCheck, color: "text-primary" },
    { label: "Business", value: stats.businesses, Icon: CreditCard, color: "text-primary" },
    { label: "Abbonamenti", value: stats.subscriptions, Icon: Crown, color: "text-primary" },
    { label: "Boost", value: stats.boosts, Icon: Rocket, color: "text-primary" },
  ];

  const tabs = [
    { key: "overview" as const, label: "Panoramica", Icon: BarChart3 },
    { key: "reports" as const, label: "Segnalazioni", Icon: Flag },
    { key: "verify" as const, label: "Verifiche", Icon: FileCheck },
  ];

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-5 py-3 flex items-center justify-between">
        <h1 className="text-lg font-display font-bold">Admin Panel</h1>
        <ShieldCheck className="w-5 h-5 text-primary" />
      </header>

      <div className="flex gap-1 px-5 pt-3 pb-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              tab === t.key ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
            }`}>
            <t.Icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-5 py-6 space-y-6">
        {tab === "overview" && (
          <>
            <div className="grid grid-cols-3 gap-3">
              {statCards.map(s => (
                <div key={s.label} className="rounded-2xl bg-card border border-border/50 p-4 text-center">
                  <s.Icon className={`w-5 h-5 mx-auto mb-2 ${s.color}`} />
                  <p className="text-xl font-display font-bold">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl gradient-primary p-5 text-primary-foreground">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5" />
                <h3 className="font-display font-bold">Business Overview</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="opacity-70 text-xs">Commissione</p><p className="font-bold text-lg">{commission}%</p></div>
                <div><p className="opacity-70 text-xs">Post</p><p className="font-bold text-lg">{stats.posts}</p></div>
                <div><p className="opacity-70 text-xs">Prodotti</p><p className="font-bold text-lg">{stats.products}</p></div>
                <div><p className="opacity-70 text-xs">Boost</p><p className="font-bold text-lg">{stats.boosts}</p></div>
              </div>
            </div>

            {Object.keys(planCounts).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Crown className="w-4 h-4 text-primary" /> Abbonamenti</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(planCounts).map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/50">
                      <span className="text-sm font-medium">{name}</span>
                      <span className="text-sm font-bold text-primary">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold mb-3">Utenti Recenti</h3>
              <div className="space-y-2">
                {recentUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
                    <img src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} alt="" className="w-9 h-9 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.display_name || "Utente"}</p>
                      <p className="text-[11px] text-muted-foreground">{u.user_type} · {u.city || "—"}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      u.verification_status === "verified" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    }`}>{u.verification_status === "verified" ? "✓ Verificato" : u.user_type}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === "reports" && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Flag className="w-4 h-4 text-destructive" /> Segnalazioni ({reports.length})</h3>
            {reports.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nessuna segnalazione</p>
            ) : reports.map(r => (
              <div key={r.id} className="p-4 rounded-2xl bg-card border border-border/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    r.status === "pending" ? "bg-yellow-500/15 text-yellow-600" : r.status === "resolved" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  }`}>{r.status}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString("it-IT")}</span>
                </div>
                <p className="text-sm font-semibold">{r.reason}</p>
                {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                <p className="text-[10px] text-muted-foreground">Tipo: {r.content_type}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "verify" && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2"><FileCheck className="w-4 h-4 text-primary" /> Richieste Verifica ({verifications.length})</h3>
            {verifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nessuna richiesta</p>
            ) : verifications.map(v => (
              <div key={v.id} className="p-4 rounded-2xl bg-card border border-border/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    v.status === "pending" ? "bg-yellow-500/15 text-yellow-600" : v.status === "approved" ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
                  }`}>{v.status}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(v.created_at).toLocaleDateString("it-IT")}</span>
                </div>
                <p className="text-sm font-semibold">{v.full_name || "—"}</p>
                <p className="text-xs text-muted-foreground">Tipo: {v.verification_type} · Doc: {v.document_type}</p>
                <p className="text-[10px] text-muted-foreground">{(v.document_urls || []).length} documenti</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}