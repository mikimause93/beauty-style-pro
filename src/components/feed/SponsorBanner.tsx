import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, Megaphone } from "lucide-react";

interface AdCampaign {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  target_url: string | null;
  campaign_type: string;
}

export default function SponsorBanner() {
  const [ad, setAd] = useState<AdCampaign | null>(null);

  useEffect(() => {
    loadAd();
  }, []);

  const loadAd = async () => {
    const { data } = await supabase
      .from("ad_campaigns")
      .select("id, title, description, image_url, target_url, campaign_type")
      .eq("active", true)
      .limit(1)
      .maybeSingle();
    if (data) setAd(data);
  };

  const trackClick = async () => {
    if (!ad) return;
    try { await supabase.from("ad_campaigns").update({ clicks: (ad as any).clicks + 1 }).eq("id", ad.id); } catch {}
    if (ad.target_url) window.open(ad.target_url, "_blank", "noopener");
  };

  if (!ad) return null;

  return (
    <button onClick={trackClick} className="w-full rounded-2xl overflow-hidden bg-card border border-border/50 text-left transition-all hover:border-primary/20">
      {ad.image_url && (
        <img src={ad.image_url} alt={ad.title} className="w-full h-32 object-cover" />
      )}
      <div className="p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Megaphone className="w-3 h-3 text-muted-foreground" />
          <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Sponsorizzato</span>
        </div>
        <p className="text-sm font-semibold">{ad.title}</p>
        {ad.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ad.description}</p>}
        {ad.target_url && (
          <span className="inline-flex items-center gap-1 mt-2 text-[10px] text-primary font-semibold">
            Scopri di più <ExternalLink className="w-3 h-3" />
          </span>
        )}
      </div>
    </button>
  );
}
