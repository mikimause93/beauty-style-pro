import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Calendar, Camera, Crown, Rocket, Video, Gift, Sparkles, X, type LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type SuggestionIconKey = "MapPin" | "Calendar" | "Camera" | "Crown" | "Rocket" | "Video" | "Gift" | "Sparkles";

interface SuggestionItem {
  icon?: SuggestionIconKey;
  title: string;
  description: string;
  target?: string;
}

const ICONS: Record<SuggestionIconKey, LucideIcon> = { MapPin, Calendar, Camera, Crown, Rocket, Video, Gift, Sparkles };

const FALLBACK_SUGGESTIONS: SuggestionItem[] = [
  { icon: "Calendar", title: "Prenota il tuo primo appuntamento", description: "Scopri i migliori professionisti beauty vicino a te", target: "/booking" },
  { icon: "Crown", title: "Completa il tuo profilo", description: "I profili completi ricevono 4x più interazioni", target: "/profile/edit" },
  { icon: "Gift", title: "Invita amici, guadagna QR Coins", description: "Ogni invito vale 20 QRC per te e il tuo amico", target: "/referral" },
];

const SHOW_DURATION = 6000;
const HIDE_DURATION = 8000;

export default function AIGrowthSuggestions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>(FALLBACK_SUGGESTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [dismissed] = useState(false);
  const dismissTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (user) void loadSuggestions();
  }, [user]);

  useEffect(() => {
    if (dismissed || suggestions.length === 0) return;

    const timer = window.setTimeout(() => {
      if (visible) {
        setVisible(false);
        setCurrentIndex((prev) => (prev + 1) % suggestions.length);
      } else {
        setVisible(true);
      }
    }, visible ? SHOW_DURATION : HIDE_DURATION);

    return () => window.clearTimeout(timer);
  }, [visible, dismissed, suggestions.length]);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) {
        window.clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  const loadSuggestions = async () => {
    if (!user) return;

    try {
      const { data } = await supabase.functions.invoke("ai-growth-engine", {
        body: { action: "user_suggestions", user_id: user.id },
      });

      if (data?.suggestions?.length) {
        setSuggestions(data.suggestions as SuggestionItem[]);
      }
    } catch {
      // Keep fallback suggestions
    }
  };

  const handleDismiss = useCallback(() => {
    setVisible(false);

    if (dismissTimerRef.current) {
      window.clearTimeout(dismissTimerRef.current);
    }

    dismissTimerRef.current = window.setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % suggestions.length);
      setVisible(true);
    }, HIDE_DURATION);
  }, [suggestions.length]);

  if (dismissed || suggestions.length === 0) return null;

  const suggestion = suggestions[currentIndex];
  if (!suggestion) return null;
  const IconComponent = (suggestion.icon ? ICONS[suggestion.icon] : null) || Sparkles;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-primary/5 border border-primary/15">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <button
              type="button"
              onClick={() => suggestion.target && navigate(suggestion.target)}
              aria-label={suggestion.title}
              className="flex-1 min-w-0 text-left"
            >
              <p className="text-xs font-semibold truncate">{suggestion.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{suggestion.description}</p>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Nascondi suggerimento"
              className="w-6 h-6 rounded-full bg-muted/60 flex items-center justify-center flex-shrink-0"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
