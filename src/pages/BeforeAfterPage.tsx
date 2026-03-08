import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import beauty1 from "@/assets/beauty-1.jpg";
import beauty2 from "@/assets/beauty-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";
import stylist1 from "@/assets/stylist-1.jpg";

const fallbackItems = [
  { id: "1", title: "Balayage Transformation", stylist: "Martina Rossi", before: beauty3, after: beauty2, likes: 234 },
  { id: "2", title: "Color Correction", stylist: "Beauty Rossi", before: beauty1, after: stylist1, likes: 189 },
  { id: "3", title: "Trattamento Keratina", stylist: "Salon Luxe", before: beauty3, after: beauty2, likes: 312 },
];

export default function BeforeAfterPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState(fallbackItems);
  const [sliderPositions, setSliderPositions] = useState<Record<string, number>>({});

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
      }));
      setItems(dbItems);
    }
    // Initialize slider positions
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
  }, [items]);

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-display font-bold">Prima & Dopo</h1>
      </header>

      <div className="p-4 space-y-6">
        <p className="text-sm text-muted-foreground">Scopri le trasformazioni dei nostri stilisti ✨</p>

        {items.map(item => (
          <div key={item.id} className="rounded-2xl overflow-hidden bg-card shadow-card fade-in">
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
              <input type="range" min={10} max={90} value={sliderPositions[item.id] || 50}
                onChange={e => setSliderPositions(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20" />
            </div>
            <div className="p-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground">di {item.stylist}</p>
              </div>
              <div className="flex items-center gap-1 text-primary">
                <Heart className="w-4 h-4 fill-primary" />
                <span className="text-xs font-semibold">{item.likes}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </MobileLayout>
  );
}
