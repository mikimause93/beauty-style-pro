import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Plus, Star, Package, ChevronRight, Loader2, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ShopProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string | null;
  rating: number | null;
  stock: number | null;
}

interface ProfileShop {
  id: string;
  shop_name: string;
  shop_description: string | null;
  total_products: number;
  avg_rating: number;
  is_active: boolean;
}

export default function ProfileShopTab({ userId, isOwnProfile }: { userId: string; isOwnProfile: boolean }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shop, setShop] = useState<ProfileShop | null>(null);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShopData();
  }, [userId]);

  const loadShopData = async () => {
    setLoading(true);
    
    // Load shop info
    const { data: shopData } = await supabase
      .from("profile_shops")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    setShop(shopData);

    // Load products from the products table
    const { data: productsData } = await supabase
      .from("products")
      .select("id, name, price, image_url, category, rating, stock")
      .eq("seller_id", userId)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(6);

    setProducts(productsData || []);
    setLoading(false);
  };

  const createShop = async () => {
    if (!user) return;
    const { error } = await supabase.from("profile_shops").insert({
      user_id: user.id,
      shop_name: "Il mio Shop",
    });
    if (error) {
      toast.error("Errore creazione shop");
      return;
    }
    toast.success("Shop creato! 🎉");
    loadShopData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // No shop yet - show create option for own profile
  if (!shop && isOwnProfile) {
    return (
      <div className="text-center py-12 px-4">
        <Store className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
        <h3 className="text-sm font-bold mb-1">Crea il tuo Shop</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Vendi prodotti direttamente dal tuo profilo
        </p>
        <button
          type="button"
          onClick={createShop}
          className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
        >
          <Plus className="w-4 h-4 inline mr-1" />
          Crea Shop
        </button>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
        <p className="text-xs text-muted-foreground">Nessun shop disponibile</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 py-3">
      {/* Shop Header */}
      <div className="bg-card rounded-2xl border border-border/50 p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold">{shop.shop_name}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{products.length} prodotti</span>
              {shop.avg_rating > 0 && (
                <span className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  {shop.avg_rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
          {isOwnProfile && (
            <button
              type="button"
              onClick={() => navigate("/manage-products")}
              className="px-3 py-1.5 rounded-lg bg-muted text-xs font-medium"
            >
              Gestisci
            </button>
          )}
        </div>
        {shop.shop_description && (
          <p className="text-xs text-muted-foreground">{shop.shop_description}</p>
        )}
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Prodotti</h4>
            <button
              type="button"
              onClick={() => navigate("/shop")}
              className="text-xs text-primary font-medium flex items-center gap-0.5"
            >
              Vedi tutti <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {products.map(product => (
              <div
                key={product.id}
                className="bg-card rounded-xl border border-border/50 overflow-hidden cursor-pointer hover:border-primary/30 transition-all"
                onClick={() => navigate(`/shop`)}
              >
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-28 object-cover" />
                ) : (
                  <div className="w-full h-28 bg-muted flex items-center justify-center">
                    <Package className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
                <div className="p-2.5">
                  <p className="text-xs font-medium line-clamp-1">{product.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-bold text-primary">€{product.price.toFixed(2)}</span>
                    {product.rating && (
                      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        {product.rating}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-6">
          <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground">Nessun prodotto in vendita</p>
          {isOwnProfile && (
            <button
              type="button"
              onClick={() => navigate("/manage-products")}
              className="mt-2 px-4 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium"
            >
              Aggiungi prodotti
            </button>
          )}
        </div>
      )}
    </div>
  );
}
