import { useState, useEffect } from "react";
import { ShoppingBag, Calendar, Star, ChevronRight, Coins, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface LiveShopPanelProps {
  professionalId?: string;
  onClose: () => void;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  rating: number | null;
}

export default function LiveShopPanel({ professionalId, onClose }: LiveShopPanelProps) {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professionalId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let svcData: any[] = [];
      let prodData: any[] = [];

      if (professionalId) {
        const { data: svc } = await supabase.from("services").select("id, name, price, duration").eq("professional_id", professionalId).limit(5);
        svcData = svc || [];

        const { data: pro } = await supabase.from("professionals").select("user_id").eq("id", professionalId).maybeSingle();
        if (pro) {
          const { data: prods } = await supabase.from("products").select("id, name, price, image_url, rating").eq("seller_id", pro.user_id).eq("active", true).limit(5);
          prodData = prods || [];
        }
      }

      if (prodData.length === 0) {
        const { data: prods } = await supabase.from("products").select("id, name, price, image_url, rating").eq("active", true).order("rating", { ascending: false }).limit(5);
        prodData = prods || [];
      }

      setServices(svcData);
      setProducts(prodData);
    } catch (e) {
      console.error("Error fetching shop data:", e);
    }
    setLoading(false);
  };

  return (
    <div className="absolute inset-0 z-40 flex items-end">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full glass rounded-t-3xl p-5 pb-28 max-h-[75vh] overflow-y-auto slide-up">
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-5" />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : (
          <>
            {/* Services */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="font-display font-bold">Prenota Servizio</h3>
              </div>
              {services.length > 0 ? (
                <div className="space-y-2">
                  {services.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { onClose(); navigate(`/booking/${professionalId || s.id}`); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all text-left"
                    >
                      <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                        {s.duration}'
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{s.name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">€{s.price}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => { onClose(); navigate(professionalId ? `/booking/${professionalId}` : "/stylists"); }}
                  className="w-full py-3 rounded-xl bg-card border border-border/50 text-sm text-muted-foreground text-center"
                >
                  Prenota un appuntamento →
                </button>
              )}
            </div>

            {/* Products */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShoppingBag className="w-4 h-4 text-accent" />
                <h3 className="font-display font-bold">Prodotti</h3>
              </div>
              {products.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                  {products.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { onClose(); navigate("/shop"); }}
                      className="min-w-[130px] p-3 rounded-xl bg-card border border-border/50 hover:border-accent/30 transition-all text-left"
                    >
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-16 rounded-lg object-cover mb-2" />
                      ) : (
                        <div className="w-full h-16 rounded-lg bg-muted flex items-center justify-center mb-2">
                          <ShoppingBag className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <p className="text-xs font-semibold truncate">{p.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-sm font-bold">€{p.price}</span>
                        {p.rating && <Star className="w-3 h-3 text-accent fill-accent ml-1" />}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Coins className="w-3 h-3 text-accent" />
                        <span className="text-[10px] text-muted-foreground">+{Math.round(p.price * 0.5)} QRC</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => { onClose(); navigate("/shop"); }}
                  className="w-full py-3 rounded-xl bg-card border border-border/50 text-sm text-muted-foreground text-center"
                >
                  Esplora lo shop →
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
