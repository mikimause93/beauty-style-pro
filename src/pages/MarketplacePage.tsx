import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Briefcase, MessageSquare, Users, Camera, MapPin, Euro, Clock, Plus, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Tab = "requests" | "casting" | "collab" | "nearby";

export default function MarketplacePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("requests");

  const { data: serviceRequests } = useQuery({
    queryKey: ["service_requests"],
    queryFn: async () => {
      const { data } = await supabase
        .from("service_requests")
        .select("*, profiles:user_id(display_name, avatar_url)")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const { data: castingPosts } = useQuery({
    queryKey: ["casting_posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("casting_posts")
        .select("*, profiles:creator_id(display_name, avatar_url)")
        .eq("status", "open")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const tabs = [
    { key: "requests" as Tab, label: "Richieste", Icon: MessageSquare },
    { key: "casting" as Tab, label: "Casting", Icon: Camera },
    { key: "collab" as Tab, label: "Collab", Icon: Users },
    { key: "nearby" as Tab, label: "Vicini", Icon: MapPin },
  ];

  const urgencyColor: Record<string, string> = {
    urgent: "bg-destructive/20 text-destructive",
    normal: "bg-primary/20 text-primary",
    flexible: "bg-muted text-muted-foreground",
  };

  const castingTypeLabel: Record<string, string> = {
    casting: "Casting",
    collaboration: "Collaborazione",
    model_search: "Ricerca Modelli",
    brand_collab: "Brand Collab",
  };

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-display font-bold">Marketplace</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/marketplace/create-request")}
              className="px-3 py-1.5 rounded-full gradient-primary text-primary-foreground text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Richiesta
            </button>
          </div>
        </div>

        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 rounded-xl text-[11px] font-semibold transition-all flex items-center justify-center gap-1 ${
                activeTab === tab.key ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              <tab.Icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 space-y-3">
        {/* Service Requests */}
        {activeTab === "requests" && (
          <>
            {serviceRequests && serviceRequests.length > 0 ? serviceRequests.map((req: any) => (
              <div key={req.id} className="p-4 rounded-xl bg-card border border-border shadow-card">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                      {req.profiles?.avatar_url ? (
                        <img src={req.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full gradient-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{req.profiles?.display_name || "Utente"}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(req.created_at).toLocaleDateString("it-IT")}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${urgencyColor[req.urgency] || urgencyColor.normal}`}>
                    {req.urgency === "urgent" ? "Urgente" : req.urgency === "flexible" ? "Flessibile" : "Normale"}
                  </span>
                </div>
                <h3 className="font-semibold text-sm mb-1">{req.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{req.description}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px]">{req.category}</span>
                  {req.location && (
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <MapPin className="w-3 h-3" /> {req.location}
                    </span>
                  )}
                  {req.budget_max && (
                    <span className="flex items-center gap-0.5 text-[10px] text-success font-semibold">
                      <Euro className="w-3 h-3" /> {req.budget_min ? `${req.budget_min}–` : ""}{req.budget_max}€
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/chat`)}
                    className="flex-1 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold"
                  >
                    💬 Rispondi
                  </button>
                  <button
                    onClick={() => {
                      const text = encodeURIComponent(`Ciao! Ho visto la tua richiesta "${req.title}" su Style`);
                      window.open(`https://wa.me/?text=${text}`, "_blank");
                    }}
                    className="py-2 px-4 rounded-xl bg-success/10 text-success text-xs font-semibold"
                  >
                    WhatsApp
                  </button>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nessuna richiesta di servizio</p>
                <button
                  onClick={() => navigate("/marketplace/create-request")}
                  className="mt-3 px-6 py-2 rounded-full gradient-primary text-primary-foreground text-sm font-semibold"
                >
                  Crea la prima richiesta
                </button>
              </div>
            )}
          </>
        )}

        {/* Casting */}
        {activeTab === "casting" && (
          <>
            <div className="flex justify-end mb-2">
              <button
                onClick={() => navigate("/marketplace/create-casting")}
                className="px-3 py-1.5 rounded-full gradient-primary text-primary-foreground text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Nuovo Casting
              </button>
            </div>
            {castingPosts && castingPosts.length > 0 ? castingPosts.map((cast: any) => (
              <div key={cast.id} className="p-4 rounded-xl bg-card border border-border shadow-card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-sm">{cast.title}</h3>
                    <p className="text-[10px] text-muted-foreground">{cast.profiles?.display_name}</p>
                  </div>
                  <div className="flex gap-1">
                    {cast.featured && (
                      <span className="px-2 py-0.5 rounded-full bg-gold/20 text-gold text-[10px] font-bold">Featured</span>
                    )}
                    <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold">
                      {castingTypeLabel[cast.casting_type] || cast.casting_type}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{cast.description}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {cast.location && (
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <MapPin className="w-3 h-3" /> {cast.location}
                    </span>
                  )}
                  {cast.compensation && (
                    <span className="text-[10px] text-success font-semibold">{cast.compensation}</span>
                  )}
                  {cast.event_date && (
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <Clock className="w-3 h-3" /> {new Date(cast.event_date).toLocaleDateString("it-IT")}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 rounded-xl gradient-primary text-primary-foreground text-xs font-semibold">
                    ✋ Candidati
                  </button>
                  <button
                    onClick={() => navigate(`/chat`)}
                    className="py-2 px-4 rounded-xl bg-primary/10 text-primary text-xs font-semibold"
                  >
                    💬 Chat
                  </button>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center">
                <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nessun casting disponibile</p>
              </div>
            )}
          </>
        )}

        {/* Collab */}
        {activeTab === "collab" && (
          <>
            {castingPosts?.filter((c: any) => c.casting_type === "collaboration" || c.casting_type === "brand_collab").length ? (
              castingPosts.filter((c: any) => c.casting_type === "collaboration" || c.casting_type === "brand_collab").map((cast: any) => (
                <div key={cast.id} className="p-4 rounded-xl bg-card border border-border shadow-card">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-sm">{cast.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{cast.description}</p>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 rounded-xl gradient-primary text-primary-foreground text-xs font-semibold">
                      🤝 Collabora
                    </button>
                    <button onClick={() => navigate(`/chat`)} className="py-2 px-4 rounded-xl bg-primary/10 text-primary text-xs font-semibold">
                      💬 Contatta
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nessuna collaborazione disponibile</p>
                <button
                  onClick={() => navigate("/marketplace/create-casting")}
                  className="mt-3 px-6 py-2 rounded-full gradient-primary text-primary-foreground text-sm font-semibold"
                >
                  Proponi collaborazione
                </button>
              </div>
            )}
          </>
        )}

        {/* Nearby */}
        {activeTab === "nearby" && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-sm">AI suggerisce</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Basandoci sulla tua posizione e il tuo profilo, ecco cosa c'è vicino a te.
              </p>
              <div className="space-y-2">
                <button onClick={() => navigate("/hr")} className="w-full py-2 rounded-xl bg-card border border-border text-xs font-semibold text-left px-3">
                  💼 Vedi offerte di lavoro vicine
                </button>
                <button onClick={() => navigate("/map-search")} className="w-full py-2 rounded-xl bg-card border border-border text-xs font-semibold text-left px-3">
                  📍 Professionisti nella tua zona
                </button>
                <button onClick={() => navigate("/stylists")} className="w-full py-2 rounded-xl bg-card border border-border text-xs font-semibold text-left px-3">
                  ✂️ Saloni vicino a te
                </button>
              </div>
            </div>

            {serviceRequests?.slice(0, 3).map((req: any) => (
              <div key={req.id} className="p-3 rounded-xl bg-card border border-border">
                <p className="text-xs font-semibold">{req.title}</p>
                <p className="text-[10px] text-muted-foreground">{req.location} • {req.category}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
