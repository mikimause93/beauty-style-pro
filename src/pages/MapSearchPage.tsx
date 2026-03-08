import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Search, MapPin, Navigation, Star, Clock, Filter, Sparkles, Home, Locate, Route } from "lucide-react";
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

// Simulated city coordinates
const cityCoords: Record<string, [number, number]> = {
  milano: [45.4642, 9.19],
  roma: [41.9028, 12.4964],
  napoli: [40.8518, 14.2681],
  torino: [45.0703, 7.6869],
  firenze: [43.7696, 11.2558],
  bologna: [44.4949, 11.3426],
  palermo: [38.1157, 13.3615],
  genova: [44.4056, 8.9463],
  bari: [41.1171, 16.8719],
  catania: [37.5079, 15.09],
};

export default function MapSearchPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [maxDistance, setMaxDistance] = useState(50);
  const [homeService, setHomeService] = useState(false);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [userCity, setUserCity] = useState("Milano");
  const [showFilters, setShowFilters] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [viewMode, setViewMode] = useState<"map" | "list">("map");

  useEffect(() => {
    loadProfessionals();
    loadUserCity();
  }, [user]);

  const loadUserCity = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("city").eq("user_id", user.id).single();
    if (data?.city) setUserCity(data.city);
  };

  const loadProfessionals = async () => {
    const { data } = await supabase.from("professionals").select("*");
    if (data && data.length > 0) {
      setProfessionals(
        data.map((p, i) => ({
          ...p,
          avatar: fallbackAvatars[i % fallbackAvatars.length],
        }))
      );
    } else {
      setProfessionals([
        { id: "1", business_name: "Martina Rossi", specialty: "Hairstylist", city: "Milano", rating: 4.9, review_count: 127, hourly_rate: 45, address: "Via Montenapoleone 12", description: "Specializzata in balayage", is_verified: true, avatar: stylist2 },
        { id: "2", business_name: "Sylvie Leaciu", specialty: "Colorist", city: "Roma", rating: 4.8, review_count: 89, hourly_rate: 55, address: "Via del Corso 45", description: "Esperta colorazioni", is_verified: true, avatar: stylist1 },
        { id: "3", business_name: "Marco Barberi", specialty: "Barber", city: "Napoli", rating: 4.7, review_count: 64, hourly_rate: 35, address: "Via Toledo 78", description: "Barber tradizionale", is_verified: false, avatar: beauty1 },
        { id: "4", business_name: "Sofia Nails", specialty: "Nail Artist", city: "Milano", rating: 4.6, review_count: 42, hourly_rate: 30, address: "Corso Buenos Aires 33", description: "Nail art creativa", is_verified: true, avatar: stylist2 },
        { id: "5", business_name: "Luca Style", specialty: "Hairstylist", city: "Torino", rating: 4.5, review_count: 38, hourly_rate: 40, address: "Via Roma 15", description: "Tagli moderni", is_verified: false, avatar: beauty1 },
      ]);
    }
  };

  const professionalsWithDistance = useMemo(() => {
    const userCoords = cityCoords[userCity.toLowerCase()] || cityCoords.milano;
    return professionals.map((p) => {
      const pCoords = cityCoords[(p.city || "").toLowerCase()] || cityCoords.milano;
      const distance = haversineDistance(userCoords[0], userCoords[1], pCoords[0], pCoords[1]);
      const aiScore = Math.min(100, Math.round(
        (p.rating || 0) * 10 +
        (p.review_count || 0) * 0.1 +
        (p.is_verified ? 15 : 0) +
        Math.max(0, 30 - distance * 0.1)
      ));
      return { ...p, distance: Math.round(distance * 10) / 10, aiScore };
    });
  }, [professionals, userCity]);

  const filtered = useMemo(() => {
    return professionalsWithDistance
      .filter((p) => {
        if (search && !p.business_name.toLowerCase().includes(search.toLowerCase()) && !(p.specialty || "").toLowerCase().includes(search.toLowerCase())) return false;
        if (cityFilter && (p.city || "").toLowerCase() !== cityFilter.toLowerCase()) return false;
        if (specialtyFilter && (p.specialty || "").toLowerCase() !== specialtyFilter.toLowerCase()) return false;
        if (p.distance !== undefined && p.distance > maxDistance) return false;
        return true;
      })
      .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
  }, [professionalsWithDistance, search, cityFilter, specialtyFilter, maxDistance]);

  const handleAiSearch = async () => {
    if (!search.trim()) {
      toast.error("Scrivi cosa stai cercando...");
      return;
    }
    setAiLoading(true);
    // Simulate AI matching
    await new Promise((r) => setTimeout(r, 1200));
    const topMatch = filtered[0];
    if (topMatch) {
      setAiSuggestion(
        `🤖 Ho trovato ${filtered.length} professionisti per "${search}". Il match migliore è ${topMatch.business_name} (${topMatch.specialty}) a ${topMatch.city} con un punteggio AI del ${topMatch.aiScore}%. ${topMatch.distance}km da te.`
      );
    } else {
      setAiSuggestion(`🤖 Nessun risultato per "${search}". Prova con un'altra specialità o città.`);
    }
    setAiLoading(false);
  };

  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" /> Trova Professionisti
          </h1>
          <button onClick={() => setShowFilters(!showFilters)} className="ml-auto w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* AI Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAiSearch()}
              placeholder="Cerca per nome, specialità, città..."
              className="w-full h-10 rounded-xl bg-card border border-border pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            onClick={handleAiSearch}
            disabled={aiLoading}
            className="h-10 px-3 rounded-xl gradient-primary text-primary-foreground text-xs font-semibold flex items-center gap-1"
          >
            <Sparkles className="w-4 h-4" />
            {aiLoading ? "..." : "AI"}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-3 p-3 rounded-xl bg-card border border-border space-y-3 fade-in">
            <div className="flex items-center gap-2">
              <Locate className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold">La tua posizione:</span>
              <select
                value={userCity}
                onChange={(e) => setUserCity(e.target.value)}
                className="flex-1 h-8 rounded-lg bg-muted border border-border px-2 text-xs"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent" />
              <span className="text-xs font-semibold">Città:</span>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="flex-1 h-8 rounded-lg bg-muted border border-border px-2 text-xs"
              >
                <option value="">Tutte</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-gold" />
              <span className="text-xs font-semibold">Specialità:</span>
              <select
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="flex-1 h-8 rounded-lg bg-muted border border-border px-2 text-xs"
              >
                <option value="">Tutte</option>
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold flex items-center gap-1">
                  <Route className="w-4 h-4 text-secondary" /> Distanza max:
                </span>
                <span className="text-xs text-primary font-bold">{maxDistance} km</span>
              </div>
              <input
                type="range"
                min={5}
                max={500}
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <button
              onClick={() => setHomeService(!homeService)}
              className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                homeService ? "gradient-primary text-primary-foreground shadow-glow" : "bg-muted text-muted-foreground"
              }`}
            >
              <Home className="w-4 h-4" /> Servizio a Domicilio
            </button>
          </div>
        )}
      </header>

      {/* AI Suggestion */}
      {aiSuggestion && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
          <p className="text-xs text-foreground leading-relaxed">{aiSuggestion}</p>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex gap-2 px-4 mt-3">
        <button
          onClick={() => setViewMode("map")}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${viewMode === "map" ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          🗺️ Mappa
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${viewMode === "list" ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          📋 Lista
        </button>
      </div>

      {/* Home service banner */}
      {homeService && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-gradient-to-r from-accent/20 to-gold/20 border border-accent/30">
          <div className="flex items-center gap-2 mb-1">
            <Home className="w-4 h-4 text-accent" />
            <span className="text-xs font-bold text-accent">Servizio a Domicilio Attivo</span>
          </div>
          <p className="text-[10px] text-muted-foreground">I professionisti mostrati offrono servizio a domicilio nella tua zona.</p>
        </div>
      )}

      {/* Map View */}
      {viewMode === "map" && (
        <div className="mx-4 mt-3 rounded-xl overflow-hidden border border-border relative" style={{ height: 220 }}>
          {/* Simulated Map */}
          <div className="w-full h-full bg-gradient-to-br from-muted to-card flex items-center justify-center relative">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: "radial-gradient(circle at 30% 40%, hsl(var(--primary)/0.3) 2px, transparent 2px), radial-gradient(circle at 70% 60%, hsl(var(--secondary)/0.3) 2px, transparent 2px), radial-gradient(circle at 50% 30%, hsl(var(--accent)/0.3) 2px, transparent 2px)",
              backgroundSize: "60px 60px, 80px 80px, 40px 40px",
            }} />

            {/* User pin */}
            <div className="absolute" style={{ top: "45%", left: "48%" }}>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg animate-pulse">
                <Navigation className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-[9px] text-primary font-bold mt-0.5 block text-center">Tu</span>
            </div>

            {/* Professional pins */}
            {filtered.slice(0, 5).map((p, i) => {
              const positions = [
                { top: "20%", left: "25%" },
                { top: "30%", left: "70%" },
                { top: "65%", left: "35%" },
                { top: "55%", left: "75%" },
                { top: "15%", left: "55%" },
              ];
              return (
                <button
                  key={p.id}
                  onClick={() => navigate(`/stylist/${p.id}`)}
                  className="absolute group"
                  style={positions[i]}
                >
                  <div className="w-8 h-8 rounded-full border-2 border-accent overflow-hidden shadow-lg group-hover:scale-110 transition-transform">
                    <img src={p.avatar || fallbackAvatars[i % 3]} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-card px-2 py-1 rounded-lg shadow-lg text-[9px] font-semibold whitespace-nowrap border border-border z-10">
                    {p.business_name} · {p.distance}km
                  </div>
                </button>
              );
            })}

            <div className="absolute bottom-2 right-2 bg-card/90 backdrop-blur px-2 py-1 rounded-lg text-[9px] text-muted-foreground border border-border">
              📍 {userCity} · {filtered.length} risultati
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">{filtered.length} professionisti trovati</span>
          <span className="text-[10px] text-primary font-semibold">Ordinati per AI Match</span>
        </div>

        {filtered.map((p, i) => (
          <button
            key={p.id}
            onClick={() => navigate(`/stylist/${p.id}`)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-card shadow-card hover:bg-muted transition-all text-left"
          >
            <div className="relative">
              <img src={p.avatar || fallbackAvatars[i % 3]} alt="" className="w-14 h-14 rounded-xl object-cover" />
              {p.is_verified && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-[8px]">✓</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{p.business_name}</p>
              <p className="text-xs text-primary">{p.specialty}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-gold fill-gold" />
                  <span className="text-xs font-semibold">{p.rating || 0}</span>
                </div>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" /> {p.city}
                </span>
                <span className="text-[10px] text-secondary font-semibold flex items-center gap-0.5">
                  <Route className="w-3 h-3" /> {p.distance} km
                </span>
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-accent" />
                <span className="text-xs font-bold text-accent">{p.aiScore}%</span>
              </div>
              <p className="text-sm font-bold text-primary">€{p.hourly_rate || 0}</p>
              {homeService && (
                <span className="px-1.5 py-0.5 rounded-full bg-accent/20 text-accent text-[8px] font-semibold flex items-center gap-0.5">
                  <Home className="w-2.5 h-2.5" /> Domicilio
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(homeService ? `/home-service/${p.id}` : `/booking/${p.id}`);
                }}
                className="px-3 py-1 rounded-full gradient-primary text-primary-foreground text-[10px] font-semibold"
              >
                {homeService ? "Prenota a casa" : "Prenota"}
              </button>
            </div>
          </button>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nessun professionista trovato</p>
            <p className="text-xs text-muted-foreground mt-1">Prova ad ampliare la distanza o cambiare filtri</p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
