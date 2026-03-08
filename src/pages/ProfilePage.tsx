import MobileLayout from "@/components/layout/MobileLayout";
import { Settings, Edit3, Heart, Calendar, Star, TrendingUp, Users, Eye, Coins, Share2, Copy, LogOut, LogIn, ChevronRight, Trophy, Gift, BarChart3, Briefcase, Building2, ShoppingBag, Radio, Video, MessageCircle, Bell } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
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

  if (!user) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
          <LogIn className="w-12 h-12 text-primary mb-4" />
          <h2 className="text-xl font-display font-bold mb-2">Accedi a Stayle</h2>
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
    { label: "Followers", value: (profile?.follower_count || 0).toLocaleString(), icon: Users },
    { label: "Following", value: (profile?.following_count || 0).toLocaleString(), icon: Heart },
    { label: "QR Coins", value: (profile?.qr_coins || 0).toLocaleString(), icon: Coins },
  ];

  const menuItems = [
    ...(isBusiness ? [{ icon: Building2, label: "Dashboard Business", path: "/business" }] : []),
    ...(isProfessional || isBusiness ? [{ icon: Briefcase, label: "Gestisci Annunci HR", path: "/hr" }] : []),
    { icon: Calendar, label: "I miei Appuntamenti", path: "/booking" },
    { icon: ShoppingBag, label: "Shop & Prodotti", path: "/shop" },
    { icon: Star, label: "Eventi & Workshop", path: "/events" },
    { icon: Users, label: "Cerca Stilisti", path: "/stylists" },
    { icon: Video, label: "Live Stream", path: "/live" },
    { icon: Radio, label: "Radio", path: "/radio" },
    { icon: BarChart3, label: "Leaderboard", path: "/leaderboard" },
    { icon: Trophy, label: "Challenges", path: "/challenges" },
    { icon: Gift, label: "Spin & Win", path: "/spin" },
    { icon: MessageCircle, label: "Chat", path: "/chat" },
  ];

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-display font-bold text-gradient-primary">Stayle</h1>
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
            <button onClick={() => navigate(isProfessional || isBusiness ? "/business" : "/booking")}
              className="flex-1 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold shadow-glow">
              {isProfessional || isBusiness ? 'Dashboard' : 'Book Appointment'}
            </button>
            <button onClick={() => navigate("/chat")}
              className="flex-1 py-2.5 rounded-xl bg-card border border-border text-sm font-semibold flex items-center justify-center gap-1.5">
              <Heart className="w-4 h-4 text-primary" /> Follow
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
            { icon: "🎰", label: "Spin", path: "/spin" },
            { icon: "🏆", label: "Challenges", path: "/challenges" },
            { icon: "💼", label: "Jobs", path: "/hr" },
            { icon: "🎪", label: "Events", path: "/events" },
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
              {tab === "posts" ? "Post" : tab === "analytics" ? "Analytics" : "Referral"}
            </button>
          ))}
        </div>

        {activeTab === "posts" && (
          <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden fade-in">
            {[beauty1, beauty2, stylist2, beauty3, beauty1, beauty2].map((img, i) => (
              <div key={i} className="aspect-square">
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-3 fade-in">
            <div className="rounded-xl gradient-card border border-border p-4 shadow-card">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold">Guadagni del Mese</h3>
                <span className="px-2 py-0.5 rounded-full gradient-primary text-primary-foreground text-[10px] font-bold">Totale</span>
              </div>
              <p className="text-3xl font-display font-bold text-gradient-gold">€ 4,280</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Viewers", value: "20.8K", change: "+8%" },
                { label: "Followers Growth", value: "19+", change: "+15%" },
                { label: "Engagement Rate", value: "50.10%", change: "+2%" },
                { label: "Revenue", value: "€4,280", change: "+12%" },
              ].map(data => (
                <div key={data.label} className="p-3 rounded-xl bg-card shadow-card">
                  <p className="text-[10px] text-muted-foreground">{data.label}</p>
                  <p className="text-lg font-bold">{data.value}</p>
                  <span className="text-[10px] font-semibold text-success">{data.change}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-card p-4 shadow-card">
              <p className="text-xs text-muted-foreground mb-3">Revenue Trend</p>
              <div className="flex items-end gap-1 h-24">
                {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-md gradient-primary" style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                {["L", "M", "M", "G", "V", "S", "D"].map((d, i) => (
                  <span key={i} className="text-[9px] text-muted-foreground flex-1 text-center">{d}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "referral" && (
          <div className="space-y-4 fade-in">
            <div className="rounded-2xl gradient-card border border-border p-5 text-center shadow-card">
              <span className="px-3 py-1 rounded-full gradient-primary text-primary-foreground text-xs font-bold">Invita & Guadagna</span>
              <h3 className="font-display font-bold text-lg mt-3">Il tuo Codice Referral</h3>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted mt-3">
                <code className="flex-1 text-lg font-mono text-primary font-bold tracking-widest">AB39-KD75</code>
                <button onClick={() => { navigator.clipboard.writeText("AB39-KD75"); toast.success("Codice copiato!"); }}
                  className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                  <Copy className="w-4 h-4 text-primary-foreground" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 rounded-xl bg-card">
                  <p className="text-xl font-bold text-gradient-gold">12</p>
                  <p className="text-[10px] text-muted-foreground">Inviti accettati</p>
                </div>
                <div className="p-3 rounded-xl bg-card">
                  <p className="text-xl font-bold text-gradient-gold">160 QRC</p>
                  <p className="text-[10px] text-muted-foreground">Guadagnati</p>
                </div>
              </div>
              <button onClick={() => { navigator.clipboard.writeText("AB39-KD75"); toast.success("Link copiato!"); }}
                className="w-full mt-4 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-glow flex items-center justify-center gap-2">
                <Share2 className="w-4 h-4" /> Condividi Codice
              </button>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
