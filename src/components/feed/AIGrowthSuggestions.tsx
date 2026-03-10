import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Calendar, Camera, Crown, Rocket, Video, Gift, Sparkles, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ICONS: Record<string, any> = { MapPin, Calendar, Camera, Crown, Rocket, Video, Gift, Sparkles };

const FALLBACK_SUGGESTIONS = [
  { icon: "Calendar", title: "Prenota il tuo primo appuntamento", description: "Scopri i migliori professionisti beauty vicino a te", target: "/booking" },
  { icon: "Crown", title: "Completa il tuo profilo", description: "I profili completi ricevono 4x più interazioni", target: "/edit-profile" },
  { icon: "Gift", title: "Invita amici, guadagna QR Coins", description: "Ogni invito vale 20 QRC per te e il tuo amico", target: "/referral" },
];

const ROTATE_INTERVAL = 5000;

export default function AIGrowthSuggestions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<any[]>(FALLBACK_SUGGESTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (user) loadSuggestions();
  }, [user]);

  useEffect(() => {
    if (dismissed || suggestions.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % suggestions.length);
    }, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, [suggestions.length, dismissed]);

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

  if (dismissed || suggestions.length === 0) return null;

  const s = suggestions[currentIndex];
  const Icon = ICONS[s.icon] || Sparkles;

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-1 mb-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-xs font-bold text-primary">AI Suggerimenti</span>
        <div className="flex-1" />
        <div className="flex gap-1">
          {suggestions.map((_, i) => (
            <span key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentIndex ? "bg-primary" : "bg-muted-foreground/30"}`} />
          ))}
        </div>
        <button onClick={() => setDismissed(true)} className="ml-1 text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/50"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <button onClick={() => s.target && navigate(s.target)} className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold truncate">{s.title}</p>
            <p className="text-[11px] text-muted-foreground line-clamp-1">{s.description}</p>
          </button>
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
