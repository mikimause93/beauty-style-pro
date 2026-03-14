import { Search, Bell, MessageCircle, Plus, Play, Eye, Heart, Share2, Bookmark, Coins, Briefcase, MapPin, Star, Users, Video, ShoppingBag, ChevronRight, Scissors, CalendarDays, Map as MapIcon, Home, Target, Sparkles, Film, Gift, Trophy, Camera, Radio, Medal, Podcast, Droplets, Zap, Gamepad2, Wand2 } from "lucide-react";
import HomeMusicWidget from "@/components/feed/HomeMusicWidget";
import TrendingClips from "@/components/feed/TrendingClips";
import StoriesBar from "@/components/feed/StoriesBar";

import SponsorBanner from "@/components/feed/SponsorBanner";
import AIMatchBanner from "@/components/feed/AIMatchBanner";
import AIGrowthSuggestions from "@/components/feed/AIGrowthSuggestions";
import AutoOffersBanner from "@/components/feed/AutoOffersBanner";
import LiveNowFeed from "@/components/feed/LiveNowFeed";
import PostCard from "@/components/feed/PostCard";
import FeedJobCard from "@/components/feed/FeedJobCard";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ShareMenu from "@/components/ShareMenu";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import useChatbot from "@/hooks/useChatbot";
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

const tabs = ["Nuovi", "Stilisti", "Popolari", "Stream"];

const fallbackStylists = [
  { id: "1", business_name: "Martina Rossi", specialty: "Hairstylist", city: "Milano", rating: 4.9, review_count: 127, avatar: stylist2, hourly_rate: 45 },
  { id: "2", business_name: "Sylvie Beauty", specialty: "Colorist", city: "Roma", rating: 4.8, review_count: 89, avatar: stylist1, hourly_rate: 55 },
  { id: "3", business_name: "Marco Barberi", specialty: "Barber", city: "Napoli", rating: 4.7, review_count: 64, avatar: beauty1, hourly_rate: 35 },
];

const fallbackPosts: Post[] = [
  { id: "00000000-0000-0000-0000-000000000001", user_id: "00000000-0000-0000-0000-000000000010", caption: "New summer looks available!", image_url: beauty1, video_url: null, like_count: 234, comment_count: 45, post_type: "image", created_at: new Date(Date.now() - 3600000).toISOString(), profileData: { display_name: "Martina Rossi", avatar_url: stylist2, user_type: "professional" } },
  { id: "00000000-0000-0000-0000-000000000002", user_id: "00000000-0000-0000-0000-000000000020", caption: "Balayage transformation", image_url: beauty2, video_url: null, like_count: 189, comment_count: 23, post_type: "image", created_at: new Date(Date.now() - 7200000).toISOString(), profileData: { display_name: "Sylvie Beauty", avatar_url: stylist1, user_type: "professional" } },
  { id: "00000000-0000-0000-0000-000000000003", user_id: "00000000-0000-0000-0000-000000000030", caption: "Keratin treatment results", image_url: beauty3, video_url: null, like_count: 312, comment_count: 67, post_type: "image", created_at: new Date(Date.now() - 14400000).toISOString(), profileData: { display_name: "Beauty Rossi", avatar_url: beauty3, user_type: "professional" } },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const { unreadCount } = useNotifications();
  const { trackAction } = useChatbot();
  const [activeTab, setActiveTab] = useState("Nuovi");
  const [posts, setPosts] = useState<Post[]>(fallbackPosts);
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [jobPosts, setJobPosts] = useState<any[]>([]);
  const [stylists, setStylists] = useState(fallbackStylists);
  const [sharePost, setSharePost] = useState<Post | null>(null);
  const [highlightPostId, setHighlightPostId] = useState<string | null>(null);

  // Handle post redirect from notifications
  useEffect(() => {
    const postId = searchParams.get("post");
    if (postId) {
      setHighlightPostId(postId);
      setTimeout(() => {
        const el = document.getElementById(`post-${postId}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 500);
    }
  }, [searchParams]);

  // Track page visit
  useEffect(() => {
    if (user) {
      trackAction("page_visit", { page: "home" }, "home");
    }
  }, [user, trackAction]);

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

  const displayStories = stories.length > 0 ? stories : [
    { id: "s1", name: "Martina", avatar: stylist2, isLive: true, hasStory: true },
    { id: "s2", name: "Sylvie", avatar: stylist1, isLive: true, hasStory: true },
    { id: "s3", name: "Marco", avatar: beauty1, isLive: false, hasStory: true },
    { id: "s4", name: "Luca", avatar: beauty2, isLive: false, hasStory: true },
  ];

  const displayLiveStreams = liveStreams.length > 0 ? liveStreams : [
    { id: "l1", title: "Makeover completo", professional: { business_name: "Martina Rossi" }, viewer_count: 234, thumbnail_url: beauty1, category: "Makeup" },
    { id: "l2", title: "Taglio tendenza 2024", professional: { business_name: "Sylvie Beauty" }, viewer_count: 189, thumbnail_url: beauty2, category: "Hair" },
  ];

  const displayPosts = posts.length > 0 ? posts : fallbackPosts;

  const handleLike = async (postId: string) => {
    const isLiked = likedPosts.includes(postId);
    if (isLiked) {
      setLikedPosts(likedPosts.filter(id => id !== postId));
      setPosts(posts.map(p => p.id === postId ? { ...p, like_count: p.like_count - 1 } : p));
    } else {
      setLikedPosts([...likedPosts, postId]);
      setPosts(posts.map(p => p.id === postId ? { ...p, like_count: p.like_count + 1 } : p));
      // Track like action
      trackAction("post_like", { post_id: postId }, "home");
    }
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    trackAction("tab_change", { from: activeTab, to: tab }, "home");
  };

  const handleQuickAction = (action: string, path: string) => {
    trackAction("quick_action_click", { action }, "home");
    navigate(path);
  };

  return (
    <MobileLayout>
      {/* Header — minimal & clean */}
      <header className="sticky top-0 z-50 glass">
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-2xl font-display font-bold italic tracking-tight" style={{ background: "linear-gradient(135deg, #9b59b6, #8b5cf6, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Style</span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => navigate("/search")} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
              <Search className="w-[20px] h-[20px] text-muted-foreground" />
            </button>
            <button onClick={() => navigate("/qr-coins")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-semibold">
              <Coins className="w-3.5 h-3.5 text-accent" />
              <span>{profile?.qr_coins?.toLocaleString() || '0'}</span>
            </button>
            <button onClick={() => navigate("/notifications")} className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
              <Bell className="w-[20px] h-[20px] text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
            <button onClick={() => navigate("/chat")} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
              <MessageCircle className="w-[20px] h-[20px] text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pb-3 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button key={tab} onClick={() => handleTabClick(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                activeTab === tab 
                   ? "bg-primary text-primary-foreground shadow-md" 
                   : "bg-primary/10 text-primary hover:bg-primary/20"
              }`}>
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Stories */}
      <div className="px-5 py-4">
        <StoriesBar />
      </div>

      {/* Quick Actions — single compact scrollable row under stories */}
      {activeTab === "Nuovi" && (
        <div className="flex gap-2 px-5 mb-4 overflow-x-auto no-scrollbar">
          {[
            { Icon: Wand2, label: "AI Look", path: "/ai-look" },
            { Icon: Scissors, label: "Stilisti", path: "/stylists" },
            { Icon: CalendarDays, label: "Prenota", path: "/booking" },
            { Icon: MapIcon, label: "Mappa", path: "/map-search" },
            { Icon: Droplets, label: "Spa", path: "/spa-terme" },
            { Icon: Home, label: "Domicilio", path: "/map-search" },
            { Icon: Target, label: "Missioni", path: "/missions" },
            { Icon: Sparkles, label: "AI", path: "/ai-assistant" },
            { Icon: Zap, label: "Quiz", path: "/quiz-live" },
            { Icon: Gamepad2, label: "Talent", path: "/talent-game" },
            { Icon: Film, label: "Shorts", path: "/shorts" },
            { Icon: Gift, label: "Vinci", path: "/spin" },
            { Icon: Trophy, label: "Challenge", path: "/transformation-challenge" },
            { Icon: Camera, label: "Prima/Dopo", path: "/before-after" },
            { Icon: Radio, label: "Radio", path: "/radio" },
            { Icon: Medal, label: "Classifica", path: "/leaderboard" },
          ].map(item => (
            <button key={item.label} onClick={() => handleQuickAction(item.label, item.path)}
              className="flex flex-col items-center gap-1 min-w-[52px] shrink-0">
              <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center shadow-sm">
                <item.Icon className="w-4.5 h-4.5 text-primary" />
              </div>
              <span className="text-[9px] text-primary font-semibold leading-tight">{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* AI Suggestions — temporary popup */}
      {activeTab === "Nuovi" && (
        <div className="px-5 mb-3">
          <AIGrowthSuggestions />
        </div>
      )}

      {/* Music Widget */}
      {activeTab === "Nuovi" && <HomeMusicWidget />}

      {/* Auto Offers */}
      {activeTab === "Nuovi" && <AutoOffersBanner />}

      {/* AI Smart Match */}
      {activeTab === "Nuovi" && <AIMatchBanner />}

      {/* Trending Clips */}
      {activeTab === "Nuovi" && <TrendingClips />}

      {/* LIVE ORA Section */}
      {activeTab !== "Stilisti" && liveStreams.length > 0 && (
        <div className="px-5">
          <LiveNowFeed streams={liveStreams} />
        </div>
      )}

      {/* Live Banner — subtle */}
      {activeTab !== "Stilisti" && (
        <div className="px-5 mb-5">
          <button onClick={() => navigate("/live")} className="w-full rounded-2xl overflow-hidden relative h-28 bg-card border border-border/50">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
            <div className="absolute inset-0 flex items-center px-5">
              <div className="flex items-center gap-4 w-full">
                <div className="flex -space-x-2">
                  {[stylist1, stylist2, beauty1].map((img, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-card overflow-hidden" style={{ zIndex: 3 - i }}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary live-pulse" />
                    <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">In diretta</span>
                  </div>
                  <p className="text-sm font-semibold">Beauty streaming</p>
                  <p className="text-[11px] text-muted-foreground">Tutorial in diretta</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </button>
        </div>
      )}


      {/* Content */}
      <div className="space-y-4 px-5 pb-6">
        {/* Feed */}
        {activeTab === "Nuovi" && (
          <div className="space-y-4 fade-in">
            {/* Sponsor Banner */}
            <SponsorBanner />
             {displayPosts.map((post, index) => (
               <div key={post.id} id={`post-${post.id}`} className={highlightPostId === post.id ? "ring-2 ring-primary rounded-2xl transition-all" : ""}>
                <PostCard post={post} onShare={() => setSharePost(post)} fallbackImage={beauty1} />
                {/* Insert a job post card after every 2nd post */}
                {index > 0 && index % 2 === 1 && jobPosts[Math.floor(index / 2)] && (
                  <div className="mt-4">
                    <FeedJobCard job={jobPosts[Math.floor(index / 2)]} />
                  </div>
                )}
              </div>
            ))}
            {/* Show remaining job posts at the end if any */}
            {jobPosts.length > 0 && displayPosts.length < 3 && jobPosts.map(job => (
              <FeedJobCard key={job.id} job={job} />
            ))}
          </div>
        )}

        {/* Stylists */}
        {activeTab === "Stilisti" && (
          <div className="space-y-3 fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Professionisti</h3>
              <button onClick={() => navigate("/stylists")} className="text-xs text-primary font-semibold">Vedi tutti</button>
            </div>
            {stylists.map(stylist => (
              <button key={stylist.id} onClick={() => navigate(`/stylist/${stylist.id}`)}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-primary/20 hover:border-primary/40 transition-all duration-200 text-left shadow-sm">
                <img src={stylist.avatar} alt="" className="w-14 h-14 rounded-xl object-cover border border-primary/10" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{stylist.business_name}</p>
                  <p className="text-xs text-primary/70 mt-0.5">{stylist.specialty || 'Beauty Pro'}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Star className="w-3 h-3 text-accent fill-accent" />
                    <span className="text-xs font-medium">{stylist.rating || '4.5'}</span>
                    <span className="text-xs text-muted-foreground">({stylist.review_count || 0})</span>
                    {stylist.city && <span className="text-xs text-muted-foreground flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {stylist.city}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-primary">€{stylist.hourly_rate || 40}</p>
                  <p className="text-[10px] text-muted-foreground">/ora</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Popular */}
        {activeTab === "Popolari" && (
          <div className="space-y-4 fade-in">
            {jobPosts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Offerte di Lavoro</h4>
                {jobPosts.slice(0, 3).map(job => {
                  const employer = job.businesses || job.professionals;
                  const name = employer?.business_name || "Anonimo";
                  return (
                    <button key={job.id} onClick={() => navigate(`/hr/job/${job.id}`)}
                      className="w-full text-left p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-all duration-200">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">{name[0]}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{job.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{name} · {job.location}</p>
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
            <h4 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Post Popolari</h4>
            <div className="grid grid-cols-2 gap-2">
              {displayPosts.slice(0, 4).map(post => (
                <div key={post.id} className="rounded-2xl bg-card border border-border/50 overflow-hidden">
                  <img src={post.image_url || beauty1} alt="" className="w-full aspect-square object-cover" />
                  <div className="p-3">
                    <p className="text-xs font-medium truncate">{post.profileData?.display_name || 'Beauty Pro'}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Heart className="w-3 h-3 text-primary fill-primary" />
                      <span className="text-[10px] text-muted-foreground">{post.like_count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stream */}
        {activeTab === "Stream" && (
          <div className="space-y-4 fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Dirette & Programmate</h3>
              <button onClick={() => navigate("/live")} className="text-xs text-primary font-semibold">Apri Live</button>
            </div>

            <div className="flex gap-2.5 overflow-x-auto no-scrollbar">
              {[
                { Icon: CalendarDays, label: "Eventi", path: "/events" },
                { Icon: Podcast, label: "Radio", path: "/radio" },
                { Icon: Trophy, label: "Sfide", path: "/challenges" },
              ].map(item => (
                <button key={item.label} onClick={() => navigate(item.path)}
                   className="flex flex-col items-center gap-1.5 py-3 min-w-[80px] rounded-2xl bg-primary/15 border border-primary/30 hover:border-primary/50 transition-all duration-200 shrink-0 shadow-sm">
                   <item.Icon className="w-5 h-5 text-primary" />
                   <span className="text-[10px] text-primary font-semibold">{item.label}</span>
                 </button>
              ))}
            </div>

            {displayLiveStreams.length === 0 ? (
              <div className="text-center py-12">
                <Video className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Nessun live stream attivo</p>
                 <button onClick={() => navigate("/live")} className="mt-4 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/30">
                   Vai alla sezione Live
                 </button>
              </div>
            ) : (
              displayLiveStreams.map(stream => (
                <button key={stream.id} onClick={() => navigate("/live")}
                  className="w-full relative aspect-video rounded-2xl overflow-hidden bg-card border border-border/50">
                  <img src={stream.thumbnail_url || beauty2} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/80" />
                  <div className="absolute top-3 left-3">
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground live-pulse" />Live
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 glass px-2 py-1 rounded-full">
                    <Eye className="w-3 h-3" /><span className="text-[10px]">{stream.viewer_count}</span>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <p className="font-semibold text-sm">{stream.title}</p>
                    <p className="text-xs text-muted-foreground">{stream.professional?.business_name || 'Beauty Streamer'}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {sharePost && (
        <ShareMenu
          title={sharePost.caption || "Post su Style"}
          description={`di ${sharePost.profileData?.display_name || "Style User"}`}
          onClose={() => setSharePost(null)}
          onChatShare={() => { navigate("/chat"); setSharePost(null); }}
        />
      )}
    </MobileLayout>
  );
}
