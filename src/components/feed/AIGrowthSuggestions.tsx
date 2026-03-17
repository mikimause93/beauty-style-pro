import { useState, useEffect, useCallback } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Calendar, Camera, Crown, Rocket, Video, Gift, Sparkles, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ICONS: Record<string, React.ElementType> = { MapPin, Calendar, Camera, Crown, Rocket, Video, Gift, Sparkles };

const FALLBACK_SUGGESTIONS = [
  { icon: "Calendar", title: "Prenota il tuo primo appuntamento", description: "Scopri i migliori professionisti beauty vicino a te", target: "/booking" },
  { icon: "Crown", title: "Completa il tuo profilo", description: "I profili completi ricevono 4x più interazioni", target: "/profile/edit" },
  { icon: "Gift", title: "Invita amici, guadagna QR Coins", description: "Ogni invito vale 20 QRC per te e il tuo amico", target: "/referral" },
];

interface Suggestion {
  icon: string;
  title: string;
  description: string;
  target: string;
}

const SHOW_DURATION = 6000; // visible for 6 seconds
const HIDE_DURATION = 8000; // hidden for 8 seconds between appearances

export default function AIGrowthSuggestions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<Suggestion[]>(FALLBACK_SUGGESTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (user) loadSuggestions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Auto show/hide cycle
  useEffect(() => {
    if (dismissed || suggestions.length === 0) return;

    let timer: ReturnType<typeof setTimeout>;

    if (visible) {
      // After SHOW_DURATION, hide and move to next
      timer = setTimeout(() => {
        setVisible(false);
        setCurrentIndex(prev => (prev + 1) % suggestions.length);
      }, SHOW_DURATION);
    } else {
      // After HIDE_DURATION, show again
      timer = setTimeout(() => {
        setVisible(true);
      }, HIDE_DURATION);
    }

    return () => clearTimeout(timer);
  }, [visible, dismissed, suggestions.length]);

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

  const handleDismiss = useCallback(() => {
    setVisible(false);
    // Temporarily dismiss - will reappear after HIDE_DURATION
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % suggestions.length);
      setVisible(true);
    }, HIDE_DURATION);
  }, [suggestions.length]);

  if (dismissed || suggestions.length === 0) return null;

  const s = suggestions[currentIndex];
  const Icon = ICONS[s.icon] || Sparkles;

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
            <button onClick={() => s.target && navigate(s.target)} className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold truncate">{s.title}</p>
              <p className="text-[10px] text-muted-foreground line-clamp-1">{s.description}</p>
            </button>
            <button onClick={handleDismiss} className="w-6 h-6 rounded-full bg-muted/60 flex items-center justify-center flex-shrink-0">
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
