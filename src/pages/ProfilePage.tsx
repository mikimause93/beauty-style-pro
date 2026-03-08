import { Settings, Edit3, Heart, Calendar, Star, Users, Coins, Share2, Copy, LogOut, LogIn, ChevronRight, Trophy, Gift, BarChart3, Briefcase, Building2, ShoppingBag, Radio, Video, MessageCircle, Bell, Cog } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/layout/MobileLayout";
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
    if (user) { loadMyPosts(); loadReferral(); loadAnalytics(); }
  }, [user]);

  const loadMyPosts = async () => {
    const { data } = await supabase.from("posts").select("id, image_url, like_count, comment_count").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(12);
    setMyPosts(data || []);
  };

  const loadReferral = async () => {
    const { data: code } = await supabase.from("referral_codes").select("*").eq("user_id", user!.id).single();
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
      bookings: bookingsCount || 0, revenue,
      followers: profile?.follower_count || 0,
      engagement: myPosts.length > 0 ? Math.round((myPosts.reduce((s, p) => s + (p.like_count || 0), 0) / myPosts.length) * 10) / 10 : 0,
    });
  };

  if (!user) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
          <LogIn className="w-10 h-10 text-primary mb-4" />
          <h2 className="text-xl font-display font-bold mb-2">Accedi a STYLE</h2>
          <p className="text-sm text-muted-foreground mb-8">Registrati o accedi per gestire il tuo profilo</p>
          <button onClick={() => navigate("/auth")} className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold">
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
      {/* Header */}
      <header className="sticky top-0 z-40 glass px-5 py-3 flex items-center justify-between">
        <h1 className="text-lg font-display font-bold">Profilo</h1>
        <div className="flex gap-1.5">
          <button onClick={() => navigate("/profile/edit")} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
            <Edit3 className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={async () => { await signOut(); toast.success("Disconnesso"); navigate("/auth"); }} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={() => navigate("/notifications")} className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
            <Bell className="w-4 h-4 text-muted-foreground" />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />}
          </button>
        </div>
      </header>

      <div className="px-5 py-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full ring-2 ring-primary/20 ring-offset-2 ring-offset-background mb-3">
            <img src={profile?.avatar_url || stylist2} alt="Profile" className="w-full h-full rounded-full object-cover" />
          </div>
          <h2 className="text-lg font-display font-bold">{profile?.display_name || user.email}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isProfessional ? 'Professionista' : isBusiness ? 'Business' : 'Beauty Lover'}
          </p>

          <div className="flex gap-2 mt-5 w-full">
            <button onClick={() => navigate(isProfessional || isBusiness ? "/business" : "/my-bookings")}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
              {isProfessional || isBusiness ? 'Dashboard' : 'Prenotazioni'}
            </button>
            <button onClick={() => navigate("/referral")}
              className="flex-1 py-2.5 rounded-xl bg-card border border-border/50 text-sm font-semibold flex items-center justify-center gap-1.5">
              <Gift className="w-4 h-4 text-primary" /> Invita
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-8">
          {stats.map(s => {
            const Icon = s.icon;
            return (
              <button key={s.label} onClick={() => { if (s.label === "QR Coins") navigate("/qr-coins"); }}
                className="rounded-2xl bg-card border border-border/50 p-3.5 text-center">
                <Icon className="w-4 h-4 mx-auto mb-1.5 text-muted-foreground" />
                <p className="text-base font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
              </button>
            );
          })}
        </div>

        {/* Menu */}
        <div className="space-y-0.5 mb-8">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.label} onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/50 transition-colors text-left">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1 text-sm">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
              </button>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-muted rounded-xl p-1">
          {(["posts", "analytics", "referral"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}>
              {tab === "posts" ? "Post" : tab === "analytics" ? "Statistiche" : "Referral"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "posts" && (
          <div className="fade-in">
            {myPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 rounded-2xl overflow-hidden">
                {myPosts.map((post, i) => (
                  <div key={post.id} className="aspect-square relative group">
                    <img src={post.image_url || fallbackImages[i % fallbackImages.length]} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-background/0 group-hover:bg-background/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-foreground fill-foreground" />
                        <span className="text-xs font-bold text-foreground">{post.like_count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-3xl mb-2">📸</p>
                <p className="text-sm text-muted-foreground">Nessun post ancora</p>
                <button onClick={() => navigate("/create-post")} className="mt-4 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  Crea il primo post
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="grid grid-cols-2 gap-2 fade-in">
            {[
              { label: "Prenotazioni", value: analyticsData.bookings.toString(), icon: Calendar },
              { label: "Follower", value: analyticsData.followers.toLocaleString(), icon: Users },
              { label: "QR Coins", value: analyticsData.revenue.toLocaleString(), icon: Coins },
              { label: "Like medi", value: analyticsData.engagement.toString(), icon: Heart },
            ].map(data => {
              const Icon = data.icon;
              return (
                <div key={data.label} className="p-4 rounded-2xl bg-card border border-border/50">
                  <Icon className="w-4 h-4 text-muted-foreground mb-2" />
                  <p className="text-lg font-bold">{data.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{data.label}</p>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "referral" && (
          <div className="fade-in">
            <div className="rounded-2xl bg-card border border-border/50 p-5 text-center">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">Invita & Guadagna</span>
              <h3 className="font-display font-bold text-base mt-4">Il tuo Codice Referral</h3>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted mt-3">
                <code className="flex-1 text-base font-mono text-primary font-bold tracking-widest">{referralCode || "—"}</code>
                {referralCode && (
                  <button onClick={() => { navigator.clipboard.writeText(referralCode); toast.success("Codice copiato!"); }}
                    className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                    <Copy className="w-4 h-4 text-primary-foreground" />
                  </button>
                )}
              </div>
              {!referralCode && (
                <button onClick={() => navigate("/referral")} className="mt-4 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  Genera il tuo codice
                </button>
              )}
              <div className="grid grid-cols-2 gap-2 mt-5">
                <div className="p-3 rounded-xl bg-muted">
                  <p className="text-lg font-bold">{referralStats.invites}</p>
                  <p className="text-[10px] text-muted-foreground">Inviti accettati</p>
                </div>
                <div className="p-3 rounded-xl bg-muted">
                  <p className="text-lg font-bold">{referralStats.earned} QRC</p>
                  <p className="text-[10px] text-muted-foreground">Guadagnati</p>
                </div>
              </div>
              {referralCode && (
                <button onClick={() => { navigator.clipboard.writeText(referralCode); toast.success("Link copiato!"); }}
                  className="w-full mt-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2">
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