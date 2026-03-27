import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRadio } from "@/contexts/RadioContext";
import { supabase } from "@/integrations/supabase/client";
import { Plus, X, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";
import beauty1 from "@/assets/beauty-1.jpg";

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  view_count: number;
  created_at: string;
}

interface GroupedStory {
  user_id: string;
  display_name: string;
  avatar_url: string;
  stories: Story[];
  isOwn: boolean;
}

// No fallback/mock stories — only real DB content

export default function StoriesBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pause: pauseRadio } = useRadio();
  const [groups, setGroups] = useState<GroupedStory[]>([]);
  const [viewingGroup, setViewingGroup] = useState<GroupedStory | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadStories(); }, [user]);

  const loadStories = async () => {
    // Load stories without FK join (no FK from stories to profiles)
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Stories load error:", error);
      setGroups([]);
      return;
    }

    if (data && data.length > 0) {
      // Load profiles separately
      const userIds = [...new Set(data.map(s => s.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const grouped: Record<string, GroupedStory> = {};
      for (const s of data) {
        const p = profileMap.get(s.user_id);
        if (!grouped[s.user_id]) {
          grouped[s.user_id] = {
            user_id: s.user_id,
            display_name: p?.display_name || "Utente",
            avatar_url: p?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.user_id}`,
            stories: [],
            isOwn: s.user_id === user?.id,
          };
        }
        grouped[s.user_id].stories.push(s);
      }
      const arr = Object.values(grouped);
      arr.sort((a, b) => (a.isOwn ? -1 : b.isOwn ? 1 : 0));
      setGroups(arr);
    } else {
      setGroups(fallbackStories);
    }
  };

  const handleAddStory = async () => {
    if (!user) { navigate("/auth"); return; }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);

      try {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("posts").upload(path, file);
        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage.from("posts").getPublicUrl(path);
        const mediaUrl = urlData.publicUrl;
        const mediaType = file.type.startsWith("video") ? "video" : "image";

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        const { error: insertErr } = await supabase.from("stories").insert({
          user_id: user.id,
          media_url: mediaUrl,
          media_type: mediaType,
          expires_at: expiresAt,
        });

        if (insertErr) throw insertErr;
        await loadStories();
      } catch (err) {
        console.error("Story upload error:", err);
      }
      setUploading(false);
    };
    input.click();
  };

  const openStory = (group: GroupedStory) => {
    pauseRadio();
    setViewingGroup(group);
    setCurrentIndex(0);
    setProgress(0);
    if (user && group.stories[0]) {
      supabase.from("story_views").insert({ story_id: group.stories[0].id, user_id: user.id }).then(() => {});
    }
  };

  useEffect(() => {
    if (!viewingGroup) return;
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (currentIndex < viewingGroup.stories.length - 1) {
            setCurrentIndex(i => i + 1);
            return 0;
          } else {
            setViewingGroup(null);
            return 0;
          }
        }
        return prev + 2;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [viewingGroup, currentIndex]);

  const nextStory = () => {
    if (!viewingGroup) return;
    if (currentIndex < viewingGroup.stories.length - 1) {
      setCurrentIndex(i => i + 1);
      setProgress(0);
    } else {
      setViewingGroup(null);
    }
  };

  const prevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
      setProgress(0);
    }
  };

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {/* Add Story */}
        <button onClick={handleAddStory} disabled={uploading} className="flex flex-col items-center gap-1 flex-shrink-0">
          <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-dashed border-primary/50 bg-primary/8">
            {uploading ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-5 h-5 text-primary" />
            )}
          </div>
          <span className="text-xs text-muted-foreground font-medium">{uploading ? "..." : "La tua"}</span>
        </button>

        {groups.map((group) => (
          <button key={group.user_id} onClick={() => openStory(group)} className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="w-16 h-16 rounded-full p-[2.5px]" style={{ background: "linear-gradient(135deg, hsl(262 88% 63%), hsl(302 78% 56%), hsl(42 98% 62%))" }}>
              <img src={group.avatar_url} alt="" className="w-full h-full rounded-full object-cover border-2 border-background" />
            </div>
            <span className="text-xs text-muted-foreground font-medium truncate max-w-[64px]">{group.display_name}</span>
          </button>
        ))}
      </div>

      {/* Full Screen Story Viewer */}
      {viewingGroup && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2 pt-safe">
            {viewingGroup.stories.map((_, i) => (
              <div key={i} className="flex-1 h-[2px] bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-100"
                  style={{ width: i < currentIndex ? "100%" : i === currentIndex ? `${progress}%` : "0%" }} />
              </div>
            ))}
          </div>

          <div className="absolute top-8 left-0 right-0 z-10 flex items-center gap-3 px-4">
            <img src={viewingGroup.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
            <span className="text-white text-sm font-semibold flex-1">{viewingGroup.display_name}</span>
            <button onClick={() => setViewingGroup(null)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center relative">
            {viewingGroup.stories[currentIndex]?.media_type === "video" ? (
              <video src={viewingGroup.stories[currentIndex]?.media_url} autoPlay muted className="w-full h-full object-contain" />
            ) : (
              <img src={viewingGroup.stories[currentIndex]?.media_url} alt="" className="w-full h-full object-contain" />
            )}
            <button onClick={prevStory} className="absolute left-0 top-0 bottom-0 w-1/3" />
            <button onClick={nextStory} className="absolute right-0 top-0 bottom-0 w-1/3" />
          </div>

          {viewingGroup.stories[currentIndex]?.caption && (
            <div className="absolute bottom-20 left-0 right-0 px-6 text-center">
              <p className="text-white text-sm drop-shadow-lg">{viewingGroup.stories[currentIndex].caption}</p>
            </div>
          )}

          <div className="absolute bottom-8 left-0 right-0 flex justify-center">
            <div className="flex items-center gap-1 bg-white/10 rounded-full px-3 py-1">
              <Eye className="w-3 h-3 text-white/70" />
              <span className="text-xs text-white/70">{viewingGroup.stories[currentIndex]?.view_count}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
