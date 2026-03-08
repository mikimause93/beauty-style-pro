import MobileLayout from "@/components/layout/MobileLayout";
import { Settings, Edit3, Heart, Calendar, Star, TrendingUp, Users, Eye, Coins, Share2, Copy, LogOut, LogIn } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import stylist2 from "@/assets/stylist-2.jpg";
import beauty1 from "@/assets/beauty-1.jpg";
import beauty2 from "@/assets/beauty-2.jpg";
import { toast } from "sonner";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"posts" | "analytics" | "referral">("posts");
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
          <LogIn className="w-12 h-12 text-primary mb-4" />
          <h2 className="text-xl font-display font-bold mb-2">Accedi a Stayle</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Registrati o accedi per gestire il tuo profilo
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="px-8 py-3 rounded-full gradient-primary text-primary-foreground font-semibold shadow-glow"
          >
            Accedi / Registrati
          </button>
        </div>
      </MobileLayout>
    );
  }

  const stats = [
    { label: "Followers", value: "12.4K", icon: Users },
    { label: "Total Views", value: "52.0K", icon: Eye },
    { label: "QR Coins", value: "3,450", icon: Coins },
  ];

  const analyticData = [
    { label: "Earnings This Month", value: "€4,280", change: "+12%", up: true },
    { label: "Bookings", value: "254", change: "+8%", up: true },
    { label: "Followers Growth", value: "+340", change: "+15%", up: true },
    { label: "Engagement Rate", value: "63.8%", change: "-2%", up: false },
  ];

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-display font-bold text-gradient-primary">Stayle</h1>
        <div className="flex gap-2">
          <button
            onClick={async () => { await signOut(); toast.success("Disconnesso"); navigate("/auth"); }}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
          >
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
          <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <Settings className="w-4 h-4 text-muted-foreground" />
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
          <p className="text-sm text-primary">💇‍♀️ {profile?.user_type === 'professional' ? 'Professional' : 'Beauty Lover'}</p>
          <div className="flex gap-3 mt-4">
            <button onClick={() => navigate("/booking")} className="px-6 py-2 rounded-full gradient-primary text-primary-foreground text-sm font-semibold shadow-glow">
              <Calendar className="w-4 h-4 inline mr-1" /> Book
            </button>
            <button onClick={() => navigate("/events")} className="px-6 py-2 rounded-full bg-card border border-border text-sm font-semibold">
              Events
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {stats.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl bg-card p-3 text-center shadow-card">
                <Icon className="w-4 h-4 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(["posts", "analytics", "referral"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all capitalize ${
                activeTab === tab
                  ? "gradient-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "posts" && (
          <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden fade-in">
            {[beauty1, beauty2, stylist2, beauty1, beauty2, stylist2].map((img, i) => (
              <div key={i} className="aspect-square">
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-3 fade-in">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Earnings This Month
            </h3>
            {analyticData.map(data => (
              <div key={data.label} className="flex items-center justify-between p-3 rounded-xl bg-card shadow-card">
                <div>
                  <p className="text-xs text-muted-foreground">{data.label}</p>
                  <p className="text-lg font-bold">{data.value}</p>
                </div>
                <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                  data.up ? "text-success bg-success/20" : "text-live bg-live/20"
                }`}>
                  {data.change}
                </span>
              </div>
            ))}

            {/* Simple chart placeholder */}
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
              <Share2 className="w-8 h-8 text-primary mx-auto mb-2" />
              <h3 className="font-display font-bold text-lg">Invite & Earn</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Invita i tuoi amici e guadagna QR Coins!
              </p>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted">
                <code className="flex-1 text-sm font-mono text-primary font-bold">AB39-KD75</code>
                <button className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <Copy className="w-4 h-4 text-primary-foreground" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 rounded-xl bg-card">
                  <p className="text-xl font-bold text-gradient-gold">8</p>
                  <p className="text-[10px] text-muted-foreground">Friends Invited</p>
                </div>
                <div className="p-3 rounded-xl bg-card">
                  <p className="text-xl font-bold text-gradient-gold">160 QRC</p>
                  <p className="text-[10px] text-muted-foreground">Earned</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Recent Referrals
              </h3>
              {["Eeveos Maoneshat", "MaRY Moeonproduet"].map((name, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card shadow-card">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-sm">
                    {name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">Joined 2 days ago</p>
                  </div>
                  <span className="text-xs font-semibold text-gold">+20 QRC</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
