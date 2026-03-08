import { Users, Calendar, CreditCard, ShieldCheck, BarChart3, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/layout/MobileLayout";

export default function AdminPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, bookings: 0, professionals: 0, businesses: 0, posts: 0, products: 0 });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [users, bookings, pros, biz, posts, products] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("bookings").select("id", { count: "exact", head: true }),
      supabase.from("professionals").select("id", { count: "exact", head: true }),
      supabase.from("businesses").select("id", { count: "exact", head: true }),
      supabase.from("posts").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }),
    ]);
    setStats({
      users: users.count || 0,
      bookings: bookings.count || 0,
      professionals: pros.count || 0,
      businesses: biz.count || 0,
      posts: posts.count || 0,
      products: products.count || 0,
    });

    const { data: usersData } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(10);
    if (usersData) setRecentUsers(usersData);

    const { data: bookingsData } = await supabase.from("bookings").select("*, professionals(business_name)").order("created_at", { ascending: false }).limit(10);
    if (bookingsData) setRecentBookings(bookingsData);
  };

  const statCards = [
    { label: "Utenti", value: stats.users, Icon: Users, color: "text-primary" },
    { label: "Prenotazioni", value: stats.bookings, Icon: Calendar, color: "text-accent" },
    { label: "Professionisti", value: stats.professionals, Icon: ShieldCheck, color: "text-success" },
    { label: "Business", value: stats.businesses, Icon: CreditCard, color: "text-primary" },
    { label: "Post", value: stats.posts, Icon: BarChart3, color: "text-accent" },
    { label: "Prodotti", value: stats.products, Icon: CheckCircle, color: "text-success" },
  ];

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-5 py-3 flex items-center justify-between">
        <h1 className="text-lg font-display font-bold">Admin Panel</h1>
        <ShieldCheck className="w-5 h-5 text-primary" />
      </header>

      <div className="px-5 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {statCards.map(s => (
            <div key={s.label} className="rounded-2xl bg-card border border-border/50 p-4 text-center">
              <s.Icon className={`w-5 h-5 mx-auto mb-2 ${s.color}`} />
              <p className="text-xl font-display font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Users */}
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
                  u.user_type === "professional" ? "bg-primary/15 text-primary" : u.user_type === "business" ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
                }`}>{u.user_type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Bookings */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Prenotazioni Recenti</h3>
          <div className="space-y-2">
            {recentBookings.map(b => (
              <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
                <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{(b.professionals as any)?.business_name || "Pro"}</p>
                  <p className="text-[11px] text-muted-foreground">{b.booking_date} · {b.start_time}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  b.status === "completed" ? "bg-success/15 text-success" : b.status === "pending" ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
                }`}>{b.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
