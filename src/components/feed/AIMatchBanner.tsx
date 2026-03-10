import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, MapPin, Star, ChevronRight, Zap, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface AISuggestions {
  greeting?: string;
  nearbyPros?: { id: string; name: string; reason: string; matchScore: number }[];
  smartOffers?: { title: string; description: string; type: string }[];
  aiTips?: string[];
}

export default function AIMatchBanner() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [suggestions, setSuggestions] = useState<AISuggestions | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (user && profile && !dismissed) {
      loadSuggestions();
    }
  }, [user, profile]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-smart-match", {
        body: {
          user_city: profile?.city || "Milano",
          user_preferences: profile?.desired_categories || [],
          user_type: profile?.user_type || "client",
        },
      });
      // Handle 402/429 or error responses gracefully — just hide the banner
      if (error || data?.error) {
        console.warn("AI match unavailable:", data?.error || error);
        setDismissed(true);
      } else if (data) {
        setSuggestions(data);
      }
    } catch (e) {
      console.error("AI match error:", e);
      setDismissed(true);
    }
    setLoading(false);
  };

  if (dismissed || (!loading && !suggestions)) return null;

  return (
    <div className="mx-5 mb-4 rounded-2xl bg-card border border-primary/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
        <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold">AI Smart Match</p>
          <p className="text-[10px] text-muted-foreground">Suggerimenti personalizzati</p>
        </div>
        <button onClick={() => setDismissed(true)} className="text-[10px] text-muted-foreground">✕</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <span className="text-xs text-muted-foreground ml-2">Analisi in corso...</span>
        </div>
      ) : suggestions && (
        <div className="p-4 space-y-3">
          {/* Greeting */}
          {suggestions.greeting && (
            <p className="text-xs text-foreground leading-relaxed">{suggestions.greeting}</p>
          )}

          {/* Nearby Pros */}
          {suggestions.nearbyPros && suggestions.nearbyPros.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Vicino a te</p>
              {suggestions.nearbyPros.map((pro, i) => (
                <button key={i} onClick={() => navigate(`/stylist/${pro.id}`)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                    {pro.matchScore || 90}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{pro.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{pro.reason}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Smart Offers */}
          {suggestions.smartOffers && suggestions.smartOffers.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Offerte per te</p>
              {suggestions.smartOffers.map((offer, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-accent/10">
                  <Zap className="w-3.5 h-3.5 text-accent shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold truncate">{offer.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{offer.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI Tips */}
          {suggestions.aiTips && suggestions.aiTips.length > 0 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {suggestions.aiTips.map((tip, i) => (
                <span key={i} className="px-3 py-1.5 rounded-full bg-primary/10 text-[10px] text-primary font-medium whitespace-nowrap shrink-0">
                  💡 {tip}
                </span>
              ))}
            </div>
          )}

          {/* CTA */}
          <button onClick={() => navigate("/map-search")}
            className="w-full py-2 rounded-xl bg-primary/10 text-xs text-primary font-semibold flex items-center justify-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Esplora sulla mappa
          </button>
        </div>
      )}
    </div>
  );
}
