import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Search, MapPin, Star, Briefcase, ShoppingBag, Users, Sparkles, User, Navigation } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/layout/MobileLayout";
import stylist1 from "@/assets/stylist-1.jpg";
import beauty1 from "@/assets/beauty-1.jpg";
import { haversineDistance, getCoordsFromCity } from "@/hooks/useGeolocation";

type Tab = "tutti" | "persone" | "stilisti" | "servizi" | "prodotti" | "lavoro";

interface UserResult {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  user_type: string;
  city: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  // Pre-fill from ?q= (set by voice command "cerca [query]")
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [tab, setTab] = useState<Tab>("tutti");
  const [stylists, setStylists] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [users, setUsers] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Try to get user location for distance display
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserCoords([pos.coords.latitude, pos.coords.longitude]),
        () => {} // silent fail — distance just won't be shown
      );
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { if (query.trim().length >= 2) search(); }, 350);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, tab]);

  const search = async () => {
    setLoading(true);
    const q = `%${query}%`;

    // Search registered users (profiles) - also fetch location for distance
    if (tab === "tutti" || tab === "persone") {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, user_type, city, latitude, longitude")
        .ilike("display_name", q)
        .limit(15);
      if (data) setUsers(data as UserResult[]);
    }

    if (tab === "tutti" || tab === "stilisti") {
      const { data } = await supabase.from("professionals").select("*").or(`business_name.ilike.${q},specialty.ilike.${q},city.ilike.${q}`).limit(10);
      if (data) setStylists(data);
    }

    if (tab === "tutti" || tab === "servizi") {
      const { data } = await supabase.from("services").select("*, professionals(business_name)").or(`name.ilike.${q},category.ilike.${q}`).limit(10);
      if (data) setServices(data);
    }

    if (tab === "tutti" || tab === "prodotti") {
      const { data } = await supabase.from("products").select("*").or(`name.ilike.${q},category.ilike.${q}`).eq("active", true).limit(10);
      if (data) setProducts(data);
    }

    if (tab === "tutti" || tab === "lavoro") {
      const { data } = await supabase.from("job_posts").select("*").or(`title.ilike.${q},category.ilike.${q},location.ilike.${q}`).eq("status", "active").limit(10);
      if (data) setJobs(data);
    }

    setLoading(false);
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "tutti", label: "Tutti", icon: <Search className="w-3.5 h-3.5" /> },
    { key: "persone", label: "Persone", icon: <User className="w-3.5 h-3.5" /> },
    { key: "stilisti", label: "Stilisti", icon: <Users className="w-3.5 h-3.5" /> },
    { key: "servizi", label: "Servizi", icon: <Sparkles className="w-3.5 h-3.5" /> },
    { key: "prodotti", label: "Prodotti", icon: <ShoppingBag className="w-3.5 h-3.5" /> },
    { key: "lavoro", label: "Lavoro", icon: <Briefcase className="w-3.5 h-3.5" /> },
  ];

  const hasResults = users.length > 0 || stylists.length > 0 || services.length > 0 || products.length > 0 || jobs.length > 0;

  const userTypeLabel = (t: string) => {
    if (t === "professional") return "Professionista";
    if (t === "business") return "Business";
    return "Utente";
  };

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cerca persone, stilisti, servizi..."
              className="w-full h-11 rounded-xl bg-card border border-border pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 space-y-4 pb-24">
        {!query.trim() && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Cerca persone, parrucchieri, servizi o prodotti</p>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-card animate-pulse" />)}
          </div>
        )}

        {query.trim().length >= 2 && !loading && !hasResults && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">Nessun risultato per "{query}"</p>
          </div>
        )}

        {/* Registered Users / People */}
        {users.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Persone</h3>
            <div className="space-y-2">
              {users.map(u => {
                const uLat = u.latitude || (u.city ? getCoordsFromCity(u.city)[0] : null);
                const uLng = u.longitude || (u.city ? getCoordsFromCity(u.city)[1] : null);
                const dist = userCoords && uLat && uLng
                  ? Math.round(haversineDistance(userCoords[0], userCoords[1], uLat, uLng) * 10) / 10
                  : null;
                return (
                <button key={u.user_id} onClick={() => navigate(`/profile/${u.user_id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/20 transition-all text-left">
                  <img
                    src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.user_id}`}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{u.display_name || "Utente"}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {userTypeLabel(u.user_type)}
                      </span>
                      {u.city && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5" />{u.city}
                        </span>
                      )}
                      {dist !== null && (
                        <span className="text-xs text-primary font-semibold flex items-center gap-0.5">
                          <Navigation className="w-2.5 h-2.5" />{dist} km
                        </span>
                      )}
                    </div>
                  </div>
                </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Stylists */}
        {stylists.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Professionisti</h3>
            <div className="space-y-2">
              {stylists.map((s, i) => (
                <button key={s.id} onClick={() => navigate(`/stylist/${s.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/20 transition-all text-left">
                  <img src={i % 2 === 0 ? stylist1 : beauty1} alt="" className="w-12 h-12 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{s.business_name}</p>
                    <p className="text-xs text-muted-foreground">{s.specialty || "Beauty Pro"}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Star className="w-3 h-3 text-accent fill-accent" />
                      <span className="text-xs">{s.rating || "4.5"}</span>
                      {s.city && <span className="text-xs text-muted-foreground flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{s.city}</span>}
                    </div>
                  </div>
                  <span className="text-sm font-bold">€{s.hourly_rate || 40}/h</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Services */}
        {services.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Servizi</h3>
            <div className="space-y-2">
              {services.map(s => (
                <button key={s.id} onClick={() => navigate(`/booking/${s.professional_id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/20 transition-all text-left">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                    {s.duration_minutes}'
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.professionals?.business_name || s.category}</p>
                  </div>
                  <span className="text-sm font-bold text-primary">€{s.price}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        {products.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Prodotti</h3>
            <div className="grid grid-cols-2 gap-2">
              {products.map(p => (
                <button key={p.id} onClick={() => navigate("/shop")}
                  className="rounded-xl bg-card border border-border/50 overflow-hidden text-left">
                  <img src={p.image_url || beauty1} alt="" className="w-full aspect-square object-cover" />
                  <div className="p-2.5">
                    <p className="text-xs font-medium truncate">{p.name}</p>
                    <p className="text-sm font-bold text-primary mt-0.5">€{p.price}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Jobs */}
        {jobs.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Offerte di Lavoro</h3>
            <div className="space-y-2">
              {jobs.map(j => (
                <button key={j.id} onClick={() => navigate(`/hr/job/${j.id}`)}
                  className="w-full text-left p-3 rounded-xl bg-card border border-border/50 hover:border-primary/20 transition-all">
                  <p className="text-sm font-semibold truncate">{j.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{j.location} · {j.employment_type}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium">{j.category}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
