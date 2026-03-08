import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Share2, Music2, Plus, Bookmark, ArrowLeft, Play } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/layout/MobileLayout";
import beauty1 from "@/assets/beauty-1.jpg";
import beauty2 from "@/assets/beauty-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";

interface Short {
  id: string;
  user: { name: string; avatar: string; verified: boolean };
  caption: string;
  image: string;
  likes: number;
  comments: number;
  shares: number;
  music: string;
  liked: boolean;
  saved: boolean;
}

const fallbackShorts: Short[] = [
  {
    id: "1",
    user: { name: "GlowMaster", avatar: stylist1, verified: true },
    caption: "Trasformazione colore incredibile! 🎨 Da castano a biondo cenere #beforeafter #colore",
    image: beauty1,
    likes: 1243,
    comments: 89,
    shares: 34,
    music: "Trending Beauty Mix - DJ Style",
    liked: false,
    saved: false,
  },
  {
    id: "2",
    user: { name: "HairQueen", avatar: beauty2, verified: true },
    caption: "Tutorial taglio bob corto ✂️ Perfetto per la primavera! #tutorial #bob",
    image: stylist2,
    likes: 892,
    comments: 56,
    shares: 21,
    music: "Salon Vibes - Beauty FM",
    liked: false,
    saved: false,
  },
  {
    id: "3",
    user: { name: "NailArtPro", avatar: stylist1, verified: false },
    caption: "Nail art primavera 2026 🌸 Fiori e pastello #nailart #spring",
    image: beauty3,
    likes: 2100,
    comments: 145,
    shares: 67,
    music: "Glow Up - Style Radio",
    liked: true,
    saved: false,
  },
  {
    id: "4",
    user: { name: "SkincarePro", avatar: beauty2, verified: true },
    caption: "Routine skincare in 3 step 💆‍♀️ Risultati in 2 settimane! #skincare",
    image: stylist1,
    likes: 3400,
    comments: 210,
    shares: 89,
    music: "Beauty Hour - Frequency",
    liked: false,
    saved: true,
  },
];

export default function ShortsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shorts, setShorts] = useState(fallbackShorts);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadShorts();
  }, []);

  const loadShorts = async () => {
    const { data } = await supabase
      .from("posts")
      .select("*, profiles:user_id(display_name, avatar_url)")
      .in("post_type", ["video", "short", "image"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (data && data.length > 0) {
      const loaded = data.map((p: any, i: number) => ({
        id: p.id,
        user: {
          name: (Array.isArray(p.profiles) ? p.profiles[0]?.display_name : p.profiles?.display_name) || "Utente",
          avatar: (Array.isArray(p.profiles) ? p.profiles[0]?.avatar_url : p.profiles?.avatar_url) || fallbackShorts[i % fallbackShorts.length].user.avatar,
          verified: false,
        },
        caption: p.caption || "",
        image: p.image_url || p.video_url || fallbackShorts[i % fallbackShorts.length].image,
        likes: p.like_count || 0,
        comments: p.comment_count || 0,
        shares: 0,
        music: "Stayle Radio",
        liked: false,
        saved: false,
      }));
      setShorts(loaded.length > 0 ? loaded : fallbackShorts);
    }
  };

  const toggleLike = (id: string) => {
    setShorts(prev => prev.map(s =>
      s.id === id ? { ...s, liked: !s.liked, likes: s.liked ? s.likes - 1 : s.likes + 1 } : s
    ));
  };

  const toggleSave = (id: string) => {
    setShorts(prev => prev.map(s =>
      s.id === id ? { ...s, saved: !s.saved } : s
    ));
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    const idx = Math.round(scrollTop / height);
    setCurrentIndex(idx);
  };

  const current = shorts[currentIndex] || shorts[0];

  return (
    <MobileLayout>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-[calc(100vh-64px)] overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollBehavior: "smooth" }}
      >
        {shorts.map((short, idx) => (
          <div key={short.id} className="h-[calc(100vh-64px)] snap-start relative">
            {/* Background Image */}
            <div className="absolute inset-0">
              <img src={short.image} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/90" />
            </div>

            {/* Top Nav */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3">
              <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full glass flex items-center justify-center">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">Shorts</span>
              </div>
              <button onClick={() => navigate("/create-post")} className="w-9 h-9 rounded-full glass flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Right Actions */}
            <div className="absolute right-3 bottom-32 z-20 flex flex-col items-center gap-5">
              {/* Profile */}
              <button className="relative">
                <img src={short.user.avatar} alt="" className="w-11 h-11 rounded-full border-2 border-primary object-cover" />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full gradient-primary flex items-center justify-center">
                  <Plus className="w-3 h-3 text-primary-foreground" />
                </div>
              </button>

              {/* Like */}
              <button onClick={() => toggleLike(short.id)} className="flex flex-col items-center gap-1">
                <Heart className={`w-7 h-7 ${short.liked ? "text-red-500 fill-red-500" : "text-white"} drop-shadow-lg`} />
                <span className="text-white text-xs font-semibold drop-shadow">{short.likes >= 1000 ? `${(short.likes / 1000).toFixed(1)}k` : short.likes}</span>
              </button>

              {/* Comment */}
              <button className="flex flex-col items-center gap-1">
                <MessageCircle className="w-7 h-7 text-white drop-shadow-lg" />
                <span className="text-white text-xs font-semibold drop-shadow">{short.comments}</span>
              </button>

              {/* Save */}
              <button onClick={() => toggleSave(short.id)} className="flex flex-col items-center gap-1">
                <Bookmark className={`w-7 h-7 ${short.saved ? "text-primary fill-primary" : "text-white"} drop-shadow-lg`} />
                <span className="text-white text-xs font-semibold drop-shadow">Salva</span>
              </button>

              {/* Share */}
              <button className="flex flex-col items-center gap-1">
                <Share2 className="w-7 h-7 text-white drop-shadow-lg" />
                <span className="text-white text-xs font-semibold drop-shadow">{short.shares}</span>
              </button>

              {/* Music */}
              <div className="w-10 h-10 rounded-full border-2 border-white/50 overflow-hidden animate-[spin_4s_linear_infinite]">
                <img src={short.user.avatar} alt="" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-4 left-0 right-16 z-20 px-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white font-bold text-sm drop-shadow">@{short.user.name}</span>
                {short.user.verified && (
                  <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-[8px]">✓</span>
                  </span>
                )}
              </div>
              <p className="text-white text-sm drop-shadow leading-relaxed line-clamp-3">{short.caption}</p>
              <div className="flex items-center gap-2 mt-2">
                <Music2 className="w-3.5 h-3.5 text-white/80" />
                <p className="text-white/80 text-xs truncate">{short.music}</p>
              </div>
            </div>

            {/* Play indicator (center) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
            </div>

            {/* Pagination dots */}
            <div className="absolute left-1/2 -translate-x-1/2 top-12 z-20 flex gap-1">
              {shorts.slice(0, 5).map((_, i) => (
                <div key={i} className={`h-0.5 rounded-full transition-all ${i === currentIndex ? "w-6 bg-white" : "w-2 bg-white/40"}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </MobileLayout>
  );
}
