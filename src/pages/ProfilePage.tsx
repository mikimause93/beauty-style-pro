import { Settings, Edit3, Heart, Calendar, Star, Users, Coins, Share2, Copy, LogOut, LogIn, ChevronRight, Trophy, Gift, BarChart3, Briefcase, Building2, ShoppingBag, Video, MessageCircle, Bell, Cog, Grid3X3, Bookmark, Tag, MapPin, Link, ExternalLink, Plus, Camera, Scissors, RotateCw, Phone, Wallet, Crown, Rocket, Store } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useFollow } from "@/hooks/useFollow";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/layout/MobileLayout";
import ShareMenu from "@/components/ShareMenu";
import PostCard from "@/components/feed/PostCard";
import ProfileShowcasePanel from "@/components/profile/ProfileShowcasePanel";
import stylist2 from "@/assets/stylist-2.jpg";
import beauty1 from "@/assets/beauty-1.jpg";
import beauty2 from "@/assets/beauty-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";
import { toast } from "sonner";

interface ProfilePost {
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

export default function ProfilePage() {
  const { id: viewUserId } = useParams();
  const { user, profile, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"grid" | "feed" | "products" | "saved" | "vetrina">("grid");
  const [myPosts, setMyPosts] = useState<ProfilePost[]>([]);
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [viewProfile, setViewProfile] = useState<any>(null);
  const [showShare, setShowShare] = useState(false);
  const [sharePost, setSharePost] = useState<ProfilePost | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  // Determine if viewing own profile or someone else's
  const isOwnProfile = !viewUserId || viewUserId === user?.id;
  const targetUserId = isOwnProfile ? user?.id : viewUserId;

  const { isFollowing, followerCount, toggleFollow, loading: followLoading } = useFollow(
    !isOwnProfile ? targetUserId : undefined
  );

  useEffect(() => {
    if (targetUserId) {
      loadPosts();
      loadProducts();
      if (!isOwnProfile) loadViewProfile();
    }
  }, [targetUserId]);

  const loadViewProfile = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("user_id", targetUserId!).single();
    if (data) setViewProfile(data);
  };

  const loadPosts = async () => {
    const { data } = await supabase.from("posts").select("*").eq("user_id", targetUserId!).order("created_at", { ascending: false }).limit(30);
    if (data) {
      const p = isOwnProfile ? profile : viewProfile;
      setMyPosts(data.map(post => ({
        ...post,
        profileData: p ? { display_name: p.display_name, avatar_url: p.avatar_url, user_type: p.user_type } : undefined,
      })));
    }
  };

  const loadProducts = async () => {
    const { data } = await supabase.from("products").select("*").eq("seller_id", targetUserId!).eq("active", true).order("created_at", { ascending: false });
    if (data) setMyProducts(data);
  };

  // Re-load posts once viewProfile is fetched
  useEffect(() => {
    if (viewProfile && !isOwnProfile) loadPosts();
  }, [viewProfile]);

  const displayProfile = isOwnProfile ? profile : viewProfile;

  if (!user && isOwnProfile) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
          <LogIn className="w-10 h-10 text-primary mb-4" />
          <h2 className="text-xl font-display font-bold mb-2">Accedi a STYLE</h2>
          <p className="text-sm text-muted-foreground mb-8">Registrati o accedi per gestire il tuo profilo</p>
          <button onClick={() => navigate("/auth")} className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold">
            Accedi / Registrati
          </button>
        </div>
      </MobileLayout>
    );
  }

  const isProfessional = displayProfile?.user_type === 'professional';
  const isBusiness = displayProfile?.user_type === 'business';

  const postCount = myPosts.length;
  const followerDisplay = isOwnProfile ? (displayProfile?.follower_count || 0) : followerCount;
  const followingDisplay = displayProfile?.following_count || 0;

  const fallbackImages = [beauty1, beauty2, beauty3, stylist2];

  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isOwnProfile && (
            <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
          )}
          <h1 className="text-base font-display font-bold truncate max-w-[180px]">
            {displayProfile?.display_name || 'Profilo'}
          </h1>
          {(isProfessional || isBusiness) && (
            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-primary/15 text-primary">✓</span>
          )}
        </div>
        <div className="flex gap-1">
          {isOwnProfile && (
            <>
              <button onClick={() => navigate("/create-post")} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
                <Plus className="w-4.5 h-4.5 text-muted-foreground" />
              </button>
              <button onClick={() => setShowMenu(!showMenu)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
                <Settings className="w-4.5 h-4.5 text-muted-foreground" />
              </button>
            </>
          )}
          {!isOwnProfile && (
            <button onClick={() => setShowShare(true)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
              <Share2 className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </header>

      {/* Settings Menu Dropdown */}
      {showMenu && isOwnProfile && (
        <div className="absolute top-14 right-4 z-50 w-56 rounded-2xl bg-card border border-border shadow-lg py-2 fade-in">
          {[
            { icon: Edit3, label: "Modifica Profilo", action: () => navigate("/profile/edit") },
            { icon: Bookmark, label: "Salvati", action: () => setActiveTab("saved") },
            { icon: Bell, label: `Notifiche${unreadCount > 0 ? ` (${unreadCount})` : ''}`, action: () => navigate("/notifications") },
            ...(isProfessional || isBusiness ? [
              { icon: BarChart3, label: "Analytics", action: () => navigate("/analytics") },
              { icon: ShoppingBag, label: "Gestisci Prodotti", action: () => navigate("/manage-products") },
              { icon: Briefcase, label: "Annunci Lavoro", action: () => navigate("/hr") },
              { icon: Video, label: "Vai Live", action: () => navigate("/go-live") },
            ] : []),
            ...(isBusiness ? [
              { icon: Building2, label: "Dashboard Business", action: () => navigate("/business") },
            ] : []),
            { icon: ShoppingBag, label: "Marketplace", action: () => navigate("/marketplace") },
            { icon: Gift, label: "Invita Amici", action: () => navigate("/referral") },
            { icon: Crown, label: "Abbonamenti", action: () => navigate("/subscriptions") },
            { icon: Rocket, label: "Boost Profilo", action: () => navigate("/boost") },
            { icon: Wallet, label: "Wallet", action: () => navigate("/wallet") },
            { icon: Coins, label: "QR Coins", action: () => navigate("/qr-coins") },
            { icon: Cog, label: "Impostazioni", action: () => navigate("/settings") },
            { icon: LogOut, label: "Esci", action: async () => { await signOut(); toast.success("Disconnesso"); navigate("/auth"); } },
          ].map(item => {
            const Icon = item.icon;
            return (
              <button key={item.label} onClick={() => { setShowMenu(false); item.action(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/50 transition-colors">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="px-4 pb-6">
        {/* Profile Info — Instagram style */}
        <div className="flex items-start gap-5 py-5">
          {/* Avatar */}
          <div className="shrink-0 relative">
            <div className={`w-20 h-20 rounded-full p-[2px] ${isProfessional || isBusiness ? "bg-gradient-to-br from-primary to-accent" : "bg-border"}`}>
              <img
                src={displayProfile?.avatar_url || stylist2}
                alt=""
                className="w-full h-full rounded-full object-cover border-2 border-background"
              />
            </div>
            {isOwnProfile && (
              <button onClick={() => navigate("/profile/edit")}
                className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                <Camera className="w-3 h-3 text-primary-foreground" />
              </button>
            )}
          </div>

          {/* Stats Row */}
          <div className="flex-1 pt-1">
            <div className="flex justify-around text-center">
              <button onClick={() => setActiveTab("grid")} className="flex flex-col items-center">
                <span className="text-lg font-bold">{postCount}</span>
                <span className="text-[10px] text-muted-foreground">Post</span>
              </button>
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold">{followerDisplay > 9999 ? `${(followerDisplay / 1000).toFixed(1)}K` : followerDisplay}</span>
                <span className="text-[10px] text-muted-foreground">Follower</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold">{followingDisplay}</span>
                <span className="text-[10px] text-muted-foreground">Seguiti</span>
              </div>
            </div>
          </div>
        </div>

        {/* Name, Bio, Links */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold">{displayProfile?.display_name || 'Utente STYLE'}</h2>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
              isBusiness ? 'bg-accent/20 text-accent' : isProfessional ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {isBusiness ? 'Business' : isProfessional ? 'Pro' : 'Cliente'}
            </span>
          </div>

          {displayProfile?.bio && (
            <p className="text-xs text-foreground mt-1 leading-relaxed whitespace-pre-line">{displayProfile.bio}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-2">
            {displayProfile?.city && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {displayProfile.city}
              </span>
            )}
            {displayProfile?.skills && displayProfile.skills.length > 0 && (
              <span className="text-[11px] text-primary flex items-center gap-1">
                <Tag className="w-3 h-3" /> {displayProfile.skills.slice(0, 2).join(', ')}
              </span>
            )}
          </div>

          {/* QR Coins badge */}
          {isOwnProfile && (
            <button onClick={() => navigate("/qr-coins")} className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-xs font-semibold">
              <Coins className="w-3 h-3 text-accent" />
              {displayProfile?.qr_coins?.toLocaleString() || '0'} QR Coins
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-5">
          {isOwnProfile ? (
            <>
              <button onClick={() => navigate("/profile/edit")}
                className="flex-1 py-2 rounded-lg bg-muted text-sm font-semibold">
                Modifica profilo
              </button>
              <button onClick={() => navigate("/referral")}
                className="flex-1 py-2 rounded-lg bg-muted text-sm font-semibold flex items-center justify-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" /> Condividi
              </button>
              {(isProfessional || isBusiness) ? (
                <button onClick={() => navigate("/go-live")}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
                  Live
                </button>
              ) : (
                <button onClick={() => navigate("/become-creator")}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
                  Diventa Pro
                </button>
              )}
            </>
          ) : (
            <>
              <button onClick={() => { if (!user) { navigate("/auth"); return; } toggleFollow(); }}
                disabled={followLoading}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isFollowing ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
                }`}>
                {isFollowing ? "Segui già" : "Segui"}
              </button>
              <button onClick={() => navigate("/chat")}
                className="flex-1 py-2 rounded-lg bg-muted text-sm font-semibold">
                Messaggio
              </button>
              <button
                onClick={() => {
                  const phone = viewProfile?.phone || "";
                  const name = viewProfile?.display_name || "professionista";
                  const msg = encodeURIComponent(`Ciao ${name}! Ti ho trovato su STYLE e vorrei prenotare un servizio.`);
                  window.open(phone ? `https://wa.me/${phone.replace(/\D/g, "")}?text=${msg}` : `https://wa.me/?text=${msg}`, "_blank");
                }}
                className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-primary-foreground" />
              </button>
              <button onClick={() => navigate(`/booking/${viewUserId}`)}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
                Prenota
              </button>
            </>
          )}
        </div>

        {/* Quick Actions — only for own profile */}
        {isOwnProfile && (
          <div className="flex gap-3 mb-5 overflow-x-auto no-scrollbar pb-1">
            {[
              { Icon: Calendar, label: "Prenotazioni", path: "/my-bookings" },
              { Icon: ShoppingBag, label: "Shop", path: "/shop" },
              { Icon: MessageCircle, label: "Chat", path: "/chat" },
              { Icon: Trophy, label: "Sfide", path: "/challenges" },
              { Icon: RotateCw, label: "Gira&Vinci", path: "/spin" },
              ...(isProfessional || isBusiness ? [
                { Icon: BarChart3, label: "Analytics", path: "/analytics" },
                { Icon: Users, label: "HR", path: "/hr" },
              ] : []),
            ].map(item => {
              const ItemIcon = item.Icon;
              return (
                <button key={item.label} onClick={() => navigate(item.path)}
                  className="flex flex-col items-center gap-1 min-w-[56px]">
                  <div className="w-14 h-14 rounded-full bg-muted/60 border border-border/50 flex items-center justify-center">
                    <ItemIcon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <span className="text-[9px] text-muted-foreground font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Tabs — Instagram style icons */}
        <div className="flex border-t border-border">
          {[
            { key: "grid" as const, icon: Grid3X3 },
            { key: "feed" as const, icon: Heart },
            ...((isProfessional || isBusiness) ? [{ key: "vetrina" as const, icon: Store }] : []),
            ...(myProducts.length > 0 || (isOwnProfile && (isProfessional || isBusiness)) ? [{ key: "products" as const, icon: Tag }] : []),
            ...(isOwnProfile ? [{ key: "saved" as const, icon: Bookmark }] : []),
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-3 flex justify-center transition-colors ${
                  activeTab === tab.key ? "border-t-2 border-foreground text-foreground" : "text-muted-foreground"
                }`}>
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>

        {/* Grid View */}
        {activeTab === "grid" && (
          <div className="fade-in">
            {myPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-0.5">
                {myPosts.map((post, i) => (
                  <div key={post.id} className="aspect-square relative group cursor-pointer" onClick={() => setActiveTab("feed")}>
                    <img src={post.image_url || fallbackImages[i % fallbackImages.length]} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-background/0 group-hover:bg-background/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 gap-3">
                      <span className="flex items-center gap-1 text-xs font-bold text-foreground">
                        <Heart className="w-3.5 h-3.5 fill-foreground" /> {post.like_count}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-bold text-foreground">
                        <MessageCircle className="w-3.5 h-3.5 fill-foreground" /> {post.comment_count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Camera className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-semibold mb-1">Nessun post ancora</p>
                <p className="text-xs text-muted-foreground mb-4">Condividi il tuo primo contenuto</p>
                {isOwnProfile && (
                  <button onClick={() => navigate("/create-post")} className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    Crea Post
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Feed View — Full post cards with scroll */}
        {activeTab === "feed" && (
          <div className="space-y-4 pt-4 fade-in">
            {myPosts.length > 0 ? myPosts.map(post => (
              <PostCard key={post.id} post={post} onShare={() => setSharePost(post)} fallbackImage={beauty1} />
            )) : (
              <p className="text-center text-sm text-muted-foreground py-12">Nessun post</p>
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="pt-4 fade-in">
            {myProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {myProducts.map(product => (
                  <div key={product.id} className="rounded-xl bg-card border border-border/50 overflow-hidden">
                    {product.image_url && (
                      <img src={product.image_url} alt="" className="w-full aspect-square object-cover" />
                    )}
                    <div className="p-3">
                      <p className="text-xs font-semibold truncate">{product.name}</p>
                      <p className="text-sm font-bold text-primary mt-0.5">€{Number(product.price).toFixed(2)}</p>
                      {product.category && <span className="text-[9px] text-muted-foreground">{product.category}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingBag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nessun prodotto</p>
                {isOwnProfile && (isProfessional || isBusiness) && (
                  <button onClick={() => navigate("/manage-products")} className="mt-3 px-5 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    Aggiungi Prodotto
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Saved Tab */}
        {activeTab === "saved" && isOwnProfile && (
          <div className="text-center py-16 fade-in">
            <Bookmark className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm font-semibold mb-1">Contenuti Salvati</p>
            <p className="text-xs text-muted-foreground">I post che salvi appariranno qui</p>
          </div>
        )}
      </div>

      {/* Overlay to close menu */}
      {showMenu && <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />}

      {showShare && (
        <ShareMenu
          url={window.location.href}
          title={`${displayProfile?.display_name || 'Utente'} su STYLE`}
          description={displayProfile?.bio || "Scopri il profilo su STYLE"}
          onClose={() => setShowShare(false)}
        />
      )}
      {sharePost && (
        <ShareMenu
          title={sharePost.caption || "Post su STYLE"}
          description={`di ${sharePost.profileData?.display_name || "Style User"}`}
          onClose={() => setSharePost(null)}
          onChatShare={() => { navigate("/chat"); setSharePost(null); }}
        />
      )}
    </MobileLayout>
  );
}
