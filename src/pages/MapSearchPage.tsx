import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Search, MapPin, Navigation, Star, Filter, Sparkles, Home, Locate, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";
import beauty1 from "@/assets/beauty-1.jpg";

type Professional = {
  id: string;
  business_name: string;
  specialty: string | null;
  city: string | null;
  rating: number | null;
  review_count: number | null;
  hourly_rate: number | null;
  address: string | null;
  description: string | null;
  is_verified: boolean | null;
  avatar?: string;
  distance?: number;
  aiScore?: number;
};

const fallbackAvatars = [stylist1, stylist2, beauty1];
const CITIES = ["Milano", "Roma", "Napoli", "Torino", "Firenze", "Bologna", "Palermo", "Genova", "Bari", "Catania"];
const SPECIALTIES = ["Hairstylist", "Colorist", "Barber", "Estetista", "Nail Artist", "Makeup Artist", "Massaggiatore"];

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const cityCoords: Record<string, [number, number]> = {
  milano: [45.4642, 9.19], roma: [41.9028, 12.4964], napoli: [40.8518, 14.2681],
  torino: [45.0703, 7.6869], firenze: [43.7696, 11.2558], bologna: [44.4949, 11.3426],
  palermo: [38.1157, 13.3615], genova: [44.4056, 8.9463], bari: [41.1171, 16.8719],
  catania: [37.5079, 15.09],
};

export default function MapSearchPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [maxDistance, setMaxDistance] = useState(50);
  const [homeService, setHomeService] = useState(false);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [userCoords, setUserCoords] = useState<[number, number]>([45.4642, 9.19]);
  const [userCity, setUserCity] = useState("Milano");
  const [showFilters, setShowFilters] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");

  useEffect(() => {
    loadProfessionals();
    loadUserLocation();
  }, [user]);

  const loadUserLocation = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("city, availability").eq("user_id", user.id).single();
    if (data?.city) setUserCity(data.city);
    const prefs = data?.availability as any;
    if (prefs?.latitude && prefs?.longitude) {
      setUserCoords([prefs.latitude, prefs.longitude]);
    } else if (data?.city) {
      const c = cityCoords[data.city.toLowerCase()];
      if (c) setUserCoords(c);
    }
    if (prefs?.search_distance) setMaxDistance(prefs.search_distance);
  };

  const detectGPS = async () => {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });
      setUserCoords([pos.coords.latitude, pos.coords.longitude]);
      // Find closest city
      let closest = "Milano"; let minDist = Infinity;
      for (const [name, [clat, clng]] of Object.entries(cityCoords)) {
        const d = Math.sqrt((pos.coords.latitude - clat) ** 2 + (pos.coords.longitude - clng) ** 2);
        if (d < minDist) { minDist = d; closest = name.charAt(0).toUpperCase() + name.slice(1); }
      }
      setUserCity(closest);
      toast.success(`Posizione: ${closest}`);
    } catch {
      toast.error("GPS non disponibile");
    }
  };

  const loadProfessionals = async () => {
    const { data } = await supabase.from("professionals").select("*, profiles:user_id(avatar_url, display_name)");
    if (data && data.length > 0) {
      setProfessionals(data.map((p: any) => ({
        ...p,
        avatar: (Array.isArray(p.profiles) ? p.profiles[0]?.avatar_url : p.profiles?.avatar_url) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
      })));
    } else {
      setProfessionals([
        { id: "1", business_name: "Martina Rossi", specialty: "Hairstylist", city: "Milano", rating: 4.9, review_count: 127, hourly_rate: 45, address: "Via Montenapoleone 12", description: "Specializzata in balayage", is_verified: true, avatar: stylist2 },
        { id: "2", business_name: "Sylvie Leaciu", specialty: "Colorist", city: "Roma", rating: 4.8, review_count: 89, hourly_rate: 55, address: "Via del Corso 45", description: "Esperta colorazioni", is_verified: true, avatar: stylist1 },
        { id: "3", business_name: "Marco Barberi", specialty: "Barber", city: "Napoli", rating: 4.7, review_count: 64, hourly_rate: 35, address: "Via Toledo 78", description: "Barber tradizionale", is_verified: false, avatar: beauty1 },
      ]);
    }
  };

  const professionalsWithDistance = useMemo(() => {
    return professionals.map(p => {
      const pCoords = cityCoords[(p.city || "").toLowerCase()] || cityCoords.milano;
      const distance = haversineDistance(userCoords[0], userCoords[1], pCoords[0], pCoords[1]);
      const aiScore = Math.min(100, Math.round(
        (p.rating || 0) * 12 + (p.review_count || 0) * 0.08 + (p.is_verified ? 15 : 0) + Math.max(0, 35 - distance * 0.08)
      ));
      return { ...p, distance: Math.round(distance * 10) / 10, aiScore };
    });
  }, [professionals, userCoords]);

  const filtered = useMemo(() => {
    return professionalsWithDistance
      .filter(p => {
        if (search && !p.business_name.toLowerCase().includes(search.toLowerCase()) && !(p.specialty || "").toLowerCase().includes(search.toLowerCase())) return false;
        if (cityFilter && (p.city || "").toLowerCase() !== cityFilter.toLowerCase()) return false;
        if (specialtyFilter && (p.specialty || "").toLowerCase() !== specialtyFilter.toLowerCase()) return false;
        if (p.distance !== undefined && p.distance > maxDistance) return false;
        return true;
      })
      .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
  }, [professionalsWithDistance, search, cityFilter, specialtyFilter, maxDistance]);

  const handleAiSearch = async () => {
    if (!search.trim()) { toast.error("Scrivi cosa cerchi..."); return; }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-beauty", {
        body: {
          type: "suggest_services",
          preferences: search,
          professionals: filtered.slice(0, 5).map(p => ({ name: p.business_name, specialty: p.specialty, city: p.city, rating: p.rating, distance: p.distance })),
        },
      });
      if (data?.suggestions) {
        setAiSuggestion(data.suggestions);
      } else {
        const topMatch = filtered[0];
        setAiSuggestion(topMatch
          ? `Ho trovato ${filtered.length} professionisti per "${search}". Il migliore è ${topMatch.business_name} (${topMatch.specialty}) a ${topMatch.distance}km da te con score ${topMatch.aiScore}%.`
          : `Nessun risultato per "${search}". Prova con un'altra ricerca.`
        );
      }
    } catch {
      const topMatch = filtered[0];
      setAiSuggestion(topMatch
        ? `${filtered.length} risultati per "${search}". Consigliato: ${topMatch.business_name} — ${topMatch.aiScore}% match.`
        : `Nessun risultato per "${search}".`
      );
    }
    setAiLoading(false);
  };

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-5 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold">Trova Professionisti</h1>
          <div className="ml-auto flex gap-1.5">
            <button onClick={detectGPS} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
              <Locate className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={() => setShowFilters(!showFilters)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
              <Filter className={`w-4 h-4 ${showFilters ? "text-primary" : "text-muted-foreground"}`} />
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAiSearch()}
              placeholder="Cerca per nome, specialità, città..."
              className="w-full h-10 rounded-xl bg-card border border-border/50 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
          <button onClick={handleAiSearch} disabled={aiLoading}
            className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50">
            <Sparkles className="w-4 h-4" />
            {aiLoading ? "..." : "AI"}
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 p-4 rounded-2xl bg-card border border-border/50 space-y-3 fade-in">
            <div className="flex gap-2">
              <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}
                className="flex-1 h-9 rounded-lg bg-muted border border-border/50 px-3 text-xs focus:outline-none">
                <option value="">Tutte le città</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={specialtyFilter} onChange={e => setSpecialtyFilter(e.target.value)}
                className="flex-1 h-9 rounded-lg bg-muted border border-border/50 px-3 text-xs focus:outline-none">
                <option value="">Tutte le specialità</option>
                {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[10px] text-muted-foreground">Distanza max</span>
                <span className="text-[10px] font-bold text-primary">{maxDistance} km</span>
              </div>
              <input type="range" min={5} max={300} value={maxDistance} onChange={e => setMaxDistance(Number(e.target.value))} className="w-full accent-primary h-1" />
            </div>
            <button onClick={() => setHomeService(!homeService)}
              className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
                homeService ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
              <Home className="w-4 h-4" /> A Domicilio
            </button>
          </div>
        )}
      </header>

      {/* AI Suggestion */}
      {aiSuggestion && (
        <div className="mx-5 mt-3 p-4 rounded-2xl bg-card border border-primary/10">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs leading-relaxed">{aiSuggestion}</p>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="mx-5 mt-3 rounded-2xl overflow-hidden border border-border/50 relative" style={{ height: 200 }}>
        <div className="w-full h-full bg-card flex items-center justify-center relative">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: "radial-gradient(circle, hsl(var(--primary)/0.3) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }} />
          <div className="absolute" style={{ top: "45%", left: "48%" }}>
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <Navigation className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="text-[8px] text-primary font-bold mt-0.5 block text-center">Tu</span>
          </div>
          {filtered.slice(0, 5).map((p, i) => {
            const positions = [
              { top: "20%", left: "25%" }, { top: "28%", left: "72%" },
              { top: "65%", left: "30%" }, { top: "58%", left: "75%" },
              { top: "15%", left: "52%" },
            ];
            return (
              <button key={p.id} onClick={() => navigate(`/stylist/${p.id}`)} className="absolute group" style={positions[i]}>
                <div className="w-7 h-7 rounded-full border-2 border-primary/30 overflow-hidden shadow-sm group-hover:scale-110 transition-transform">
                  <img src={p.avatar || fallbackAvatars[i % 3]} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="hidden group-hover:block absolute -top-7 left-1/2 -translate-x-1/2 bg-card px-2 py-1 rounded-lg shadow text-[8px] font-semibold whitespace-nowrap border border-border/50 z-10">
                  {p.business_name} · {p.distance}km
                </div>
              </button>
            );
          })}
          <div className="absolute bottom-2 right-2 bg-card/90 backdrop-blur px-2 py-1 rounded-lg text-[8px] text-muted-foreground border border-border/50">
            {userCity} · {filtered.length} risultati
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="px-5 py-4 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground">{filtered.length} professionisti</span>
          <span className="text-[10px] text-primary font-semibold">AI Match ↓</span>
        </div>

        {filtered.map((p, i) => (
          <button key={p.id} onClick={() => navigate(`/stylist/${p.id}`)}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-all duration-200 text-left">
            <div className="relative">
              <img src={p.avatar || fallbackAvatars[i % 3]} alt="" className="w-12 h-12 rounded-xl object-cover" />
              {p.is_verified && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-[7px] text-primary-foreground">✓</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{p.business_name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{p.specialty}</p>
              <div className="flex items-center gap-2 mt-1">
                <Star className="w-3 h-3 text-accent fill-accent" />
                <span className="text-[11px] font-medium">{p.rating || 0}</span>
                <span className="text-[10px] text-muted-foreground">·</span>
                <span className="text-[10px] text-muted-foreground">{p.distance} km</span>
                <span className="text-[10px] text-muted-foreground">·</span>
                <span className="text-[10px] text-muted-foreground">{p.city}</span>
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <div className="px-2 py-0.5 rounded-full bg-primary/10">
                <span className="text-[10px] font-bold text-primary">{p.aiScore}%</span>
              </div>
              <p className="text-sm font-bold">€{p.hourly_rate || 0}</p>
            </div>
          </button>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nessun risultato</p>
            <p className="text-xs text-muted-foreground mt-1">Prova ad ampliare la distanza</p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}