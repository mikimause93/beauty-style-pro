import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Users, Calendar, TrendingUp, Briefcase, Star, Settings, Plus, BarChart3, Building2, CheckCircle, Clock, XCircle, ClipboardList, CalendarClock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function BusinessDashboardPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // Fetch business data
  const { data: business } = useQuery({
    queryKey: ["business", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("businesses")
        .select("*")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  // Fetch professionals linked to this business
  const { data: teamMembers } = useQuery({
    queryKey: ["team_professionals", business?.user_id],
    queryFn: async () => {
      if (!business) return [];
      const { data } = await supabase
        .from("professionals")
        .select("*")
        .eq("city", business.city || "");
      return data || [];
    },
    enabled: !!business,
  });

  // Fetch job posts
  const { data: jobPosts } = useQuery({
    queryKey: ["job_posts", business?.id],
    queryFn: async () => {
      if (!business) return [];
      const { data } = await supabase
        .from("job_posts")
        .select("*, job_applications(count)")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!business,
  });

  // Fetch bookings count for the business professional
  const { data: bookingsCount } = useQuery({
    queryKey: ["business_bookings_count", business?.id],
    queryFn: async () => {
      if (!business) return 0;
      // Get professionals linked to this business owner
      const { data: prof } = await supabase
        .from("professionals")
        .select("id")
        .eq("user_id", business.user_id)
        .single();
      if (!prof) return 0;
      const { count } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("professional_id", prof.id);
      return count || 0;
    },
    enabled: !!business,
  });

  // Fetch revenue from purchases
  const { data: revenue } = useQuery({
    queryKey: ["business_revenue", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data } = await supabase
        .from("product_purchases")
        .select("total_price")
        .eq("buyer_id", user.id);
      return data?.reduce((sum, t) => sum + (Number(t.total_price) || 0), 0) || 0;
    },
    enabled: !!user,
  });

  const formatRevenue = (val: number) => {
    if (val >= 1000) return `€${(val / 1000).toFixed(1)}K`;
    return `€${val}`;
  };

  const stats = [
    { label: "Team", value: teamMembers?.length || 0, icon: Users, color: "text-primary" },
    { label: "Prenotazioni", value: bookingsCount || 0, icon: Calendar, color: "text-gold" },
    { label: "Fatturato", value: formatRevenue(revenue || 0), icon: TrendingUp, color: "text-success" },
    { label: "Annunci Attivi", value: jobPosts?.filter(j => j.status === "active").length || 0, icon: Briefcase, color: "text-live" },
  ];

  const quickActions = [
    { icon: Plus, label: "Nuovo Annuncio", onClick: () => navigate("/hr/create-job") },
    { icon: Users, label: "Gestisci Team", onClick: () => navigate("/business/team") },
    { icon: CalendarClock, label: "Turni Staff", onClick: () => navigate("/business/team/shifts") },
    { icon: ClipboardList, label: "Attività Log", onClick: () => navigate("/business/team/activity") },
    { icon: Calendar, label: "Prenotazioni", onClick: () => navigate("/booking") },
    { icon: BarChart3, label: "Analytics", onClick: () => navigate("/analytics") },
  ];

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold">Dashboard Business</h1>
        </div>
        <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <Settings className="w-4 h-4" />
        </button>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Business Header */}
        <div className="flex items-center gap-4 p-4 rounded-2xl gradient-card border border-border">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            {business?.logo_url ? (
              <img src={business.logo_url} alt="" className="w-full h-full rounded-xl object-cover" />
            ) : (
              <Building2 className="w-8 h-8 text-primary-foreground" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-display font-bold">{business?.business_name || profile?.display_name}</h2>
              {business?.verified && (
                <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{business?.city || "Milano"} • P.IVA: {business?.vat_number || "IT..."}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3 h-3 text-gold fill-gold" />
              <span className="text-xs font-semibold">{business?.rating || 4.8}</span>
              <span className="text-xs text-muted-foreground">({business?.review_count || 0} recensioni)</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="p-4 rounded-xl bg-card border border-border shadow-card">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-2xl font-display font-bold">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-all"
              >
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-[10px] text-muted-foreground text-center">{action.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Job Posts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Annunci Attivi</h3>
            <button onClick={() => navigate("/hr")} className="text-xs text-primary font-semibold">
              Vedi tutti
            </button>
          </div>

          {jobPosts && jobPosts.length > 0 ? (
            <div className="space-y-3">
              {jobPosts.slice(0, 3).map(job => (
                <div
                  key={job.id}
                  onClick={() => navigate(`/hr/job/${job.id}`)}
                  className="p-4 rounded-xl bg-card border border-border shadow-card cursor-pointer hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{job.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{job.location} • {job.employment_type}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      job.status === "active" ? "bg-success/20 text-success" :
                      job.status === "paused" ? "bg-gold/20 text-gold" : "bg-muted text-muted-foreground"
                    }`}>
                      {job.status === "active" ? "Attivo" : job.status === "paused" ? "In pausa" : "Chiuso"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs">{job.application_count || 0} candidature</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs">Scade {new Date(job.expiration_date).toLocaleDateString("it-IT")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-card border border-dashed border-border text-center">
              <Briefcase className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nessun annuncio attivo</p>
              <button
                onClick={() => navigate("/hr/create-job")}
                className="mt-3 px-4 py-2 rounded-full gradient-primary text-primary-foreground text-xs font-semibold"
              >
                Crea il primo annuncio
              </button>
            </div>
          )}
        </div>

        {/* Team Preview */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Il Tuo Team</h3>
            <button onClick={() => navigate("/business/team")} className="text-xs text-primary font-semibold">
              Gestisci
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {teamMembers && teamMembers.length > 0 ? (
              teamMembers.map(member => (
                <div key={member.id} className="flex-shrink-0 w-20 text-center">
                  <div className="w-14 h-14 rounded-full mx-auto mb-1 overflow-hidden border-2 border-border">
                    <div className="w-full h-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                      {(member.business_name || "?")[0]}
                    </div>
                  </div>
                  <p className="text-xs font-medium truncate">{member.business_name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{member.specialty || "Pro"}</p>
                </div>
              ))
            ) : (
              <div className="flex-shrink-0 w-20 text-center opacity-50">
                <div className="w-14 h-14 rounded-full mx-auto mb-1 bg-muted border-2 border-dashed border-border flex items-center justify-center">
                  <Plus className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-xs">Invita</p>
              </div>
            )}
            <button
              onClick={() => navigate("/business/team/invite")}
              className="flex-shrink-0 w-20 text-center"
            >
              <div className="w-14 h-14 rounded-full mx-auto mb-1 border-2 border-dashed border-primary/50 flex items-center justify-center hover:bg-primary/5 transition-colors">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs text-primary font-medium">Invita</p>
            </button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
