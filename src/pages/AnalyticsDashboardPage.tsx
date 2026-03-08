import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, Coins, Users, Star, Calendar, Eye, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/layout/MobileLayout";

export default function AnalyticsDashboardPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [period, setPeriod] = useState<"7d" | "30d" | "all">("30d");

  const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : 365;
  const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();

  const { data: bookingStats } = useQuery({
    queryKey: ["analytics-bookings", user?.id, period],
    queryFn: async () => {
      if (!user) return null;
      const { data: total } = await supabase
        .from("bookings")
        .select("id, status, total_price", { count: "exact" })
        .or(`client_id.eq.${user.id},professional_id.eq.${user.id}`)
        .gte("created_at", startDate);
      const completed = total?.filter(b => b.status === "completed") || [];
      const revenue = completed.reduce((sum, b) => sum + (b.total_price || 0), 0);
      return { total: total?.length || 0, completed: completed.length, revenue };
    },
    enabled: !!user,
  });

  const { data: postStats } = useQuery({
    queryKey: ["analytics-posts", user?.id, period],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("posts").select("id, like_count, comment_count").eq("user_id", user.id).gte("created_at", startDate);
      const totalLikes = data?.reduce((sum, p) => sum + p.like_count, 0) || 0;
      const totalComments = data?.reduce((sum, p) => sum + p.comment_count, 0) || 0;
      return { posts: data?.length || 0, likes: totalLikes, comments: totalComments };
    },
    enabled: !!user,
  });

  const { data: streamStats } = useQuery({
    queryKey: ["analytics-streams", user?.id, period],
    queryFn: async () => {
      if (!user) return null;
      const { data: pro } = await supabase.from("professionals").select("id").eq("user_id", user.id).single();
      if (!pro) return null;
      const { data } = await supabase.from("live_streams").select("id, total_views, total_earnings, total_tips, peak_viewers").eq("professional_id", pro.id).gte("created_at", startDate);
      return {
        count: data?.length || 0,
        totalViews: data?.reduce((s, d) => s + d.total_views, 0) || 0,
        totalEarnings: data?.reduce((s, d) => s + d.total_earnings, 0) || 0,
        peakViewers: Math.max(0, ...(data?.map(d => d.peak_viewers) || [0])),
      };
    },
    enabled: !!user,
  });

  const { data: txStats } = useQuery({
    queryKey: ["analytics-transactions", user?.id, period],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("transactions").select("type, amount").eq("user_id", user.id).gte("created_at", startDate);
      const earned = data?.filter(t => t.type === "earn").reduce((s, t) => s + Number(t.amount), 0) || 0;
      const spent = data?.filter(t => t.type === "spend").reduce((s, t) => s + Number(t.amount), 0) || 0;
      return { earned, spent, count: data?.length || 0 };
    },
    enabled: !!user,
  });

  const { data: leaderboardPos } = useQuery({
    queryKey: ["analytics-leaderboard", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("leaderboard").select("rank, score").eq("user_id", user.id).eq("leaderboard_type", "earnings").eq("period", "monthly").single();
      return data;
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
          <BarChart3 className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Accesso Richiesto</h2>
          <button onClick={() => navigate("/auth")} className="px-6 py-3 rounded-full gradient-primary text-primary-foreground font-bold">Accedi</button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-display font-bold">Analisi</h1>
        </div>
        <div className="flex gap-2">
          {(["7d", "30d", "all"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${period === p ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {p === "7d" ? "7 Giorni" : p === "30d" ? "30 Giorni" : "Sempre"}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<Coins className="w-5 h-5" />} label="QR Coins" value={(profile?.qr_coins || 0).toLocaleString()} color="gold" />
          <StatCard icon={<Users className="w-5 h-5" />} label="Follower" value={(profile?.follower_count || 0).toLocaleString()} color="primary" />
          <StatCard icon={<Star className="w-5 h-5" />} label="Posizione" value={leaderboardPos ? `#${leaderboardPos.rank}` : "—"} color="accent" />
          <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Punteggio" value={leaderboardPos?.score?.toLocaleString() || "0"} color="secondary" />
        </div>

        {/* Bookings */}
        <div className="rounded-xl bg-card border border-border p-5">
          <div className="flex items-center gap-2 mb-4"><Calendar className="w-5 h-5 text-primary" /><h3 className="font-semibold">Prenotazioni</h3></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center"><p className="text-2xl font-bold">{bookingStats?.total || 0}</p><p className="text-[10px] text-muted-foreground">Totali</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-success">{bookingStats?.completed || 0}</p><p className="text-[10px] text-muted-foreground">Completate</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-gold">€{bookingStats?.revenue?.toFixed(0) || 0}</p><p className="text-[10px] text-muted-foreground">Ricavi</p></div>
          </div>
        </div>

        {/* Engagement */}
        <div className="rounded-xl bg-card border border-border p-5">
          <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-secondary" /><h3 className="font-semibold">Coinvolgimento</h3></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center"><p className="text-2xl font-bold">{postStats?.posts || 0}</p><p className="text-[10px] text-muted-foreground">Post</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-primary">{postStats?.likes || 0}</p><p className="text-[10px] text-muted-foreground">Like</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-accent">{postStats?.comments || 0}</p><p className="text-[10px] text-muted-foreground">Commenti</p></div>
          </div>
        </div>

        {/* Wallet Stats */}
        {txStats && txStats.count > 0 && (
          <div className="rounded-xl bg-card border border-border p-5">
            <div className="flex items-center gap-2 mb-4"><Coins className="w-5 h-5 text-gold" /><h3 className="font-semibold">Portafoglio</h3></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center"><p className="text-2xl font-bold text-success">+{txStats.earned}</p><p className="text-[10px] text-muted-foreground">Guadagnati</p></div>
              <div className="text-center"><p className="text-2xl font-bold text-live">-{txStats.spent}</p><p className="text-[10px] text-muted-foreground">Spesi</p></div>
              <div className="text-center"><p className="text-2xl font-bold">{txStats.count}</p><p className="text-[10px] text-muted-foreground">Transazioni</p></div>
            </div>
          </div>
        )}

        {/* Streams */}
        {streamStats && streamStats.count > 0 && (
          <div className="rounded-xl bg-card border border-border p-5">
            <div className="flex items-center gap-2 mb-4"><Eye className="w-5 h-5 text-live" /><h3 className="font-semibold">Live Stream</h3></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center"><p className="text-2xl font-bold">{streamStats.count}</p><p className="text-[10px] text-muted-foreground">Dirette</p></div>
              <div className="text-center"><p className="text-2xl font-bold">{streamStats.totalViews}</p><p className="text-[10px] text-muted-foreground">Visualizzazioni</p></div>
              <div className="text-center"><p className="text-2xl font-bold text-gold">{streamStats.totalEarnings}</p><p className="text-[10px] text-muted-foreground">QRC Guadagnati</p></div>
              <div className="text-center"><p className="text-2xl font-bold text-primary">{streamStats.peakViewers}</p><p className="text-[10px] text-muted-foreground">Picco Spettatori</p></div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { Icon: Target, label: "Sfide", desc: "Guadagna ricompense", path: "/challenges" },
            { Icon: Trophy, label: "Classifica", desc: "Il tuo ranking", path: "/leaderboard" },
            { Icon: Gift, label: "Referral", desc: "Invita amici", path: "/referral" },
            { Icon: Sparkles, label: "Gira & Vinci", desc: "Tenta la fortuna", path: "/spin" },
          ].map(item => (
            <button key={item.label} onClick={() => navigate(item.path)}
              className="p-4 rounded-xl bg-card border border-border text-left hover:border-primary/30 transition-colors">
              <item.Icon className="w-6 h-6 text-primary mb-2" />
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = { gold: "text-gold", primary: "text-primary", secondary: "text-secondary", accent: "text-accent" };
  return (
    <div className="rounded-xl bg-card border border-border p-4 text-center">
      <div className={`${colorMap[color] || "text-primary"} mx-auto mb-2 flex justify-center`}>{icon}</div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
