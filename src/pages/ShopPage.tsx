import MobileLayout from "@/components/layout/MobileLayout";
import { ShoppingBag, Coins, ChevronRight, Gift, Star, Heart, Search, ShoppingCart, MessageCircle, Share2, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ShareMenu from "@/components/ShareMenu";
import beauty1 from "@/assets/beauty-1.jpg";
import beauty2 from "@/assets/beauty-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  rating: number | null;
  review_count: number | null;
  category: string | null;
  description: string | null;
  seller_id: string;
}

const fallbackImages = [beauty1, beauty2, beauty3, stylist1, stylist2];

const sections = [
  { key: "products" as const, label: "Vetrina", icon: ShoppingBag },
  { key: "categories" as const, label: "Categorie", icon: Star },
  { key: "featured" as const, label: "Top Rated", icon: Gift },
];

export default function ShopPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [activeSection, setActiveSection] = useState<"products" | "categories" | "featured">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number; image: string }[]>([]);
  const [likedProducts, setLikedProducts] = useState<string[]>([]);
  const [cart, setCart] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [shareProduct, setShareProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [reviewText, setReviewText] = useState("");

  const qrCoins = profile?.qr_coins || 0;

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      setProducts(data);
      const catMap = new Map<string, number>();
      data.forEach(p => {
        const cat = p.category || "Altro";
        catMap.set(cat, (catMap.get(cat) || 0) + 1);
      });
      setCategories(Array.from(catMap.entries()).map(([name, count], i) => ({
        name, count, image: fallbackImages[i % fallbackImages.length],
      })));
    } else {
      setProducts([
        { id: "1", name: "Olio Ristrutturante Pro", price: 34.99, image_url: null, rating: 4.8, review_count: 127, category: "Hair Care", description: "Olio professionale per capelli danneggiati", seller_id: "" },
        { id: "2", name: "Maschera Idratante Bio", price: 28.50, image_url: null, rating: 4.6, review_count: 89, category: "Skincare", description: "Maschera nutriente 100% biologica", seller_id: "" },
        { id: "3", name: "Siero Luminosità", price: 42.00, image_url: null, rating: 4.9, review_count: 214, category: "Skincare", description: "Siero illuminante con vitamina C", seller_id: "" },
        { id: "4", name: "Shampoo Ristrutturante", price: 19.99, image_url: null, rating: 4.5, review_count: 56, category: "Hair Care", description: "Shampoo delicato per uso quotidiano", seller_id: "" },
        { id: "5", name: "Balsamo Nutriente", price: 22.00, image_url: null, rating: 4.7, review_count: 98, category: "Hair Care", description: "Balsamo senza siliconi", seller_id: "" },
        { id: "6", name: "Spray Protettivo", price: 15.99, image_url: null, rating: 4.4, review_count: 34, category: "Makeup", description: "Protezione termica fino a 230°C", seller_id: "" },
      ]);
      setCategories([
        { name: "Hair Care", count: 24, image: beauty1 },
        { name: "Skincare", count: 18, image: beauty2 },
        { name: "Makeup", count: 32, image: beauty3 },
      ]);
    }
    setLoading(false);
  };

  const toggleLike = (id: string) => {
    setLikedProducts(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    toast.success(likedProducts.includes(id) ? "Rimosso dai preferiti" : "Aggiunto ai preferiti ❤️");
  };

  const addToCart = (id: string) => {
    setCart(prev => [...prev, id]);
    toast.success("Aggiunto al carrello! 🛒");
  };

  const buyNow = async (product: Product) => {
    if (!user) { navigate("/auth"); return; }
    const discount = appliedPromo ? (product.price * appliedPromo.discount / 100) : 0;
    const finalPrice = product.price - discount;
    const { error } = await supabase.from("product_purchases").insert({
      buyer_id: user.id,
      product_id: product.id,
      unit_price: product.price,
      total_price: finalPrice,
      discount_amount: discount,
      payment_method: "wallet",
    });
    if (error) {
      toast.error("Errore nell'acquisto");
    } else {
      toast.success(`Acquisto di ${product.name} per €${finalPrice.toFixed(2)}! ✨`);
    }
  };

  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;
    const { data } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", promoCode.trim().toUpperCase())
      .eq("active", true)
      .single();

    if (data) {
      setAppliedPromo({ code: data.code, discount: Number(data.discount_value) });
      toast.success(`Codice ${data.code} applicato! Sconto ${data.discount_value}%`);
    } else {
      toast.error("Codice promozionale non valido");
    }
    setPromoCode("");
  };

  const getImage = (product: Product, index: number) =>
    product.image_url || fallbackImages[index % fallbackImages.length];

  const filteredProducts = searchQuery.trim()
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category?.toLowerCase().includes(searchQuery.toLowerCase()))
    : products;

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-display font-bold">Vetrina Beauty</h1>
          <div className="flex items-center gap-2">
            <button className="relative w-9 h-9 rounded-full bg-muted flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-muted-foreground" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">{cart.length}</span>
              )}
            </button>
            <button onClick={() => navigate("/qr-coins")} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10">
              <Coins className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold">{qrCoins.toLocaleString()}</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cerca prodotti, marchi..."
            className="w-full h-10 rounded-xl bg-muted pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>

        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
          {sections.map(s => {
            const Icon = s.icon;
            return (
              <button key={s.key} onClick={() => setActiveSection(s.key)}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  activeSection === s.key ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                }`}>
                <Icon className="w-3.5 h-3.5" />{s.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="p-4">
        {/* Promo Code */}
        <div className="flex gap-2 mb-4">
          <input
            value={promoCode}
            onChange={e => setPromoCode(e.target.value)}
            onKeyDown={e => e.key === "Enter" && applyPromoCode()}
            placeholder="Codice promozionale..."
            className="flex-1 h-10 rounded-xl bg-muted px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <button onClick={applyPromoCode} className="px-4 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
            Applica
          </button>
        </div>

        {appliedPromo && (
          <div className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm">
            ✅ Codice <span className="font-bold">{appliedPromo.code}</span> attivo — Sconto {appliedPromo.discount}%
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="aspect-square rounded-xl bg-card animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* Products Grid */}
            {activeSection === "products" && (
              <div className="space-y-4 fade-in">
                {/* Hero Banner */}
                <div className="rounded-2xl overflow-hidden relative aspect-[2/1]">
                  <img src={beauty2} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-transparent flex items-center px-5">
                    <div>
                      <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">Prodotto Top</span>
                      <h3 className="text-lg font-display font-bold mt-2">Cosmohairr Beam</h3>
                      <p className="text-xs text-muted-foreground">Max Mascolini</p>
                      <p className="text-lg font-bold text-primary mt-1">€39.99</p>
                      <button className="mt-2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                        Acquista Ora
                      </button>
                    </div>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Scopri i Prodotti</h3>
                <div className="grid grid-cols-2 gap-3">
                  {filteredProducts.map((product, idx) => (
                    <div key={product.id} className="rounded-xl bg-card overflow-hidden border border-border/50">
                      <div className="relative">
                        <img src={getImage(product, idx)} alt={product.name} className="w-full aspect-square object-cover" />
                        <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                          <button onClick={() => toggleLike(product.id)}
                            className="w-8 h-8 rounded-full glass flex items-center justify-center">
                            <Heart className={`w-4 h-4 ${likedProducts.includes(product.id) ? "text-primary fill-primary" : "text-foreground"}`} />
                          </button>
                          <button onClick={() => setShareProduct(product)}
                            className="w-8 h-8 rounded-full glass flex items-center justify-center">
                            <Share2 className="w-4 h-4 text-foreground" />
                          </button>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        {product.description && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{product.description}</p>}
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-sm font-bold text-primary">€{product.price}</span>
                          <span className="text-xs text-accent flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-accent" /> {product.rating || 4.5}
                            <span className="text-muted-foreground">({product.review_count || 0})</span>
                          </span>
                        </div>
                        <div className="flex gap-1.5 mt-2">
                          <button onClick={() => addToCart(product.id)} className="flex-1 py-1.5 rounded-lg bg-muted text-[10px] font-semibold hover:bg-muted/80 transition-all">
                            🛒 Carrello
                          </button>
                          <button onClick={() => buyNow(product)} className="flex-1 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-semibold">
                            Acquista
                          </button>
                        </div>
                        {/* Quick review button */}
                        <button onClick={() => setSelectedProduct(product)}
                          className="w-full mt-1.5 py-1.5 rounded-lg border border-border/50 text-[10px] font-medium text-muted-foreground flex items-center justify-center gap-1 hover:bg-muted/50 transition-all">
                          <MessageCircle className="w-3 h-3" /> Recensione
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {activeSection === "categories" && (
              <div className="space-y-2 fade-in">
                {categories.map(cat => (
                  <button key={cat.name} onClick={() => { setSearchQuery(cat.name); setActiveSection("products"); }} className="w-full flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-muted transition-all border border-border/50">
                    <img src={cat.image} alt="" className="w-14 h-14 rounded-lg object-cover" />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">{cat.count} prodotti</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}

            {/* Top Rated / Featured */}
            {activeSection === "featured" && (
              <div className="space-y-4 fade-in">
                <p className="text-sm text-muted-foreground">I prodotti più amati dalla community ✨</p>
                {filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6).map((product, idx) => (
                  <div key={product.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
                    <div className="relative">
                      <img src={getImage(product, idx)} alt="" className="w-20 h-20 rounded-xl object-cover" />
                      <span className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">#{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{product.name}</p>
                      {product.description && <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{product.description}</p>}
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < Math.round(product.rating || 4.5) ? "text-accent fill-accent" : "text-muted"}`} />
                        ))}
                        <span className="text-xs font-semibold ml-1">{product.rating || 4.5}</span>
                        <span className="text-xs text-muted-foreground">({product.review_count || 0})</span>
                      </div>
                      <p className="text-sm font-bold text-primary mt-1">€{product.price}</p>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button onClick={() => buyNow(product)} className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold">
                        Acquista
                      </button>
                      <button onClick={() => toggleLike(product.id)} className="px-3 py-2 rounded-xl bg-muted text-xs font-semibold flex items-center justify-center gap-1">
                        <Heart className={`w-3 h-3 ${likedProducts.includes(product.id) ? "fill-primary text-primary" : ""}`} />
                      </button>
                      <button onClick={() => setShareProduct(product)} className="px-3 py-2 rounded-xl bg-muted text-xs font-semibold flex items-center justify-center gap-1">
                        <Share2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Review Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/60 backdrop-blur-sm" onClick={() => setSelectedProduct(null)}>
            <div className="w-full max-w-lg bg-card rounded-t-3xl p-5 pb-8 border-t border-border/50" onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />
              <h3 className="font-display font-bold text-base mb-1">Recensione</h3>
              <p className="text-xs text-muted-foreground mb-4">{selectedProduct.name}</p>

              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map(s => (
                  <button key={s} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-accent/20 transition-colors">
                    <Star className="w-4 h-4 text-accent fill-accent" />
                  </button>
                ))}
              </div>

              <textarea
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="Scrivi la tua esperienza con questo prodotto..."
                rows={3}
                className="w-full rounded-xl bg-muted px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/30"
              />

              <div className="flex gap-2 mt-4">
                <button onClick={() => setSelectedProduct(null)} className="flex-1 py-3 rounded-xl bg-muted text-sm font-semibold">
                  Annulla
                </button>
                <button onClick={() => { toast.success("Recensione inviata! ⭐"); setSelectedProduct(null); setReviewText(""); }}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
                  Pubblica
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Share Menu */}
      {shareProduct && (
        <ShareMenu
          onClose={() => setShareProduct(null)}
          title={shareProduct.name}
          url={`https://stayle.app/product/${shareProduct.id}`}
        />
      )}
    </MobileLayout>
  );
}
