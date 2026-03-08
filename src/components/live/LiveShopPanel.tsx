import { ShoppingBag, Calendar, Star, ChevronRight, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LiveShopPanelProps {
  professionalId?: string;
  onClose: () => void;
}

const mockServices = [
  { id: "1", name: "Taglio + Piega", price: 35, duration: 45, rating: 4.9 },
  { id: "2", name: "Colore Balayage", price: 85, duration: 120, rating: 4.8 },
  { id: "3", name: "Trattamento Keratina", price: 65, duration: 90, rating: 4.7 },
];

const mockProducts = [
  { id: "1", name: "Olaplex N°3", price: 28, discount: 10, image: "" },
  { id: "2", name: "Shampoo Bio", price: 18, discount: 0, image: "" },
  { id: "3", name: "Maschera Capelli", price: 22, discount: 5, image: "" },
];

export default function LiveShopPanel({ professionalId, onClose }: LiveShopPanelProps) {
  const navigate = useNavigate();

  return (
    <div className="absolute inset-0 z-40 flex items-end">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full glass rounded-t-3xl p-5 pb-28 max-h-[75vh] overflow-y-auto slide-up">
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-5" />

        {/* Prenota */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="font-display font-bold">Prenota Servizio</h3>
          </div>
          <div className="space-y-2">
            {mockServices.map(s => (
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
                  <div className="flex items-center gap-2 mt-0.5">
                    <Star className="w-3 h-3 text-accent fill-accent" />
                    <span className="text-[10px] text-muted-foreground">{s.rating}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold">€{s.price}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Prodotti */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag className="w-4 h-4 text-accent" />
            <h3 className="font-display font-bold">Prodotti Consigliati</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {mockProducts.map(p => (
              <button
                key={p.id}
                onClick={() => { onClose(); navigate("/shop"); }}
                className="min-w-[130px] p-3 rounded-xl bg-card border border-border/50 hover:border-accent/30 transition-all text-left"
              >
                <span className="text-3xl block mb-2">{p.image}</span>
                <p className="text-xs font-semibold truncate">{p.name}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-sm font-bold">€{p.price}</span>
                  {p.discount > 0 && (
                    <span className="text-[10px] text-accent font-semibold">-{p.discount}%</span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Coins className="w-3 h-3 text-accent" />
                  <span className="text-[10px] text-muted-foreground">+{Math.round(p.price * 0.5)} QRC</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
