import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Plus, Briefcase, Users, MapPin, Clock, Euro, Star, Filter, Search, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function HRPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"browse" | "my-posts" | "applications">("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const isEmployer = profile?.user_type === "professional" || profile?.user_type === "business";

  // Fetch all active job posts
  const { data: allJobs } = useQuery({
    queryKey: ["all_job_posts", searchQuery, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from("job_posts")
        .select(`
          *,
          professionals:professional_id(business_name, user_id, profiles:user_id(avatar_url)),
          businesses:business_id(business_name, logo_url, verified)
        `)
        .eq("status", "active")
        .gte("expiration_date", new Date().toISOString());

      if (selectedCategory) {
        query = query.eq("category", selectedCategory);
      }

      const { data } = await query.order("featured", { ascending: false }).order("created_at", { ascending: false });
      
      // Client-side search filter
      if (searchQuery && data) {
        return data.filter(job => 
          job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.location.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return data || [];
    },
  });

  // Fetch user's job posts (if employer)
  const { data: myJobPosts } = useQuery({
    queryKey: ["my_job_posts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get professional/business IDs
      const { data: prof } = await supabase
        .from("professionals")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      
      const { data: bus } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      let query = supabase.from("job_posts").select("*, job_applications(count)");
      
      if (prof) {
        query = query.eq("professional_id", prof.id);
      } else if (bus) {
        query = query.eq("business_id", bus.id);
      } else {
        return [];
      }

      const { data } = await query.order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user && isEmployer,
  });

  // Fetch user's applications (if job seeker)
  const { data: myApplications } = useQuery({
    queryKey: ["my_applications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("job_applications")
        .select(`
          *,
          job_posts:job_post_id(title, location, employment_type, salary_min, salary_max)
        `)
        .eq("applicant_id", user.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const categories = [
    { key: "hair", label: "Hair" },
    { key: "beauty", label: "Beauty" },
    { key: "nails", label: "Nails" },
    { key: "massage", label: "Massage" },
    { key: "barbershop", label: "Barber" },
    { key: "spa", label: "SPA" },
  ];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      sent: "bg-blue-500/20 text-blue-500",
      viewed: "bg-gold/20 text-gold",
      in_review: "bg-primary/20 text-primary",
      interview_scheduled: "bg-success/20 text-success",
      accepted: "bg-success/20 text-success",
      rejected: "bg-live/20 text-live",
    };
    const labels: Record<string, string> = {
      sent: "Inviata",
      viewed: "Visualizzata",
      in_review: "In revisione",
      interview_scheduled: "Colloquio",
      accepted: "Accettata",
      rejected: "Rifiutata",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${styles[status] || "bg-muted text-muted-foreground"}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-display font-bold">Beauty Jobs</h1>
          </div>
          {isEmployer && (
            <button
              onClick={() => navigate("/hr/create-job")}
              className="px-3 py-1.5 rounded-full gradient-primary text-primary-foreground text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Nuovo
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca posizione o città..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("browse")}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "browse" ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            Esplora
          </button>
          {isEmployer && (
            <button
              onClick={() => setActiveTab("my-posts")}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "my-posts" ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              Miei Annunci
            </button>
          )}
          <button
            onClick={() => setActiveTab("applications")}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "applications" ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            Candidature
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {activeTab === "browse" && (
          <>
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  !selectedCategory ? "gradient-primary text-primary-foreground" : "bg-card border border-border"
                }`}
              >
                Tutti
              </button>
              {categories.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(selectedCategory === cat.key ? null : cat.key)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedCategory === cat.key ? "gradient-primary text-primary-foreground" : "bg-card border border-border"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Job List */}
            <div className="space-y-3">
              {allJobs && allJobs.length > 0 ? (
              allJobs.map(job => {
                  const businessEmployer = job.businesses;
                  const professionalEmployer = job.professionals;
                  const employerName = businessEmployer?.business_name || professionalEmployer?.business_name;
                  const employerLogo = businessEmployer?.logo_url;
                  const isVerified = businessEmployer?.verified;
                  
                  return (
                    <div
                      key={job.id}
                      onClick={() => navigate(`/hr/job/${job.id}`)}
                      className="p-4 rounded-xl bg-card border border-border shadow-card cursor-pointer hover:border-primary/30 transition-all"
                    >
                      <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                          {employerLogo ? (
                            <img 
                              src={employerLogo} 
                              alt="" 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="w-full h-full gradient-primary flex items-center justify-center">
                              <Briefcase className="w-5 h-5 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-sm line-clamp-1">{job.title}</h3>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                {employerName}
                                {isVerified && <Star className="w-3 h-3 text-gold fill-gold" />}
                              </p>
                            </div>
                            {job.featured && (
                              <span className="px-2 py-0.5 rounded-full bg-gold/20 text-gold text-xs font-bold flex-shrink-0">
                                Featured
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" /> {job.location}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" /> {job.employment_type === "full_time" ? "Full-time" : job.employment_type}
                            </span>
                            {job.salary_min && (
                              <span className="flex items-center gap-1 text-xs text-success font-semibold">
                                <Euro className="w-3 h-3" /> {job.salary_min}€ - {job.salary_max}€
                              </span>
                            )}
                          </div>

                          {job.required_skills && job.required_skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {job.required_skills.slice(0, 3).map((skill: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                                  {skill}
                                </span>
                              ))}
                              {job.required_skills.length > 3 && (
                                <span className="text-xs text-muted-foreground">+{job.required_skills.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center">
                  <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nessun annuncio trovato</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "my-posts" && isEmployer && (
          <div className="space-y-3">
            {myJobPosts && myJobPosts.length > 0 ? (
              myJobPosts.map(job => (
                <div
                  key={job.id}
                  onClick={() => navigate(`/hr/job/${job.id}/manage`)}
                  className="p-4 rounded-xl bg-card border border-border shadow-card cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm">{job.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      job.status === "active" ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                    }`}>
                      {job.status === "active" ? "Attivo" : job.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{job.location} • {job.employment_type}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold">{job.application_count || 0}</span>
                      <span className="text-xs text-muted-foreground">candidature</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{job.view_count || 0} views</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">Non hai ancora pubblicato annunci</p>
                <button
                  onClick={() => navigate("/hr/create-job")}
                  className="px-6 py-2 rounded-full gradient-primary text-primary-foreground text-sm font-semibold"
                >
                  Crea il primo annuncio
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "applications" && (
          <div className="space-y-3">
            {myApplications && myApplications.length > 0 ? (
              myApplications.map(app => (
                <div
                  key={app.id}
                  onClick={() => navigate(`/hr/application/${app.id}`)}
                  className="p-4 rounded-xl bg-card border border-border shadow-card cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm">{app.job_posts?.title}</h3>
                    {getStatusBadge(app.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">{app.job_posts?.location} • {app.job_posts?.employment_type}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      Candidatura del {new Date(app.created_at).toLocaleDateString("it-IT")}
                    </span>
                    {app.ai_match_score && (
                      <span className="text-xs font-semibold text-primary">
                        Match: {Math.round(app.ai_match_score)}%
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nessuna candidatura inviata</p>
              </div>
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
