import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, ShoppingBag, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Purchase {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  product_id: string;
}

export default function PurchaseHistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchPurchases();
  }, [user]);

  const fetchPurchases = async () => {
    const { data } = await (supabase as any)
      .from("product_purchases")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPurchases(data as unknown as Purchase[]);
    setLoading(false);
  };

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-display font-bold">I Miei Acquisti</h1>
      </header>

      <div className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nessun acquisto ancora</p>
            <button onClick={() => navigate("/shop")} className="mt-4 px-5 py-2 rounded-full gradient-primary text-primary-foreground text-sm font-semibold">
              Vai allo Shop
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {purchases.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-card shadow-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Ordine #{p.id.slice(0, 8)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString("it-IT")} · {p.payment_method}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">€{p.total_price}</p>
                  {p.discount_amount > 0 && (
                    <p className="text-[10px] text-primary">-€{p.discount_amount}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
