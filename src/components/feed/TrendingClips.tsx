import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Heart, Eye, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TrendingClip {
  id: string;
  caption: string | null;
  image_url: string | null;
  video_url: string | null;
  like_count: number;
  profileName: string;
  avatar: string;
}

export default function TrendingClips() {
  const navigate = useNavigate();
  const [clips, setClips] = useState<TrendingClip[]>([]);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    const { data } = await supabase
      .from("posts")
      .select("id, caption, image_url, video_url, like_count, user_id")
      .order("like_count", { ascending: false })
      .limit(6);

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles_public")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      setClips(data.map(p => ({
        ...p,
        profileName: profileMap.get(p.user_id)?.display_name || "Beauty Pro",
        avatar: profileMap.get(p.user_id)?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_id}`,
      })));
    }
  };

  if (clips.length === 0) return null;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between px-5 mb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold">Trending Clips</h3>
        </div>
        <button onClick={() => navigate("/shorts")} className="text-xs text-primary font-semibold">Vedi tutti</button>
      </div>
      <div className="flex gap-3 px-5 overflow-x-auto no-scrollbar">
        {clips.map(clip => (
          <button key={clip.id} onClick={() => navigate("/shorts")}
            className="relative min-w-[130px] w-[130px] aspect-[3/4] rounded-2xl overflow-hidden bg-card border border-border/50 shrink-0">
            <img src={clip.image_url || clip.video_url || ""} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/90" />
            {clip.video_url && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-background/50 backdrop-blur flex items-center justify-center">
                  <Play className="w-4 h-4 fill-current" />
                </div>
              </div>
            )}
            <div className="absolute bottom-0 inset-x-0 p-2">
              <p className="text-xs font-medium truncate">{clip.profileName}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Heart className="w-2.5 h-2.5 text-primary fill-primary" />
                <span className="text-xs text-muted-foreground">{clip.like_count}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
