import MobileLayout from "@/components/layout/MobileLayout";
import { Settings, Edit3, Heart, Calendar, Star, TrendingUp, Users, Eye, Coins, Share2, Copy, LogOut, LogIn, ChevronRight, Trophy, Gift, BarChart3, Briefcase, Building2, ShoppingBag, Radio, Video, MessageCircle, Bell, Cog } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import stylist2 from "@/assets/stylist-2.jpg";
import beauty1 from "@/assets/beauty-1.jpg";
import beauty2 from "@/assets/beauty-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";
import { toast } from "sonner";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"posts" | "analytics" | "referral">("posts");
  const { user, profile, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralStats, setReferralStats] = useState({ invites: 0, earned: 0 });
  const [analyticsData, setAnalyticsData] = useState({ bookings: 0, revenue: 0, followers: 0, engagement: 0 });

  useEffect(() => {
    if (user) {
      loadMyPosts();
      loadReferral();
      loadAnalytics();
    }
  }, [user]);

  const loadMyPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select("id, image_url, like_count, comment_count")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(12);
    setMyPosts(data || []);
  };

  const loadReferral = async () => {
    const { data: code } = await supabase
      .from("referral_codes")
      .select("*")
      .eq("user_id", user!.id)
      .single();
    if (code) {
      setReferralCode(code.code);
      setReferralStats({ invites: code.usage_count || 0, earned: (code.usage_count || 0) * (code.reward_qr_coin || 10) });
    }
  };

  const loadAnalytics = async () => {
    const [{ count: bookingsCount }, { data: transactions }] = await Promise.all([
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("client_id", user!.id),
      supabase.from("transactions").select("amount").eq("user_id", user!.id).eq("type", "credit"),
    ]);
    const revenue = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    setAnalyticsData({
      bookings: bookingsCount || 0,
      revenue,
      followers: profile?.follower_count || 0,
      engagement: myPosts.length > 0 ? Math.round((myPosts.reduce((s, p) => s + (p.like_count || 0), 0) / myPosts.length) * 10) / 10 : 0,
    });
  };

  if (!user) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
          <LogIn className="w-12 h-12 text-primary mb-4" />
          <h2 className="text-xl font-display font-bold mb-2">Accedi a STYLE</h2>
          <p className="text-sm text-muted-foreground mb-6">Registrati o accedi per gestire il tuo profilo</p>
          <button onClick={() => navigate("/auth")} className="px-8 py-3 rounded-full gradient-primary text-primary-foreground font-semibold shadow-glow">
            Accedi / Registrati
          </button>
        </div>
      </MobileLayout>
    );
  }

  const isProfessional = profile?.user_type === 'professional';
  const isBusiness = profile?.user_type === 'business';

  const stats = [
    { label: "Follower", value: (profile?.follower_count || 0).toLocaleString(), icon: Users },
    { label: "Seguiti", value: (profile?.following_count || 0).toLocaleString(), icon: Heart },
    { label: "QR Coins", value: (profile?.qr_coins || 0).toLocaleString(), icon: Coins },
  ];

  const menuItems = [
    ...(isBusiness ? [{ icon: Building2, label: "Dashboard Business", path: "/business" }] : []),
    ...(isProfessional || isBusiness ? [{ icon: Briefcase, label: "Gestisci Annunci HR", path: "/hr" }] : []),
    { icon: Calendar, label: "I miei Appuntamenti", path: "/my-bookings" },
    { icon: ShoppingBag, label: "Shop & Prodotti", path: "/shop" },
    { icon: Star, label: "Eventi & Workshop", path: "/events" },
    { icon: Users, label: "Cerca Stilisti", path: "/stylists" },
    { icon: Video, label: "Live Stream", path: "/live" },
    { icon: Radio, label: "Radio", path: "/radio" },
    { icon: BarChart3, label: "Classifica", path: "/leaderboard" },
    { icon: Trophy, label: "Sfide", path: "/challenges" },
    { icon: Gift, label: "Gira & Vinci", path: "/spin" },
    { icon: MessageCircle, label: "Chat", path: "/chat" },
    { icon: Cog, label: "Impostazioni", path: "/settings" },
  ];

  const fallbackImages = [beauty1, beauty2, stylist2, beauty3, beauty1, beauty2];

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-display font-bold text-gradient-primary">STYLE</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate("/profile/edit")} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <Edit3 className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={async () => { await signOut(); toast.success("Disconnesso"); navigate("/auth"); }} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={() => navigate("/notifications")} className="relative w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <Bell className="w-4 h-4 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-destructive flex items-center justify-center px-0.5">
                <span className="text-[9px] font-bold text-destructive-foreground">{unreadCount}</span>
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="px-4 py-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full p-0.5 gradient-primary mb-3">
            <img src={profile?.avatar_url || stylist2} alt="Profile" className="w-full h-full rounded-full object-cover border-2 border-background" />
          </div>
          <h2 className="text-xl font-display font-bold">{profile?.display_name || user.email}</h2>
          <p className="text-sm text-primary">
            {isProfessional ? '💇‍♀️ Professionista' : isBusiness ? '🏢 Business' : '💖 Beauty Lover'}
          </p>

          <div className="flex gap-3 mt-4 w-full">
            <button onClick={() => navigate(isProfessional || isBusiness ? "/business" : "/my-bookings")}
              className="flex-1 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold shadow-glow">
              {isProfessional || isBusiness ? 'Dashboard' : 'Prenotazioni'}
            </button>
            <button onClick={() => navigate("/referral")}
              className="flex-1 py-2.5 rounded-xl bg-card border border-border text-sm font-semibold flex items-center justify-center gap-1.5">
              <Gift className="w-4 h-4 text-primary" /> Invita Amici
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {stats.map(s => {
            const Icon = s.icon;
            return (
              <button key={s.label} onClick={() => { if (s.label === "QR Coins") navigate("/qr-coins"); }}
                className="rounded-xl bg-card p-3 text-center shadow-card">
                <Icon className="w-4 h-4 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </button>
            );
          })}
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { icon: "🎰", label: "Gira", path: "/spin" },
            { icon: "🏆", label: "Sfide", path: "/challenges" },
            { icon: "💼", label: "Lavoro", path: "/hr" },
            { icon: "🎪", label: "Eventi", path: "/events" },
          ].map(qa => (
            <button key={qa.label} onClick={() => navigate(qa.path)}
              className="flex flex-col items-center gap-1 py-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all">
              <span className="text-xl">{qa.icon}</span>
              <span className="text-[10px] text-muted-foreground">{qa.label}</span>
            </button>
          ))}
        </div>

        {/* Menu Items */}
        <div className="space-y-1 mb-6">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.label} onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-all text-left">
                <Icon className="w-4 h-4 text-primary" />
                <span className="flex-1 text-sm font-medium">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(["posts", "analytics", "referral"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all capitalize ${activeTab === tab ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {tab === "posts" ? "Post" : tab === "analytics" ? "Statistiche" : "Referral"}
            </button>
          ))}
        </div>

        {activeTab === "posts" && (
          <div className="fade-in">
            {myPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
                {myPosts.map((post, i) => (
                  <div key={post.id} className="aspect-square relative">
                    <img src={post.image_url || fallbackImages[i % fallbackImages.length]} alt="" className="w-full h-full object-cover" />
                    <div className="absolute bottom-1 left-1 flex items-center gap-1 bg-background/60 rounded-full px-1.5 py-0.5">
                      <Heart className="w-2.5 h-2.5 text-primary" />
                      <span className="text-[9px] font-bold">{post.like_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-4xl mb-2">📸</p>
                <p className="text-sm text-muted-foreground">Nessun post ancora</p>
                <button onClick={() => navigate("/create-post")} className="mt-3 px-4 py-2 rounded-full gradient-primary text-primary-foreground text-xs font-semibold">
                  Crea il primo post
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-3 fade-in">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Prenotazioni", value: analyticsData.bookings.toString(), icon: Calendar },
                { label: "Follower", value: analyticsData.followers.toLocaleString(), icon: Users },
                { label: "QR Coins guadagnati", value: analyticsData.revenue.toLocaleString(), icon: Coins },
                { label: "Like medi/post", value: analyticsData.engagement.toString(), icon: Heart },
              ].map(data => {
                const Icon = data.icon;
                return (
                  <div key={data.label} className="p-3 rounded-xl bg-card shadow-card">
                    <Icon className="w-4 h-4 text-primary mb-1" />
                    <p className="text-lg font-bold">{data.value}</p>
                    <p className="text-[10px] text-muted-foreground">{data.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "referral" && (
          <div className="space-y-4 fade-in">
            <div className="rounded-2xl gradient-card border border-border p-5 text-center shadow-card">
              <span className="px-3 py-1 rounded-full gradient-primary text-primary-foreground text-xs font-bold">Invita & Guadagna</span>
              <h3 className="font-display font-bold text-lg mt-3">Il tuo Codice Referral</h3>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted mt-3">
                <code className="flex-1 text-lg font-mono text-primary font-bold tracking-widest">{referralCode || "—"}</code>
                {referralCode && (
                  <button onClick={() => { navigator.clipboard.writeText(referralCode); toast.success("Codice copiato!"); }}
                    className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                    <Copy className="w-4 h-4 text-primary-foreground" />
                  </button>
                )}
              </div>
              {!referralCode && (
                <button onClick={() => navigate("/referral")} className="mt-3 px-4 py-2 rounded-full gradient-primary text-primary-foreground text-xs font-semibold">
                  Genera il tuo codice
                </button>
              )}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 rounded-xl bg-card">
                  <p className="text-xl font-bold text-gradient-gold">{referralStats.invites}</p>
                  <p className="text-[10px] text-muted-foreground">Inviti accettati</p>
                </div>
                <div className="p-3 rounded-xl bg-card">
                  <p className="text-xl font-bold text-gradient-gold">{referralStats.earned} QRC</p>
                  <p className="text-[10px] text-muted-foreground">Guadagnati</p>
                </div>
              </div>
              {referralCode && (
                <button onClick={() => { navigator.clipboard.writeText(referralCode); toast.success("Link copiato!"); }}
                  className="w-full mt-4 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-glow flex items-center justify-center gap-2">
                  <Share2 className="w-4 h-4" /> Condividi Codice
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}