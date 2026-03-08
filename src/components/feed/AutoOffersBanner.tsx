import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tag, MapPin, Percent, ChevronRight } from "lucide-react";

export default function AutoOffersBanner() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<any[]>([]);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      const { data } = await supabase.functions.invoke("ai-growth-engine", {
        body: { action: "auto_offers" },
      });
      if (data?.offers) setOffers(data.offers);
    } catch (e) {
      console.error("Auto offers error:", e);
    }
  };

  if (offers.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Percent className="w-4 h-4 text-primary" />
        <span className="text-xs font-bold text-primary">Offerte Smart</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {offers.map((offer, i) => (
          <button key={i} onClick={() => navigate(`/stylist/${offer.professional_id}`)}
            className="min-w-[200px] p-3 rounded-2xl bg-card border border-border/50 text-left flex-shrink-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Tag className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-bold text-primary">-{offer.discount}%</span>
            </div>
            <p className="text-sm font-semibold truncate">{offer.service_name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{offer.professional_name}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs line-through text-muted-foreground">€{offer.original_price}</span>
              <span className="text-sm font-bold text-primary">€{offer.offer_price}</span>
              <MapPin className="w-3 h-3 text-muted-foreground ml-auto" />
              <span className="text-[10px] text-muted-foreground">{offer.city || "—"}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
