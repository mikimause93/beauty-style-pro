import MobileLayout from "@/components/layout/MobileLayout";
import { ShoppingBag, Coins, ChevronRight, Gift, Star, Heart, Search, ShoppingCart, Plus, Package } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
}

const fallbackImages = [beauty1, beauty2, beauty3, stylist1, stylist2];

const sections = [
  { key: "products" as const, label: "Prodotti", icon: ShoppingBag },
  { key: "categories" as const, label: "Categorie", icon: Star },
  { key: "featured" as const, label: "In Evidenza", icon: Gift },
  { key: "my_products" as const, label: "I Miei", icon: Package },
];

export default function ShopPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [activeSection, setActiveSection] = useState<"products" | "categories" | "featured" | "my_products">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number; image: string }[]>([]);
  const [likedProducts, setLikedProducts] = useState<string[]>([]);
  const [cart, setCart] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", description: "", category: "Hair Care" });

  const qrCoins = profile?.qr_coins || 0;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      setProducts(data);
      // Build categories
      const catMap = new Map<string, number>();
      data.forEach(p => {
        const cat = p.category || "Altro";
        catMap.set(cat, (catMap.get(cat) || 0) + 1);
      });
      setCategories(Array.from(catMap.entries()).map(([name, count], i) => ({
        name,
        count,
        image: fallbackImages[i % fallbackImages.length],
      })));
    } else {
      // Fallback products
      setProducts([
        { id: "1", name: "Olio Ristrutturante Pro", price: 34.99, image_url: null, rating: 4.8, review_count: 127, category: "Hair Care", description: null },
        { id: "2", name: "Maschera Idratante Bio", price: 28.50, image_url: null, rating: 4.6, review_count: 89, category: "Skincare", description: null },
        { id: "3", name: "Siero Luminosità", price: 42.00, image_url: null, rating: 4.9, review_count: 214, category: "Skincare", description: null },
        { id: "4", name: "Shampoo Ristrutturante", price: 19.99, image_url: null, rating: 4.5, review_count: 56, category: "Hair Care", description: null },
        { id: "5", name: "Balsamo Nutriente", price: 22.00, image_url: null, rating: 4.7, review_count: 98, category: "Hair Care", description: null },
        { id: "6", name: "Spray Protettivo", price: 15.99, image_url: null, rating: 4.4, review_count: 34, category: "Makeup", description: null },
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

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-display font-bold">Shop & Prodotti</h1>
          <div className="flex items-center gap-2">
            <button className="relative w-9 h-9 rounded-full bg-muted flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-muted-foreground" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full gradient-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">{cart.length}</span>
              )}
            </button>
            <button onClick={() => navigate("/qr-coins")} className="flex items-center gap-2 px-3 py-1.5 rounded-full gradient-gold">
              <Coins className="w-4 h-4 text-gold-foreground" />
              <span className="text-sm font-bold text-gold-foreground">{qrCoins.toLocaleString()}</span>
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          {sections.map(s => {
            const Icon = s.icon;
            return (
              <button key={s.key} onClick={() => setActiveSection(s.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeSection === s.key ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                <Icon className="w-3.5 h-3.5" />{s.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="p-4">
        {/* Promo Code Input */}
        <div className="flex gap-2 mb-4">
          <input
            value={promoCode}
            onChange={e => setPromoCode(e.target.value)}
            onKeyDown={e => e.key === "Enter" && applyPromoCode()}
            placeholder="Codice promozionale..."
            className="flex-1 h-10 rounded-xl bg-muted px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <button onClick={applyPromoCode} className="px-4 h-10 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold">
            Applica
          </button>
        </div>

        {appliedPromo && (
          <div className="mb-4 p-3 rounded-xl bg-success/10 border border-success/30 text-sm">
            ✅ Codice <span className="font-bold">{appliedPromo.code}</span> attivo — Sconto {appliedPromo.discount}%
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="aspect-square rounded-xl bg-card animate-pulse" />)}
          </div>
        ) : (
          <>
            {activeSection === "products" && (
              <div className="space-y-4 fade-in">
                <div className="rounded-2xl overflow-hidden relative aspect-[2/1]">
                  <img src={beauty2} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-transparent flex items-center px-5">
                    <div>
                      <span className="px-2 py-0.5 rounded-full gradient-primary text-primary-foreground text-[10px] font-bold">Prodotto Top</span>
                      <h3 className="text-lg font-display font-bold mt-2">Cosmohairr Beam</h3>
                      <p className="text-xs text-muted-foreground">Max Mascolini</p>
                      <p className="text-lg font-bold text-gradient-gold mt-1">€39.99</p>
                      <button className="mt-2 px-4 py-1.5 rounded-full gradient-primary text-primary-foreground text-xs font-semibold">
                        Acquista Ora
                      </button>
                    </div>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tutti i Prodotti</h3>
                <div className="grid grid-cols-2 gap-3">
                  {products.map((product, idx) => (
                    <div key={product.id} className="rounded-xl bg-card overflow-hidden shadow-card">
                      <div className="relative">
                        <img src={getImage(product, idx)} alt={product.name} className="w-full aspect-square object-cover" />
                        <button onClick={() => toggleLike(product.id)}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full glass flex items-center justify-center">
                          <Heart className={`w-4 h-4 ${likedProducts.includes(product.id) ? "text-primary fill-primary" : "text-primary-foreground"}`} />
                        </button>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-bold text-primary">€{product.price}</span>
                          <span className="text-xs text-gold flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-gold" /> {product.rating || 4.5}
                          </span>
                        </div>
                        <div className="flex gap-1.5 mt-2">
                          <button onClick={() => addToCart(product.id)} className="flex-1 py-1.5 rounded-lg bg-card border border-border text-[10px] font-semibold hover:bg-muted transition-all">
                            🛒 Carrello
                          </button>
                          <button onClick={() => buyNow(product)} className="flex-1 py-1.5 rounded-lg gradient-primary text-primary-foreground text-[10px] font-semibold">
                            Acquista
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "categories" && (
              <div className="space-y-2 fade-in">
                {categories.map(cat => (
                  <button key={cat.name} onClick={() => setActiveSection("products")} className="w-full flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-muted transition-all shadow-card">
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

            {activeSection === "featured" && (
              <div className="space-y-4 fade-in">
                <p className="text-sm text-muted-foreground">I prodotti più amati dalla community ✨</p>
                {products.slice(0, 4).map((product, idx) => (
                  <div key={product.id} className="flex items-center gap-3 p-3 rounded-xl bg-card shadow-card">
                    <img src={getImage(product, idx)} alt="" className="w-20 h-20 rounded-xl object-cover" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{product.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-gold fill-gold" />
                        <span className="text-xs font-semibold">{product.rating || 4.5}</span>
                        <span className="text-xs text-muted-foreground">({product.review_count || 0})</span>
                      </div>
                      <p className="text-sm font-bold text-primary mt-1">€{product.price}</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <button onClick={() => buyNow(product)} className="px-3 py-2 rounded-xl gradient-primary text-primary-foreground text-xs font-semibold">
                        Acquista
                      </button>
                      <button onClick={() => addToCart(product.id)} className="px-3 py-2 rounded-xl bg-muted text-xs font-semibold">
                        🛒
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </MobileLayout>
  );
}
