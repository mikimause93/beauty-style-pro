import { Search, Bell, MessageCircle, Plus, Play, Eye, Heart, Share2, Bookmark, Coins, Briefcase, MapPin, Star, Users, Video } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/layout/MobileLayout";
import logo from "@/assets/logo.png";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";
import beauty1 from "@/assets/beauty-1.jpg";
import beauty2 from "@/assets/beauty-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";

interface Post {
  id: string;
  user_id: string;
  caption: string | null;
  image_url: string | null;
  video_url: string | null;
  like_count: number;
  comment_count: number;
  post_type: string | null;
  created_at: string;
  profileData?: { display_name: string | null; avatar_url: string | null; user_type: string };
}

const tabs = ["New", "Stylists", "Most", "Stream"];

const fallbackStylists = [
  { id: "1", business_name: "Martina Rossi", specialty: "Hairstylist", city: "Milano", rating: 4.9, review_count: 127, avatar: stylist2, hourly_rate: 45 },
  { id: "2", business_name: "Sylvie Beauty", specialty: "Colorist", city: "Roma", rating: 4.8, review_count: 89, avatar: stylist1, hourly_rate: 55 },
  { id: "3", business_name: "Marco Barberi", specialty: "Barber", city: "Napoli", rating: 4.7, review_count: 64, avatar: beauty1, hourly_rate: 35 },
];

const fallbackPosts: Post[] = [
  { id: "f1", user_id: "", caption: "Beauty Hits 🔥\nNew summer looks available!", image_url: beauty1, video_url: null, like_count: 234, comment_count: 45, post_type: "image", created_at: new Date(Date.now() - 3600000).toISOString(), profileData: { display_name: "Martina Rossi", avatar_url: stylist2, user_type: "professional" } },
  { id: "f2", user_id: "", caption: "Balayage transformation ✨", image_url: beauty2, video_url: null, like_count: 189, comment_count: 23, post_type: "image", created_at: new Date(Date.now() - 7200000).toISOString(), profileData: { display_name: "Sylvie Beauty", avatar_url: stylist1, user_type: "professional" } },
  { id: "f3", user_id: "", caption: "New keratin treatment results 💇‍♀️", image_url: beauty3, video_url: null, like_count: 312, comment_count: 67, post_type: "image", created_at: new Date(Date.now() - 14400000).toISOString(), profileData: { display_name: "Beauty Rossi", avatar_url: beauty3, user_type: "professional" } },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState("New");
  const [posts, setPosts] = useState<Post[]>(fallbackPosts);
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [jobPosts, setJobPosts] = useState<any[]>([]);
  const [stylists, setStylists] = useState(fallbackStylists);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { data: postsData } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(20);
      const { data: streamsData } = await supabase.from('live_streams').select(`*, professional:professionals(business_name, user_id)`).in('status', ['live', 'scheduled']).order('viewer_count', { ascending: false }).limit(5);
      const { data: profilesData } = await supabase.from('profiles').select('user_id, display_name, avatar_url').limit(10);

      if (postsData && postsData.length > 0) {
        const userIds = [...new Set(postsData.map(p => p.user_id))];
        const { data: postProfiles } = await supabase.from('profiles').select('user_id, display_name, avatar_url, user_type').in('user_id', userIds);
        const profileMap = new Map(postProfiles?.map(p => [p.user_id, p]) || []);
        setPosts(postsData.map(p => ({ ...p, profileData: profileMap.get(p.user_id) || undefined })));
      }

      if (streamsData) setLiveStreams(streamsData.map(s => ({ ...s, professional: Array.isArray(s.professional) ? s.professional[0] : s.professional })));
      if (profilesData) {
        setStories(profilesData.map((p, i) => ({
          id: p.user_id, name: p.display_name || 'User',
          avatar: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
          isLive: i < 2, hasStory: true,
        })));
      }

      const { data: jobsData } = await supabase.from('job_posts').select('*, professionals(business_name, city), businesses(business_name, logo_url)').eq('status', 'active').order('created_at', { ascending: false }).limit(10);
      if (jobsData) setJobPosts(jobsData);

      const { data: profsData } = await supabase.from('professionals').select('*').limit(10);
      if (profsData && profsData.length > 0) setStylists(profsData.map((p, i) => ({ ...p, avatar: fallbackStylists[i % fallbackStylists.length].avatar })));
    } catch (error) { console.error('Error:', error); }
  };

  const toggleLike = async (postId: string) => {
    if (!user) { navigate('/auth'); return; }
    setLikedPosts(prev => prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]);
  };

  const formatTimeAgo = (date: string) => {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return `${s}s`; if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`; return `${Math.floor(s / 86400)}d`;
  };

  // Default stories when DB is empty
  const displayStories = stories.length > 0 ? stories : [
    { id: "s1", name: "Martina", avatar: stylist2, isLive: true, hasStory: true },
    { id: "s2", name: "Sylvie", avatar: stylist1, isLive: true, hasStory: true },
    { id: "s3", name: "Marco", avatar: beauty1, isLive: false, hasStory: true },
    { id: "s4", name: "Anna", avatar: beauty2, isLive: false, hasStory: true },
    { id: "s5", name: "Sofia", avatar: beauty3, isLive: false, hasStory: true },
  ];

  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-50 glass">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Stayle" className="w-8 h-8 rounded-lg" />
            <h1 className="text-xl font-display font-bold text-gradient-primary">Stayle</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/qr-coins")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full gradient-gold">
              <Coins className="w-4 h-4 text-gold-foreground" />
              <span className="text-sm font-bold text-gold-foreground">{profile?.qr_coins?.toLocaleString() || '0'}</span>
            </button>
            <button onClick={() => navigate("/notifications")} className="relative w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-live border-2 border-background" />
            </button>
            <button onClick={() => navigate("/chat")} className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab ? "gradient-primary text-primary-foreground shadow-glow" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Stories */}
      <div className="flex gap-3 px-4 py-4 overflow-x-auto no-scrollbar">
        <button onClick={() => navigate("/create-post")} className="flex flex-col items-center gap-1.5 min-w-[72px]">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
            <Plus className="w-6 h-6 text-muted-foreground" />
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">Add</span>
        </button>
        {displayStories.map(story => (
          <button key={story.id} onClick={() => story.isLive ? navigate("/live") : navigate(`/stylist/${story.id}`)} className="flex flex-col items-center gap-1.5 min-w-[72px]">
            <div className={`w-16 h-16 rounded-full p-0.5 ${story.isLive ? "gradient-live" : story.hasStory ? "gradient-primary" : "bg-border"}`}>
              <img src={story.avatar} alt={story.name} className="w-full h-full rounded-full object-cover border-2 border-background"
                onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.id}`; }} />
            </div>
            <span className="text-[11px] text-muted-foreground truncate w-16 text-center font-medium">{story.name}</span>
            {story.isLive && <span className="text-[9px] font-bold text-primary-foreground bg-live px-2 py-0.5 rounded-full -mt-1">LIVE</span>}
          </button>
        ))}
      </div>

      {/* Live Now Banner */}
      {activeTab !== "Stylists" && (
        <div className="px-4 mb-4">
          <button onClick={() => navigate("/live")} className="w-full rounded-2xl overflow-hidden relative h-32">
            <div className="absolute inset-0 bg-gradient-to-r from-live/90 via-primary/80 to-secondary/70" />
            <div className="absolute inset-0 flex items-center px-5">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[stylist1, stylist2, beauty1].map((img, i) => (
                    <div key={i} className="w-12 h-12 rounded-full border-3 border-background overflow-hidden" style={{ zIndex: 3 - i }}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary-foreground/20 text-primary-foreground text-[10px] font-bold">
                      <span className="w-2 h-2 rounded-full bg-primary-foreground live-pulse" />LIVE NOW
                    </span>
                  </div>
                  <p className="text-lg font-bold text-primary-foreground">Beauty streaming</p>
                  <p className="text-xs text-primary-foreground/70">Tap to watch beauty tutorials</p>
                </div>
                <Play className="w-10 h-10 text-primary-foreground" />
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Quick Actions */}
      {activeTab === "New" && (
        <div className="grid grid-cols-4 gap-2 px-4 mb-4">
          {[
            { icon: "💇‍♀️", label: "Stylists", path: "/stylists" },
            { icon: "📅", label: "Booking", path: "/booking" },
            { icon: "🗺️", label: "Mappa AI", path: "/map-search" },
            { icon: "🏠", label: "Domicilio", path: "/map-search" },
          ].map(item => (
            <button key={item.label} onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-[10px] text-muted-foreground font-semibold">{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="space-y-4 px-4 pb-4">
        {/* NEW TAB - Feed */}
        {activeTab === "New" && (
          <div className="space-y-4 fade-in">
            {posts.map(post => (
              <div key={post.id} className="rounded-2xl bg-card overflow-hidden shadow-card">
                {/* Post Header */}
                <div className="flex items-center gap-3 p-3">
                  <img src={post.profileData?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.id}`}
                    alt="" className="w-10 h-10 rounded-full object-cover border border-border"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.id}`; }} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{post.profileData?.display_name || 'Beauty Pro'}</p>
                    <p className="text-[10px] text-muted-foreground">{formatTimeAgo(post.created_at)}</p>
                  </div>
                  <button onClick={() => navigate("/booking")} className="px-3 py-1 rounded-full gradient-primary text-primary-foreground text-[10px] font-semibold">
                    Book
                  </button>
                </div>
                {/* Image */}
                {post.image_url && (
                  <img src={post.image_url} alt="" className="w-full aspect-[4/5] object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = beauty1; }} />
                )}
                {/* Actions */}
                <div className="p-3">
                  <div className="flex items-center gap-4 mb-2">
                    <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1.5">
                      <Heart className={`w-5 h-5 ${likedPosts.includes(post.id) ? "text-primary fill-primary" : "text-muted-foreground"}`} />
                      <span className="text-xs font-medium">{post.like_count}</span>
                    </button>
                    <button onClick={() => navigate("/chat")} className="flex items-center gap-1.5">
                      <MessageCircle className="w-5 h-5 text-muted-foreground" />
                      <span className="text-xs font-medium">{post.comment_count}</span>
                    </button>
                    <button className="flex items-center gap-1.5">
                      <Share2 className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <div className="flex-1" />
                    <button><Bookmark className="w-5 h-5 text-muted-foreground" /></button>
                  </div>
                  {post.caption && <p className="text-sm">{post.caption}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STYLISTS TAB */}
        {activeTab === "Stylists" && (
          <div className="space-y-3 fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Professionisti</h3>
              <button onClick={() => navigate("/stylists")} className="text-xs text-primary font-semibold">Vedi tutti</button>
            </div>
            {stylists.map(stylist => (
              <button key={stylist.id} onClick={() => navigate(`/stylist/${stylist.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-card shadow-card hover:bg-muted transition-all text-left">
                <img src={stylist.avatar} alt="" className="w-14 h-14 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{stylist.business_name}</p>
                  <p className="text-xs text-primary">{stylist.specialty || 'Beauty Pro'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="w-3 h-3 text-gold fill-gold" />
                    <span className="text-xs font-semibold">{stylist.rating || '4.5'}</span>
                    <span className="text-xs text-muted-foreground">({stylist.review_count || 0})</span>
                    {stylist.city && <span className="text-xs text-muted-foreground flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {stylist.city}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-primary">€{stylist.hourly_rate || 40}</p>
                  <button onClick={(e) => { e.stopPropagation(); navigate("/booking"); }} className="mt-1 px-3 py-1 rounded-full gradient-primary text-primary-foreground text-[10px] font-semibold">
                    Book
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* MOST TAB - Popular / Trending */}
        {activeTab === "Most" && (
          <div className="space-y-4 fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">🔥 Trending</h3>
              <button onClick={() => navigate("/leaderboard")} className="text-xs text-primary font-semibold">Classifica</button>
            </div>
            {/* Job Posts in Most */}
            {jobPosts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">💼 Offerte di Lavoro</h4>
                {jobPosts.slice(0, 3).map(job => {
                  const employer = job.businesses || job.professionals;
                  const name = employer?.business_name || "Anonimo";
                  return (
                    <button key={job.id} onClick={() => navigate(`/hr/job/${job.id}`)}
                      className="w-full text-left p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">{name[0]}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{job.title}</h3>
                          <p className="text-xs text-muted-foreground">{name} • {job.location}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary font-medium">{job.category}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground">{job.employment_type}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
                <button onClick={() => navigate("/hr")} className="w-full py-2 text-center text-xs text-primary font-semibold">Vedi tutti gli annunci →</button>
              </div>
            )}
            {/* Popular Posts */}
            <h4 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">❤️ Post Popolari</h4>
            <div className="grid grid-cols-2 gap-2">
              {posts.slice(0, 4).map(post => (
                <div key={post.id} className="rounded-xl bg-card overflow-hidden shadow-card">
                  <img src={post.image_url || beauty1} alt="" className="w-full aspect-square object-cover" />
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{post.profileData?.display_name || 'Beauty Pro'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Heart className="w-3 h-3 text-primary fill-primary" />
                      <span className="text-[10px] text-muted-foreground">{post.like_count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STREAM TAB */}
        {activeTab === "Stream" && (
          <div className="space-y-4 fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Live & Scheduled</h3>
              <button onClick={() => navigate("/live")} className="text-xs text-primary font-semibold">Apri Live</button>
            </div>

            {/* Quick stream actions */}
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => navigate("/events")} className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-card border border-border hover:border-primary/30">
                <span className="text-xl">📅</span>
                <span className="text-[10px] text-muted-foreground">Events</span>
              </button>
              <button onClick={() => navigate("/radio")} className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-card border border-border hover:border-primary/30">
                <span className="text-xl">📻</span>
                <span className="text-[10px] text-muted-foreground">Radio</span>
              </button>
              <button onClick={() => navigate("/challenges")} className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-card border border-border hover:border-primary/30">
                <span className="text-xl">🏆</span>
                <span className="text-[10px] text-muted-foreground">Challenges</span>
              </button>
            </div>

            {liveStreams.length === 0 ? (
              <div className="text-center py-8">
                <Video className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Nessun live stream attivo</p>
                <button onClick={() => navigate("/live")} className="mt-3 px-6 py-2 rounded-full gradient-primary text-primary-foreground text-sm font-semibold">
                  Vai alla sezione Live
                </button>
              </div>
            ) : (
              liveStreams.map(stream => (
                <button key={stream.id} onClick={() => navigate("/live")}
                  className="w-full relative aspect-video rounded-2xl overflow-hidden bg-card shadow-card">
                  <img src={stream.thumbnail_url || beauty2} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/80" />
                  <div className="absolute top-3 left-3">
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-live text-primary-foreground text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground live-pulse" />LIVE
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 glass px-2 py-1 rounded-full">
                    <Eye className="w-3 h-3" /><span className="text-[10px]">{stream.viewer_count}</span>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <p className="font-bold text-sm">{stream.title}</p>
                    <p className="text-xs text-muted-foreground">{stream.professional?.business_name || 'Beauty Streamer'}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
