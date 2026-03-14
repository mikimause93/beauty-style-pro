import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Plus, Package, Edit3, Trash2, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useVerificationGuard } from "@/hooks/useVerificationGuard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import beauty1 from "@/assets/beauty-1.jpg";
import beauty2 from "@/assets/beauty-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";

const fallbackImages = [beauty1, beauty2, beauty3];

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string | null;
  description: string | null;
  active: boolean | null;
  stock: number | null;
}

export default function ManageProductsPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { guardAction } = useVerificationGuard();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", description: "", category: "Hair Care" });

  const isSeller = profile?.user_type === 'professional' || profile?.user_type === 'business';

  useEffect(() => {
    if (!user || !isSeller) { navigate("/profile"); return; }
    fetchProducts();
  }, [user, isSeller]);

  const fetchProducts = async () => {
    if (!user) return;
    const { data } = await supabase.from("products").select("*").eq("seller_id", user.id).order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!user || !newProduct.name.trim() || !newProduct.price) { toast.error("Compila nome e prezzo"); return; }
    const price = parseFloat(newProduct.price);
    if (isNaN(price) || price <= 0) { toast.error("Prezzo non valido"); return; }
    const { error } = await supabase.from("products").insert({
      seller_id: user.id,
      name: newProduct.name.trim().slice(0, 100),
      price,
      description: newProduct.description.trim().slice(0, 500) || null,
      category: newProduct.category,
    });
    if (error) { toast.error("Errore nell'aggiunta"); return; }
    toast.success("Prodotto pubblicato! 🎉");
    setNewProduct({ name: "", price: "", description: "", category: "Hair Care" });
    setShowAdd(false);
    fetchProducts();
  };

  const toggleActive = async (product: Product) => {
    const { error } = await supabase.from("products").update({ active: !product.active }).eq("id", product.id);
    if (!error) {
      toast.success(product.active ? "Prodotto nascosto" : "Prodotto visibile");
      fetchProducts();
    }
  };

  const getImage = (product: Product, i: number) => product.image_url || fallbackImages[i % fallbackImages.length];

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-display font-bold flex-1">Gestione Prodotti</h1>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" /> Nuovo
        </button>
      </header>

      <div className="p-4">
        {/* Add form */}
        {showAdd && (
          <div className="p-4 rounded-2xl bg-card border border-border/50 space-y-3 mb-4 fade-in">
            <h3 className="font-semibold text-sm">Nuovo Prodotto</h3>
            <input value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
              placeholder="Nome prodotto *" maxLength={100}
              className="w-full h-10 rounded-xl bg-background border border-border px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
            <input value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))}
              placeholder="Prezzo (€) *" type="number" step="0.01" min="0"
              className="w-full h-10 rounded-xl bg-background border border-border px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
            <textarea value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))}
              placeholder="Descrizione..." rows={2} maxLength={500}
              className="w-full rounded-xl bg-background border border-border px-4 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/30" />
            <select value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))}
              className="w-full h-10 rounded-xl bg-background border border-border px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30">
              {["Hair Care", "Skincare", "Makeup", "Nails", "Tools", "Altro"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold">Annulla</button>
              <button onClick={handleAdd} className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">Pubblica</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-card animate-pulse" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Nessun prodotto nella tua vetrina</p>
            <button onClick={() => setShowAdd(true)}
              className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              Aggiungi il primo prodotto
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{products.length} prodotti nel tuo catalogo</p>
            {products.map((product, idx) => (
              <div key={product.id} className={`flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 ${!product.active ? "opacity-60" : ""}`}>
                <img src={getImage(product, idx)} alt={product.name} className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.category}</p>
                  <p className="text-sm font-bold text-primary mt-0.5">€{product.price}</p>
                  {product.stock !== null && <p className="text-[10px] text-muted-foreground">Stock: {product.stock}</p>}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button onClick={() => toggleActive(product)}
                    className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80">
                    {product.active ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
