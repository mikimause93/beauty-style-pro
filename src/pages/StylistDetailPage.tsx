import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Star, MapPin, Clock, Calendar, Heart, Share2, MessageCircle, Check } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFollow } from "@/hooks/useFollow";
import { supabase } from "@/integrations/supabase/client";
import ShareMenu from "@/components/ShareMenu";
import stylist2 from "@/assets/stylist-2.jpg";
import beauty1 from "@/assets/beauty-1.jpg";
import beauty2 from "@/assets/beauty-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";

const fallbackStylist = {
  id: "1", name: "Martina Rossi", specialty: "Hairstylist · Colorist", city: "Milano",
  rating: 4.9, reviewCount: 127, user_id: "",
  bio: "Specializzata in balayage e tecniche di colorazione avanzate. 10+ anni di esperienza nei migliori saloni di Milano.",
  avatar: stylist2, verified: true,
  services: [
    { id: "1", name: "Taglio Donna", price: 35, duration: 45 },
    { id: "2", name: "Colore + Piega", price: 65, duration: 90 },
    { id: "3", name: "Balayage", price: 120, duration: 120 },
    { id: "4", name: "Piega", price: 25, duration: 30 },
    { id: "5", name: "Trattamento Keratina", price: 80, duration: 60 },
  ],
  reviews: [
    { id: "1", name: "Anna M.", rating: 5, comment: "Fantastica! Il balayage è venuto perfetto 😍", date: "2 giorni fa" },
    { id: "2", name: "Laura R.", rating: 5, comment: "Professionale e gentilissima!", date: "1 settimana fa" },
    { id: "3", name: "Sofia B.", rating: 4, comment: "Ottimo taglio, ambiente accogliente", date: "2 settimane fa" },
  ],
  gallery: [beauty1, beauty2, beauty3, stylist2, beauty1, beauty2],
};

export default function StylistDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"services" | "reviews" | "gallery">("services");
  const [stylist, setStylist] = useState(fallbackStylist);
  const [services, setServices] = useState(fallbackStylist.services);
  const [showShare, setShowShare] = useState(false);

  // Fetch real professional data
  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: pro } = await supabase.from("professionals").select("*").eq("id", id).single();
      if (pro) {
        setStylist(prev => ({
          ...prev,
          name: pro.business_name,
          specialty: pro.specialty || "Beauty Pro",
          city: pro.city || "",
          rating: Number(pro.rating) || 4.9,
          reviewCount: pro.review_count || 0,
          verified: pro.is_verified || false,
          bio: pro.description || prev.bio,
          user_id: pro.user_id,
        }));
        // Fetch services
        const { data: svc } = await supabase.from("services").select("*").eq("professional_id", id).eq("active", true);
        if (svc && svc.length > 0) setServices(svc.map(s => ({ id: s.id, name: s.name, price: Number(s.price), duration: s.duration_minutes })));
        // Fetch reviews
        const { data: rev } = await supabase.from("reviews").select("*").eq("professional_id", id).order("created_at", { ascending: false }).limit(10);
        if (rev && rev.length > 0) {
          setStylist(prev => ({
            ...prev,
            reviews: rev.map(r => ({ id: r.id, name: "Cliente", rating: r.rating, comment: r.comment || "", date: new Date(r.created_at).toLocaleDateString("it-IT") })),
          }));
        }
      }
    })();
  }, [id]);

  const { isFollowing, followerCount, toggleFollow, loading: followLoading } = useFollow(stylist.user_id || undefined);

  const handleFollow = () => {
    if (!user) { navigate("/auth"); return; }
    toggleFollow();
  };

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-display font-bold text-gradient-primary">STYLE</h1>
        <button onClick={() => setShowShare(true)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <Share2 className="w-4 h-4 text-muted-foreground" />
        </button>
      </header>

      <div className="px-4 py-4">
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-28 h-28 rounded-full p-0.5 gradient-primary mb-3 relative">
            <img src={stylist.avatar} alt="" className="w-full h-full rounded-full object-cover border-3 border-background" />
            {stylist.verified && (
              <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
          </div>
          <h2 className="text-xl font-display font-bold">{stylist.name}</h2>
          <p className="text-sm text-primary">💇‍♀️ {stylist.specialty}</p>
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{stylist.city}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4">
            <div className="text-center">
              <p className="font-bold">{followerCount > 999 ? `${(followerCount / 1000).toFixed(1)}K` : followerCount}</p>
              <p className="text-[10px] text-muted-foreground">Followers</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <p className="font-bold">{stylist.rating}</p>
              </div>
              <p className="text-[10px] text-muted-foreground">{stylist.reviewCount} reviews</p>
            </div>
            <div className="text-center">
              <p className="font-bold">{services.length}</p>
              <p className="text-[10px] text-muted-foreground">Servizi</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-3 max-w-[280px]">{stylist.bio}</p>

          {/* Actions */}
          <div className="flex gap-3 mt-4 w-full">
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${
                isFollowing ? "bg-card border border-border" : "gradient-primary text-primary-foreground shadow-glow"
              }`}
            >
              <Heart className={`w-4 h-4 ${isFollowing ? "fill-primary text-primary" : ""}`} />
              {isFollowing ? "Following" : "Follow"}
            </button>
            <button onClick={() => navigate(`/booking/${id}`)}
              className="flex-1 py-2.5 rounded-xl bg-yellow-500 text-black font-semibold text-sm flex items-center justify-center gap-1.5">
              <Calendar className="w-4 h-4" /> Book
            </button>
            <button onClick={() => navigate("/chat")}
              className="w-11 h-11 rounded-xl bg-card border border-border flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(["services", "reviews", "gallery"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                activeTab === tab ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
              {tab === "services" ? "Servizi" : tab === "reviews" ? "Recensioni" : "Galleria"}
            </button>
          ))}
        </div>

        {activeTab === "services" && (
          <div className="space-y-2 fade-in">
            {services.map(service => (
              <div key={service.id} className="flex items-center justify-between p-3 rounded-xl bg-card shadow-card">
                <div>
                  <p className="text-sm font-medium">{service.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {service.duration} min
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">€{service.price}</p>
                  <button onClick={() => navigate(`/booking/${id}?service=${service.id}`)}
                    className="mt-1 px-3 py-1 rounded-full gradient-primary text-primary-foreground text-[10px] font-semibold">
                    Prenota
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-3 fade-in">
            {stylist.reviews.map(review => (
              <div key={review.id} className="p-3 rounded-xl bg-card shadow-card">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">{review.name}</p>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{review.comment}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{review.date}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "gallery" && (
          <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden fade-in">
            {stylist.gallery.map((img, i) => (
              <div key={i} className="aspect-square">
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      {showShare && (
        <ShareMenu
          url={window.location.href}
          title={`${stylist.name} su STYLE`}
          description={stylist.bio}
          onClose={() => setShowShare(false)}
        />
      )}
    </MobileLayout>
  );
}
