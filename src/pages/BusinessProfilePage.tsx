import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFollow } from "@/hooks/useFollow";
import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, MapPin, Star, MessageCircle, Phone, Globe, Users, CheckCircle } from "lucide-react";
import beauty1 from "@/assets/beauty-1.jpg";

export default function BusinessProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [business, setBusiness] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"services" | "shop" | "reviews">("services");
  const [loading, setLoading] = useState(true);

  const { isFollowing, toggleFollow } = useFollow(business?.user_id);

  useEffect(() => {
    if (id) fetchBusiness();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchBusiness = async () => {
    const [bizRes, svcRes, revRes] = await Promise.all([
      supabase.from("businesses").select("*").eq("id", id!).maybeSingle(),
      supabase.from("services").select("*").eq("professional_id", id!).eq("active", true),
      supabase.from("reviews").select("*, profiles:client_id(display_name, avatar_url)").eq("professional_id", id!).order("created_at", { ascending: false }).limit(10),
    ]);
    if (bizRes.data) {
      setBusiness(bizRes.data);
      const { data: productsData } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", bizRes.data.user_id)
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (productsData) setProducts(productsData);
    }
    if (svcRes.data) setServices(svcRes.data);
    if (revRes.data) setReviews(revRes.data);
    setLoading(false);
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  if (!business) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
          <p className="text-muted-foreground">Business non trovato</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-primary text-sm font-semibold">Indietro</button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      {/* Cover */}
      <div className="relative h-48">
        <img src={business.cover_image_url || beauty1} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background" />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-9 h-9 rounded-full glass flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {business.verified && (
          <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-emerald-500/90 text-xs font-bold text-primary-foreground flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Verificato
          </span>
        )}
      </div>

      {/* Profile */}
      <div className="px-4 -mt-10 relative z-10">
        <div className="flex flex-col items-center">
          <img
            src={business.logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${business.business_name}`}
            alt=""
            className="w-20 h-20 rounded-full border-4 border-background object-cover"
          />
          <h1 className="text-xl font-display font-bold mt-2">{business.business_name}</h1>
          {business.description && (
            <p className="text-sm text-muted-foreground text-center mt-1 max-w-xs">{business.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex justify-around py-4 my-4 rounded-2xl bg-card border border-border">
          <div className="text-center">
            <p className="text-lg font-bold">{business.review_count || 0}</p>
            <p className="text-xs text-muted-foreground">Recensioni</p>
          </div>
          <div className="w-px bg-border" />
          <div className="text-center">
            <p className="text-lg font-bold">{business.rating || "0.0"}</p>
            <p className="text-xs text-muted-foreground">Rating</p>
          </div>
          <div className="w-px bg-border" />
          <div className="text-center">
            <p className="text-lg font-bold">{business.employee_count || 0}</p>
            <p className="text-xs text-muted-foreground">Team</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => user ? toggleFollow() : navigate("/auth")}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
              isFollowing
                ? "bg-card border-2 border-primary text-primary"
                : "gradient-primary text-primary-foreground shadow-glow"
            }`}
          >
            {isFollowing ? "Seguito ✓" : "+ Segui"}
          </button>
          <button
            onClick={() => navigate("/chat")}
            className="flex-1 py-3 rounded-xl bg-card border border-border font-semibold text-sm flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" /> Chat
          </button>
        </div>

        {/* Info */}
        <div className="space-y-2 mb-4">
          {business.city && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" /> {business.address || business.city}
            </div>
          )}
          {business.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4" /> {business.phone}
            </div>
          )}
          {business.website && (
            <a href={business.website} target="_blank" rel="noopener" className="flex items-center gap-2 text-sm text-primary">
              <Globe className="w-4 h-4" /> {business.website}
            </a>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-4">
          {(["services", "shop", "reviews"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground"
              }`}
            >
              {tab === "services" ? `Servizi (${services.length})` : tab === "shop" ? `Shop (${products.length})` : `Recensioni (${reviews.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "services" && (
          <div className="space-y-2 pb-4">
            {services.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">Nessun servizio disponibile</p>
            ) : (
              services.map(s => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/service/${s.id}`)}
                  className="w-full text-left p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.duration_minutes} min</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">€{s.price}</p>
                    <span className="text-[10px] text-muted-foreground">Prenota →</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {activeTab === "shop" && (
          <>
            {products.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Nessun prodotto disponibile</p>
                <button onClick={() => navigate("/shop")} className="mt-3 px-5 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold">
                  Vai allo Shop
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pb-4">
                {products.map(p => (
                  <button
                    key={p.id}
                    onClick={() => navigate("/shop")}
                    className="text-left rounded-xl bg-card border border-border overflow-hidden hover:border-primary/30 transition-all"
                  >
                    {p.image_url && (
                      <img src={p.image_url} alt={p.name} className="w-full h-32 object-cover" />
                    )}
                    <div className="p-3">
                      <p className="font-semibold text-sm line-clamp-2">{p.name}</p>
                      <p className="text-primary font-bold mt-1">€{p.price}</p>
                      <span className="text-[10px] text-muted-foreground">Compra →</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-3 pb-4">
            {reviews.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">Nessuna recensione</p>
            ) : (
              reviews.map((r: any) => (
                <div key={r.id} className="p-3 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < r.rating ? "text-gold fill-gold" : "text-muted"}`} />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("it-IT")}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
