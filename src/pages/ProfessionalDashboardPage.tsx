import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Calendar, TrendingUp, Star, Package, Settings, BarChart3, Users, Clock, CheckCircle, XCircle, Wallet, ShoppingBag, Scissors, MapPin, Eye, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import VerifiedBadge from "@/components/VerifiedBadge";

export default function ProfessionalDashboardPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const { data: professional } = useQuery({
    queryKey: ["my-professional", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("professionals").select("*").eq("user_id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ["pro-stats", professional?.id],
    queryFn: async () => {
      if (!professional) return null;
      const [bookingsRes, servicesRes, productsRes, reviewsRes] = await Promise.all([
        supabase.from("bookings").select("id, status, total_price", { count: "exact" }).eq("professional_id", professional.id),
        supabase.from("services").select("id", { count: "exact" }).eq("professional_id", professional.id),
        supabase.from("products").select("id", { count: "exact" }).eq("seller_id", user!.id),
        supabase.from("reviews").select("id, rating", { count: "exact" }).eq("professional_id", professional.id),
      ]);
      const bookings = bookingsRes.data || [];
      const confirmed = bookings.filter(b => b.status === "confirmed").length;
      const pending = bookings.filter(b => b.status === "pending").length;
      const revenue = bookings.filter(b => b.status === "confirmed").reduce((sum, b) => sum + (b.total_price || 0), 0);
      return {
        totalBookings: bookingsRes.count || 0,
        confirmedBookings: confirmed,
        pendingBookings: pending,
        totalServices: servicesRes.count || 0,
        totalProducts: productsRes.count || 0,
        totalReviews: reviewsRes.count || 0,
        avgRating: professional.rating || 0,
        revenue,
      };
    },
    enabled: !!professional,
  });

  const { data: recentBookings } = useQuery({
    queryKey: ["pro-recent-bookings", professional?.id],
    queryFn: async () => {
      if (!professional) return [];
      const { data } = await supabase
        .from("bookings")
        .select("*, profiles:client_id(display_name, avatar_url)")
        .eq("professional_id", professional.id)
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!professional,
  });

  if (!user) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
          <Scissors className="w-10 h-10 text-primary mb-4" />
          <h2 className="text-xl font-display font-bold mb-2">Pannello Professionista</h2>
          <p className="text-sm text-muted-foreground mb-6">Accedi per gestire la tua attività</p>
          <button onClick={() => navigate("/auth")} className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold">Accedi</button>
        </div>
      </MobileLayout>
    );
  }

  if (!professional) {
    return (
      <MobileLayout>
        <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-display font-bold">Pannello Professionista</h1>
        </header>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <Scissors className="w-10 h-10 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">Non hai ancora un profilo professionista.</p>
          <button onClick={() => navigate("/become-creator")} className="mt-4 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            Diventa Professionista
          </button>
        </div>
      </MobileLayout>
    );
  }

  const statCards = [
    { label: "Prenotazioni", value: stats?.totalBookings || 0, icon: Calendar, color: "bg-primary/10 text-primary" },
    { label: "In Attesa", value: stats?.pendingBookings || 0, icon: Clock, color: "bg-yellow-500/10 text-yellow-500" },
    { label: "Confermate", value: stats?.confirmedBookings || 0, icon: CheckCircle, color: "bg-green-500/10 text-green-500" },
    { label: "Ricavo Tot.", value: `€${(stats?.revenue || 0).toFixed(0)}`, icon: TrendingUp, color: "bg-blue-500/10 text-blue-500" },
  ];

  const quickActions = [
    { label: "Servizi", icon: Scissors, count: stats?.totalServices || 0, path: "/manage-products" },
    { label: "Prodotti", icon: ShoppingBag, count: stats?.totalProducts || 0, path: "/manage-products" },
    { label: "Recensioni", icon: Star, count: stats?.totalReviews || 0, path: "/profile" },
    { label: "Analytics", icon: BarChart3, count: null, path: "/analytics" },
    { label: "Wallet", icon: Wallet, count: profile?.qr_coins || 0, path: "/wallet" },
    { label: "Boost", icon: Eye, count: null, path: "/boost" },
    { label: "Chat", icon: MessageCircle, count: null, path: "/chat" },
    { label: "Impostazioni", icon: Settings, count: null, path: "/settings" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed": return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 font-semibold">Confermato</span>;
      case "pending": return <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 font-semibold">In Attesa</span>;
      case "cancelled": return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-semibold">Annullato</span>;
      default: return <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">{status}</span>;
    }
  };

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-display font-bold flex items-center gap-2">
            Pannello Pro
            {profile?.verification_status === "approved" && <VerifiedBadge size="sm" />}
          </h1>
          <p className="text-[11px] text-muted-foreground">{professional.business_name}</p>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10">
          <Star className="w-3.5 h-3.5 text-accent fill-accent" />
          <span className="text-xs font-bold">{professional.rating?.toFixed(1) || "N/A"}</span>
        </div>
      </header>

      <div className="p-4 space-y-5">
        {/* Verification Warning */}
        {profile?.verification_status !== "approved" && (
          <button onClick={() => navigate("/verify-account")}
            className="w-full p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-yellow-500 shrink-0" />
            <div className="text-left flex-1">
              <p className="text-xs font-semibold text-yellow-600">Account non verificato</p>
              <p className="text-[10px] text-muted-foreground">Verifica il tuo account per sbloccare tutte le funzioni</p>
            </div>
          </button>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map(card => (
            <div key={card.label} className="p-4 rounded-2xl bg-card border border-border/50">
              <div className={`w-9 h-9 rounded-xl ${card.color} flex items-center justify-center mb-2`}>
                <card.icon className="w-5 h-5" />
              </div>
              <p className="text-xl font-display font-bold">{card.value}</p>
              <p className="text-[11px] text-muted-foreground">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Location */}
        {professional.city && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{professional.city} {professional.address && `— ${professional.address}`}</span>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Gestione Rapida</h3>
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map(action => (
              <button key={action.label} onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all">
                <action.icon className="w-5 h-5 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">{action.label}</span>
                {action.count !== null && (
                  <span className="text-[10px] font-bold text-primary">{action.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Bookings */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Prenotazioni Recenti</h3>
            <button onClick={() => navigate("/my-bookings")} className="text-xs text-primary font-semibold">Vedi Tutto</button>
          </div>
          {(!recentBookings || recentBookings.length === 0) ? (
            <div className="text-center py-8 rounded-xl bg-card border border-border/50">
              <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nessuna prenotazione</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentBookings.map((booking: any) => (
                <button key={booking.id} onClick={() => navigate(`/my-bookings/${booking.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 text-left hover:border-primary/30 transition-all">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {(booking.profiles as any)?.display_name || "Cliente"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(booking.booking_date).toLocaleDateString("it-IT")} — {booking.start_time}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {booking.total_price && <p className="text-xs font-bold text-primary">€{booking.total_price}</p>}
                    {getStatusBadge(booking.status)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
