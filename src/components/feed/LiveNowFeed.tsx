import { Eye, Coins, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LiveStream {
  id: string;
  title: string;
  thumbnail_url: string | null;
  viewer_count: number;
  category: string | null;
  qr_coin_pool: number | null;
  professional?: { business_name: string; user_id?: string } | null;
}

interface LiveNowFeedProps {
  streams: LiveStream[];
}

export default function LiveNowFeed({ streams }: LiveNowFeedProps) {
  const navigate = useNavigate();

  if (!streams || streams.length === 0) return null;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
          <h2 className="font-display font-bold text-base">LIVE ORA</h2>
        </div>
        <button onClick={() => navigate("/live")} className="text-xs font-semibold text-primary">
          Vedi tutte →
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
        {streams.map(s => (
          <button
            key={s.id}
            onClick={() => navigate("/live")}
            className="relative min-w-[160px] aspect-[3/4] rounded-2xl overflow-hidden bg-card shrink-0 group"
          >
            <img
              src={s.thumbnail_url || "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400"}
              alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/40" />

            {/* Top badges */}
            <div className="absolute top-2 left-2 flex gap-1.5">
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive-foreground animate-pulse" /> LIVE
              </span>
            </div>
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              <span className="flex items-center gap-1 px-2 py-1 rounded-full glass text-[10px] font-medium">
                <Eye className="w-3 h-3" /> {s.viewer_count}
              </span>
              {(s.qr_coin_pool || 0) > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent/20 text-accent text-[10px] font-bold">
                  <Coins className="w-3 h-3" /> {s.qr_coin_pool}
                </span>
              )}
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-0 inset-x-0 p-3">
              <div className="flex items-center gap-2 mb-1">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s.professional?.user_id || s.id}`}
                  alt="" className="w-7 h-7 rounded-full border border-primary"
                />
                <p className="text-xs font-bold truncate">{s.professional?.business_name || "Streamer"}</p>
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-1">{s.title}</p>
              {s.category && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] font-bold capitalize">{s.category}</span>
              )}
            </div>

            {/* Play overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center">
                <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
