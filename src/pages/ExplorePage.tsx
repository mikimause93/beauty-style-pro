import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/layout/MobileLayout";
import PostCard from "@/components/feed/PostCard";
import { Search, TrendingUp, MapPin, Star, Users, Crown, Sparkles, Film, ArrowLeft } from "lucide-react";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";
import beauty1 from "@/assets/beauty-1.jpg";
import beauty2 from "@/assets/beauty-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";

const tabs = ["Trending", "Vicini", "Creators", "Servizi"];

export default function ExplorePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Trending");
  const [search, setSearch] = useState("");
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const [topCreators, setTopCreators] = useState<any[]>([]);
  const [nearbyPros, setNearbyPros] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [postsRes, creatorsRes, prosRes] = await Promise.all([
      supabase.from("posts").select("*, profiles:user_id(display_name, avatar_url, user_type)").order("like_count", { ascending: false }).limit(20),
      supabase.from("profiles").select("*").in("user_type", ["professional", "business"]).order("follower_count", { ascending: false }).limit(10),
      supabase.from("professionals").select("*, profiles:user_id(display_name, avatar_url, city)").order("rating", { ascending: false }).limit(10),
    ]);
    if (postsRes.data) setTrendingPosts(postsRes.data.map((p: any) => ({ ...p, profileData: p.profiles })));
    if (creatorsRes.data) setTopCreators(creatorsRes.data);
    if (prosRes.data) setNearbyPros(prosRes.data);
  };

  const fallbackPosts = [
    { id: "e1", user_id: "", caption: "Trending balayage ✨", image_url: beauty1, video_url: null, like_count: 520, comment_count: 89, post_type: "image", created_at: new Date().toISOString(), profileData: { display_name: "Martina Rossi", avatar_url: stylist2, user_type: "professional" } },
    { id: "e2", user_id: "", caption: "Summer vibes 🌊", image_url: beauty2, video_url: null, like_count: 340, comment_count: 56, post_type: "image", created_at: new Date().toISOString(), profileData: { display_name: "Sylvie Beauty", avatar_url: stylist1, user_type: "professional" } },
  ];

  const fallbackCreators = [
    { user_id: "c1", display_name: "Martina Rossi", avatar_url: stylist2, follower_count: 12400, user_type: "professional" },
    { user_id: "c2", display_name: "Sylvie Beauty", avatar_url: stylist1, follower_count: 8900, user_type: "professional" },
    { user_id: "c3", display_name: "Marco Barber", avatar_url: beauty1, follower_count: 6200, user_type: "professional" },
  ];

  const posts = trendingPosts.length > 0 ? trendingPosts : fallbackPosts;
  const creators = topCreators.length > 0 ? topCreators : fallbackCreators;

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 space-y-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold flex-1">Esplora</h1>
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca creators, servizi, luoghi..."
            className="w-full h-10 rounded-full bg-muted pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
              {tab}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 space-y-6">
        {/* Trending Tab */}
        {activeTab === "Trending" && (
          <>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold">Post Trending</h2>
            </div>
            {/* Grid view */}
            <div className="grid grid-cols-3 gap-1 rounded-2xl overflow-hidden">
              {posts.slice(0, 9).map((post) => (
                <button key={post.id} onClick={() => {}} className="aspect-square relative overflow-hidden">
                  <img src={post.image_url || beauty3} alt="" className="w-full h-full object-cover" />
                  <div className="absolute bottom-1 left-1 flex items-center gap-0.5 bg-black/50 rounded-full px-1.5 py-0.5">
                    <Star className="w-2.5 h-2.5 text-white" />
                    <span className="text-[9px] text-white font-bold">{post.like_count}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Top Creators */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold">Top Creators</h2>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {creators.map((c) => (
                  <button key={c.user_id} onClick={() => navigate(`/profile/${c.user_id}`)}
                    className="flex flex-col items-center gap-2 min-w-[80px] flex-shrink-0">
                    <img src={c.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user_id}`}
                      alt="" className="w-16 h-16 rounded-full object-cover border-2 border-primary/30" />
                    <p className="text-[11px] font-semibold truncate max-w-[80px]">{c.display_name}</p>
                    <span className="text-[9px] text-muted-foreground">{(c.follower_count / 1000).toFixed(1)}K</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Nearby Tab */}
        {activeTab === "Vicini" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold">Vicino a te</h2>
            </div>
            {(nearbyPros.length > 0 ? nearbyPros : [
              { id: "np1", business_name: "Martina Rossi", specialty: "Hairstylist", city: "Milano", rating: 4.9, profiles: { display_name: "Martina", avatar_url: stylist2, city: "Milano" } },
              { id: "np2", business_name: "Marco Barber", specialty: "Barber", city: "Roma", rating: 4.8, profiles: { display_name: "Marco", avatar_url: beauty1, city: "Roma" } },
            ]).map((pro: any) => (
              <button key={pro.id} onClick={() => navigate(`/stylist/${pro.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/50">
                <img src={pro.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${pro.id}`}
                  alt="" className="w-12 h-12 rounded-xl object-cover" />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold truncate">{pro.profiles?.display_name || pro.business_name}</p>
                  <p className="text-[11px] text-muted-foreground">{pro.specialty} · {pro.profiles?.city || pro.city}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-primary fill-primary" />
                  <span className="text-xs font-bold">{pro.rating}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Creators Tab */}
        {activeTab === "Creators" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold">Creators Popolari</h2>
            </div>
            {creators.map((c) => (
              <button key={c.user_id} onClick={() => navigate(`/profile/${c.user_id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/50">
                <img src={c.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user_id}`}
                  alt="" className="w-12 h-12 rounded-full object-cover border-2 border-primary/20" />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold truncate">{c.display_name}</p>
                  <p className="text-[11px] text-muted-foreground">{c.user_type} · {(c.follower_count / 1000).toFixed(1)}K follower</p>
                </div>
                <span className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">Segui</span>
              </button>
            ))}
          </div>
        )}

        {/* Services Tab */}
        {activeTab === "Servizi" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Film className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold">Servizi Trending</h2>
            </div>
            {["Balayage", "Taglio Uomo", "Extension", "Colore", "Manicure", "Trattamento Viso"].map(service => (
              <button key={service} onClick={() => navigate("/stylists")}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/50">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold">{service}</p>
                  <p className="text-[11px] text-muted-foreground">Tendenza in crescita</p>
                </div>
                <span className="text-[10px] text-primary font-bold">+{Math.floor(Math.random() * 40 + 10)}%</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
