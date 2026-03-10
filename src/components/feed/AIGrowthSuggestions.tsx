import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Calendar, Camera, Crown, Rocket, Video, Gift, Sparkles, ChevronRight, X } from "lucide-react";

const ICONS: Record<string, any> = { MapPin, Calendar, Camera, Crown, Rocket, Video, Gift, Sparkles };

const FALLBACK_SUGGESTIONS = [
  { icon: "Calendar", title: "Prenota il tuo primo appuntamento", description: "Scopri i migliori professionisti beauty vicino a te", target: "/booking" },
  { icon: "Crown", title: "Completa il tuo profilo", description: "I profili completi ricevono 4x più interazioni", target: "/edit-profile" },
  { icon: "Gift", title: "Invita amici, guadagna QR Coins", description: "Ogni invito vale 20 QRC per te e il tuo amico", target: "/referral" },
];

export default function AIGrowthSuggestions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<any[]>(FALLBACK_SUGGESTIONS);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (user) loadSuggestions();
  }, [user]);

  const loadSuggestions = async () => {
    try {
      const { data } = await supabase.functions.invoke("ai-growth-engine", {
        body: { action: "user_suggestions", user_id: user!.id },
      });
      if (data?.suggestions?.length) setSuggestions(data.suggestions);
    } catch (e) {
      // Keep fallback suggestions
    }
  };

  const visible = suggestions.filter((_, i) => !dismissed.has(i));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-xs font-bold text-primary">AI Suggerimenti</span>
      </div>
      {visible.slice(0, 3).map((s, idx) => {
        const realIdx = suggestions.indexOf(s);
        const Icon = ICONS[s.icon] || Sparkles;
        return (
          <div key={realIdx}
            className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/50 relative group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <button onClick={() => s.target && navigate(s.target)} className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold truncate">{s.title}</p>
              <p className="text-[11px] text-muted-foreground line-clamp-1">{s.description}</p>
            </button>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <button onClick={() => setDismissed(prev => new Set(prev).add(realIdx))}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
