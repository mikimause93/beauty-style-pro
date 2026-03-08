import MobileLayout from "@/components/layout/MobileLayout";
import { ShoppingBag, Coins, ChevronRight, Gift, Trophy, Star, Zap, Heart, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import beauty1 from "@/assets/beauty-1.jpg";
import beauty2 from "@/assets/beauty-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";

const categories = [
  { name: "Hair Care", count: 24, tag: "Hot", image: beauty1 },
  { name: "Skincare", count: 18, tag: null, image: beauty2 },
  { name: "Makeup", count: 32, tag: "New", image: beauty3 },
  { name: "Hair More", count: 15, tag: "Hot", image: stylist1 },
];

const products = [
  { id: 1, name: "Olio Ristrutturante Pro", price: 34.99, image: beauty1, rating: 4.8, reviews: 127 },
  { id: 2, name: "Maschera Idratante Bio", price: 28.50, image: beauty2, rating: 4.6, reviews: 89 },
  { id: 3, name: "Siero Luminosità", price: 42.00, image: stylist1, rating: 4.9, reviews: 214 },
  { id: 4, name: "Shampoo Ristrutturante", price: 19.99, image: beauty3, rating: 4.5, reviews: 56 },
];

const sections = [
  { key: "products" as const, label: "Products", icon: ShoppingBag },
  { key: "categories" as const, label: "Categories", icon: Star },
  { key: "featured" as const, label: "Featured", icon: Gift },
];

export default function ShopPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<"products" | "categories" | "featured">("products");
  const [qrCoins] = useState(3450);
  const [likedProducts, setLikedProducts] = useState<number[]>([]);

  const toggleLike = (id: number) => {
    setLikedProducts(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-display font-bold">Shop & Products</h1>
          <button onClick={() => navigate("/qr-coins")} className="flex items-center gap-2 px-3 py-1.5 rounded-full gradient-gold">
            <Coins className="w-4 h-4 text-gold-foreground" />
            <span className="text-sm font-bold text-gold-foreground">{qrCoins.toLocaleString()}</span>
          </button>
        </div>

        <div className="flex gap-2 mt-3">
          {sections.map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeSection === s.key ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {s.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="p-4">
        {activeSection === "products" && (
          <div className="space-y-4 fade-in">
            {/* Featured Product */}
            <div className="rounded-2xl overflow-hidden relative aspect-[2/1]">
              <img src={beauty2} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-transparent flex items-center px-5">
                <div>
                  <span className="px-2 py-0.5 rounded-full gradient-primary text-primary-foreground text-[10px] font-bold">Fav Product</span>
                  <h3 className="text-lg font-display font-bold mt-2">Cosmohairr Beam</h3>
                  <p className="text-xs text-muted-foreground">Max Mascolini</p>
                  <p className="text-lg font-bold text-gradient-gold mt-1">€39.99</p>
                </div>
              </div>
            </div>

            {/* Categories horizontal */}
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {categories.map(cat => (
                <button key={cat.name} className="min-w-[130px] rounded-xl bg-card overflow-hidden shadow-card">
                  <img src={cat.image} alt="" className="w-full aspect-[3/2] object-cover" />
                  <div className="p-2 flex items-center justify-between">
                    <span className="text-xs font-medium">{cat.name}</span>
                    {cat.tag && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        cat.tag === "Hot" ? "bg-live/20 text-live" : "bg-primary/20 text-primary"
                      }`}>
                        {cat.tag}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Products grid */}
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Prodotti</h3>
            <div className="grid grid-cols-2 gap-3">
              {products.map(product => (
                <div key={product.id} className="rounded-xl bg-card overflow-hidden shadow-card">
                  <div className="relative">
                    <img src={product.image} alt={product.name} className="w-full aspect-square object-cover" />
                    <button
                      onClick={() => toggleLike(product.id)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full glass flex items-center justify-center"
                    >
                      <Heart className={`w-4 h-4 ${likedProducts.includes(product.id) ? "text-primary fill-primary" : "text-primary-foreground"}`} />
                    </button>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-bold text-primary">€{product.price}</span>
                      <span className="text-xs text-gold flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-gold" /> {product.rating}
                      </span>
                    </div>
                    <button className="w-full mt-2 py-1.5 rounded-lg gradient-primary text-primary-foreground text-[10px] font-semibold">
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "categories" && (
          <div className="space-y-2 fade-in">
            {categories.map(cat => (
              <button key={cat.name} className="w-full flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-muted transition-all shadow-card">
                <img src={cat.image} alt="" className="w-14 h-14 rounded-lg object-cover" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">{cat.count} prodotti</p>
                </div>
                {cat.tag && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    cat.tag === "Hot" ? "bg-live/20 text-live" : "bg-primary/20 text-primary"
                  }`}>
                    {cat.tag}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}

        {activeSection === "featured" && (
          <div className="space-y-4 fade-in">
            <p className="text-sm text-muted-foreground">I prodotti più amati dalla community ✨</p>
            {products.slice(0, 3).map(product => (
              <div key={product.id} className="flex items-center gap-3 p-3 rounded-xl bg-card shadow-card">
                <img src={product.image} alt="" className="w-20 h-20 rounded-xl object-cover" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{product.name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-gold fill-gold" />
                    <span className="text-xs font-semibold">{product.rating}</span>
                    <span className="text-xs text-muted-foreground">({product.reviews})</span>
                  </div>
                  <p className="text-sm font-bold text-primary mt-1">€{product.price}</p>
                </div>
                <button className="px-3 py-2 rounded-xl gradient-primary text-primary-foreground text-xs font-semibold">
                  Buy
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
