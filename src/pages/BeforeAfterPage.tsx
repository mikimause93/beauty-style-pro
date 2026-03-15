import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, MapPin, Coins, Calendar, Sparkles, ThumbsUp, Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import beauty1 from "@/assets/beauty-1.jpg";
import beauty2 from "@/assets/beauty-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";
import stylist1 from "@/assets/stylist-1.jpg";

const fallbackItems = [
  { id: "1", title: "Balayage Transformation", stylist: "Martina Rossi", before: beauty3, after: beauty2, likes: 234, style_name: "Balayage Caramel", category: "color", price: 120, duration: "2h", replicable: true },
  { id: "2", title: "Color Correction", stylist: "Beauty Rossi", before: beauty1, after: stylist1, likes: 189, style_name: "Platinum Correction", category: "color", price: 95, duration: "1h30", replicable: true },
  { id: "3", title: "Trattamento Keratina", stylist: "Salon Luxe", before: beauty3, after: beauty2, likes: 312, style_name: "Keratina Glow", category: "hairstyle", price: 65, duration: "1h", replicable: true },
];

export default function BeforeAfterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState(fallbackItems);
  const [sliderPositions, setSliderPositions] = useState<Record<string, number>>({});
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadBeforeAfter();
  }, []);

  const loadBeforeAfter = async () => {
    const { data } = await supabase
      .from("posts")
      .select("*, profiles:user_id(display_name)")
      .eq("post_type", "before_after")
      .not("before_image_url", "is", null)
      .not("after_image_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data && data.length > 0) {
      const dbItems = data.map((p, i) => ({
        id: p.id,
        title: p.caption || "Trasformazione",
        stylist: (p.profiles as any)?.display_name || "Professionista",
        before: p.before_image_url || fallbackItems[i % fallbackItems.length].before,
        after: p.after_image_url || fallbackItems[i % fallbackItems.length].after,
        likes: p.like_count || 0,
        style_name: "",
        category: "hairstyle",
        price: 0,
        duration: "",
        replicable: true,
      }));
      setItems(dbItems);
    }
    const positions: Record<string, number> = {};
    (data && data.length > 0 ? data : fallbackItems).forEach(item => { positions[item.id] = 50; });
    setSliderPositions(positions);
  };

  useEffect(() => {
    if (Object.keys(sliderPositions).length === 0) {
      const positions: Record<string, number> = {};
      items.forEach(item => { positions[item.id] = 50; });
      setSliderPositions(positions);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const toggleLike = (id: string) => {
    setLikedIds(prev => { const n = new Set(prev); if (n.has(id)) { n.delete(id); } else { n.add(id); } return n; });
  };

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-display font-bold">Prima & Dopo</h1>
          <p className="text-[10px] text-muted-foreground">Scopri e prenota le trasformazioni</p>
        </div>
        <button onClick={() => navigate("/transformation-challenge")} className="px-3 py-1.5 rounded-full gradient-primary text-primary-foreground text-[10px] font-bold flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Challenge
        </button>
      </header>

      <div className="p-4 space-y-6">
        {items.map(item => (
          <div key={item.id} className="rounded-2xl overflow-hidden bg-card shadow-card border border-border/50 fade-in">
            <div className="relative aspect-square overflow-hidden">
              <img src={item.after} alt="Dopo" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPositions[item.id] || 50}%` }}>
                <img src={item.before} alt="Prima" className="w-full h-full object-cover"
                  style={{ width: `${100 / ((sliderPositions[item.id] || 50) / 100)}%`, maxWidth: 'none' }} />
              </div>
              <div className="absolute top-0 bottom-0 w-0.5 bg-primary-foreground z-10"
                style={{ left: `${sliderPositions[item.id] || 50}%` }}>
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-glow">
                  <div className="flex items-center">
                    <ChevronLeft className="w-3 h-3 text-primary-foreground" />
                    <ChevronRight className="w-3 h-3 text-primary-foreground" />
                  </div>
                </div>
              </div>
              <div className="absolute top-3 left-3 px-2 py-1 rounded-full glass text-[10px] font-bold">Prima</div>
              <div className="absolute top-3 right-3 px-2 py-1 rounded-full glass text-[10px] font-bold">Dopo</div>
              {item.replicable && (
                <div className="absolute bottom-3 left-3 px-2 py-1 rounded-full bg-accent/20 text-accent text-[10px] font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Replicabile
                </div>
              )}
              <input type="range" min={10} max={90} value={sliderPositions[item.id] || 50}
                onChange={e => setSliderPositions(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20" />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">di {item.stylist}</p>
                </div>
                {item.style_name && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">{item.style_name}</span>
                )}
              </div>

              {/* Style Info */}
              {(item.price > 0 || item.duration) && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {item.price > 0 && <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-medium">€{item.price}</span>}
                  {item.duration && <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-medium">⏱ {item.duration}</span>}
                  <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-medium capitalize">{item.category}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button onClick={() => toggleLike(item.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
                  likedIds.has(item.id) ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  <Heart className={`w-4 h-4 ${likedIds.has(item.id) ? "fill-primary text-primary" : ""}`} />
                  <span className="text-xs font-bold">{item.likes + (likedIds.has(item.id) ? 1 : 0)}</span>
                </button>
                <button onClick={() => setSavedIds(prev => { const n = new Set(prev); if (n.has(item.id)) { n.delete(item.id); } else { n.add(item.id); } return n; })}
                  className={`p-2 rounded-xl ${savedIds.has(item.id) ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  <Bookmark className={`w-4 h-4 ${savedIds.has(item.id) ? "fill-primary" : ""}`} />
                </button>
                <div className="flex-1" />
                {item.replicable && (
                  <button onClick={() => navigate("/stylists")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl gradient-primary text-primary-foreground text-xs font-bold shadow-glow">
                    <MapPin className="w-3.5 h-3.5" /> Prova vicino a te
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </MobileLayout>
  );
}