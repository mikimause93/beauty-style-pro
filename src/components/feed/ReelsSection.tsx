import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Heart, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import beauty1 from "@/assets/beauty-1.jpg";
import beauty2 from "@/assets/beauty-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";
import stylist1 from "@/assets/stylist-1.jpg";

const fallbackReels = [
  { id: "r1", image: beauty1, caption: "Balayage tutorial", likes: 1240, views: 5600 },
  { id: "r2", image: beauty2, caption: "Color correction", likes: 890, views: 3200 },
  { id: "r3", image: beauty3, caption: "Keratin magic", likes: 2100, views: 8900 },
  { id: "r4", image: stylist1, caption: "Fade perfetto", likes: 760, views: 2800 },
];

export default function ReelsSection() {
  const navigate = useNavigate();
  const [reels, setReels] = useState(fallbackReels);

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    const { data } = await supabase
      .from("posts")
      .select("id, image_url, caption, like_count, comment_count")
      .eq("post_type", "video")
      .order("like_count", { ascending: false })
      .limit(8);
    if (data && data.length > 0) {
      setReels(data.map((p, i) => ({
        id: p.id,
        image: p.image_url || fallbackReels[i % fallbackReels.length].image,
        caption: p.caption || "",
        likes: p.like_count,
        views: p.like_count * 4,
      })));
    }
  };

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between px-5 mb-3">
        <h3 className="text-sm font-semibold">Reels</h3>
        <button onClick={() => navigate("/shorts")} className="text-xs text-primary font-semibold">Vedi tutti</button>
      </div>
      <div className="flex gap-2.5 px-5 overflow-x-auto no-scrollbar">
        {reels.map(reel => (
          <button key={reel.id} onClick={() => navigate("/shorts")}
            className="relative min-w-[120px] w-[120px] h-[180px] rounded-2xl overflow-hidden bg-card border border-border/50 shrink-0">
            <img src={reel.image} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
            <div className="absolute top-2 right-2">
              <Play className="w-4 h-4 text-primary-foreground drop-shadow-lg" />
            </div>
            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-xs text-primary-foreground font-medium truncate drop-shadow-lg">{reel.caption}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-0.5 text-[8px] text-primary-foreground/80">
                  <Heart className="w-2.5 h-2.5" /> {reel.likes > 999 ? `${(reel.likes/1000).toFixed(1)}K` : reel.likes}
                </span>
                <span className="flex items-center gap-0.5 text-[8px] text-primary-foreground/80">
                  <Eye className="w-2.5 h-2.5" /> {reel.views > 999 ? `${(reel.views/1000).toFixed(1)}K` : reel.views}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
