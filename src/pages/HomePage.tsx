import { Search, Bell, MessageCircle } from "lucide-react";
import beauty1 from "@/assets/beauty-1.jpg";
import beauty2 from "@/assets/beauty-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";
import logo from "@/assets/logo.png";
import MobileLayout from "@/components/layout/MobileLayout";
import { Heart, Play, Eye, Coins, Plus, Calendar, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const stories = [
  { id: 1, name: "Beauty Hits", img: stylist1, isLive: true },
  { id: 2, name: "Martina R.", img: stylist2, isLive: true },
  { id: 3, name: "Salon Luxe", img: beauty2, isLive: false },
  { id: 4, name: "Hair Art", img: beauty1, isLive: false },
  { id: 5, name: "Glow Up", img: beauty3, isLive: false },
];

const feedPosts = [
  {
    id: 1,
    author: "Martina Rossi",
    avatar: stylist2,
    role: "Hairstylist ✨",
    image: beauty1,
    likes: 342,
    comments: 28,
    caption: "New balayage technique! 🔥 Risultato incredibile sulla mia cliente",
    isLive: false,
  },
  {
    id: 2,
    author: "Beauty Ross",
    avatar: stylist1,
    role: "Makeup Artist 💄",
    image: beauty2,
    likes: 518,
    comments: 45,
    caption: "Bridal look perfetto per questa stagione 💍",
    isLive: true,
    viewers: 1240,
  },
  {
    id: 3,
    author: "Marco Style",
    avatar: beauty3,
    role: "Barber 💈",
    image: beauty3,
    likes: 189,
    comments: 12,
    caption: "Fade perfetto + beard trim combo 🔥",
    isLive: false,
  },
];

const tabs = ["New", "Stylists", "Most", "Stream"];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("New");
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  const toggleLike = (id: number) => {
    setLikedPosts(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Stayle" className="w-8 h-8" />
            <h1 className="text-xl font-display font-bold text-gradient-primary">Stayle</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center relative">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
            </button>
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "gradient-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Stories */}
      <div className="flex gap-3 px-4 py-4 overflow-x-auto no-scrollbar">
        {stories.map(story => (
          <button key={story.id} className="flex flex-col items-center gap-1 min-w-[68px]">
            <div className={`w-16 h-16 rounded-full p-0.5 ${
              story.isLive ? "gradient-live" : "bg-border"
            }`}>
              <img
                src={story.img}
                alt={story.name}
                className="w-full h-full rounded-full object-cover border-2 border-background"
              />
            </div>
            <span className="text-[10px] text-muted-foreground truncate w-16 text-center">
              {story.name}
            </span>
            {story.isLive && (
              <span className="text-[9px] font-bold text-live bg-live/20 px-2 py-0.5 rounded-full -mt-0.5">
                LIVE
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 px-4 mb-4">
        <button onClick={() => navigate("/create-post")} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl gradient-primary text-primary-foreground text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" /> Nuovo Post
        </button>
        <button onClick={() => navigate("/stylists")} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-card border border-border text-xs font-semibold">
          <Users className="w-3.5 h-3.5" /> Stilisti
        </button>
        <button onClick={() => navigate("/events")} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-card border border-border text-xs font-semibold">
          <Calendar className="w-3.5 h-3.5" /> Eventi
        </button>
      </div>

      {/* Feed */}
      <div className="flex flex-col gap-4 px-4 pb-4">
        {feedPosts.map(post => (
          <article key={post.id} className="rounded-2xl overflow-hidden bg-card shadow-card fade-in">
            {/* Post Header */}
            <div className="flex items-center gap-3 p-3">
              <img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{post.author}</p>
                <p className="text-xs text-muted-foreground">{post.role}</p>
              </div>
              {post.isLive && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-live text-primary-foreground text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground live-pulse" />
                  LIVE
                </span>
              )}
            </div>

            {/* Image */}
            <div className="relative aspect-[4/5] bg-muted">
              <img src={post.image} alt="" className="w-full h-full object-cover" />
              {post.isLive && (
                <div className="absolute inset-0 bg-background/20 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-glow">
                    <Play className="w-6 h-6 text-primary-foreground ml-1" />
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1 glass px-2 py-1 rounded-full">
                    <Eye className="w-3 h-3 text-primary" />
                    <span className="text-xs font-medium">{post.viewers?.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1">
                    <Heart
                      className={`w-5 h-5 transition-all ${
                        likedPosts.includes(post.id)
                          ? "text-primary fill-primary scale-110"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-xs text-muted-foreground">{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-1">
                    <MessageCircle className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{post.comments}</span>
                  </button>
                </div>
                <button className="flex items-center gap-1 px-3 py-1 rounded-full bg-gold/20">
                  <Coins className="w-4 h-4 text-gold" />
                  <span className="text-xs font-semibold text-gold">Tip</span>
                </button>
              </div>
              <p className="text-sm">
                <span className="font-semibold">{post.author}</span>{" "}
                <span className="text-muted-foreground">{post.caption}</span>
              </p>
            </div>
          </article>
        ))}
      </div>
    </MobileLayout>
  );
}
