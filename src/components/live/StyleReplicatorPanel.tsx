import { useState } from "react";
import { Sparkles, MapPin, Calendar, Star, ChevronRight, X, Wand2, Loader2, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StyleReplicatorPanelProps {
  streamTitle: string;
  streamCategory?: string;
  professionalName?: string;
  onClose: () => void;
}

interface StyleCard {
  name: string;
  category: string;
  technique: string;
  products: string[];
  duration: string;
  difficulty: string;
}

interface NearbyPro {
  id: string;
  business_name: string;
  specialty: string | null;
  city: string | null;
  rating: number | null;
  review_count: number | null;
  hourly_rate: number | null;
}

export default function StyleReplicatorPanel({ streamTitle, streamCategory, professionalName, onClose }: StyleReplicatorPanelProps) {
  const navigate = useNavigate();
  const [styleCard, setStyleCard] = useState<StyleCard | null>(null);
  const [nearbyPros, setNearbyPros] = useState<NearbyPro[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingPros, setLoadingPros] = useState(false);

  const analyzeStyle = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-beauty-assistant", {
        body: {
          messages: [
            {
              role: "user",
              content: `Analizza questo stile beauty dalla live "${streamTitle}" (categoria: ${streamCategory || "general"}, professionista: ${professionalName || "unknown"}). 
              Restituisci SOLO un JSON con: name (nome creativo dello stile in italiano), category, technique (tecnica utilizzata), products (array di 3-4 prodotti consigliati), duration (tempo stimato es "45 min"), difficulty (facile/medio/avanzato). Nessun testo extra, solo JSON.`
            }
          ]
        },
      });

      if (error) throw error;

      const content = data?.content || data?.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setStyleCard(parsed);
        fetchNearbyPros(parsed.category);
      } else {
        // Fallback style card
        setStyleCard({
          name: `${streamTitle} Look`,
          category: streamCategory || "hairstyle",
          technique: "Tecnica professionale vista in live",
          products: ["Shampoo nutriente", "Maschera protettiva", "Spray fissante"],
          duration: "45 min",
          difficulty: "medio",
        });
        fetchNearbyPros(streamCategory || "hairstyle");
      }
    } catch {
      // Fallback
      setStyleCard({
        name: `${streamTitle} Look`,
        category: streamCategory || "hairstyle",
        technique: "Tecnica professionale vista in live",
        products: ["Shampoo nutriente", "Maschera protettiva", "Spray fissante"],
        duration: "45 min",
        difficulty: "medio",
      });
      fetchNearbyPros(streamCategory || "hairstyle");
    } finally {
      setAnalyzing(false);
    }
  };

  const fetchNearbyPros = async (category: string) => {
    setLoadingPros(true);
    const { data } = await supabase
      .from("professionals")
      .select("id, business_name, specialty, city, rating, review_count, hourly_rate")
      .order("rating", { ascending: false })
      .limit(5);

    if (data) setNearbyPros(data);
    setLoadingPros(false);
  };

  return (
    <div className="absolute inset-0 z-40 flex items-end">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full glass rounded-t-3xl p-5 pb-28 max-h-[80vh] overflow-y-auto slide-up">
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-5" />

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">Style Replicator</h3>
              <p className="text-xs text-muted-foreground">AI analizza e replica questo look</p>
            </div>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        {!styleCard && !analyzing && (
          <button
            onClick={analyzeStyle}
            className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 shadow-glow"
          >
            <Sparkles className="w-5 h-5" />
            Analizza questo stile con AI
          </button>
        )}

        {analyzing && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">L'AI sta analizzando lo stile...</p>
          </div>
        )}

        {styleCard && (
          <>
            {/* Style Card */}
            <div className="rounded-2xl bg-card border border-border p-4 mb-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-bold text-base">{styleCard.name}</h4>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold capitalize">{styleCard.category}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Durata</p>
                  <p className="text-sm font-bold">{styleCard.duration}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Tecnica</p>
                  <p className="text-xs">{styleCard.technique}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Prodotti Consigliati</p>
                  <div className="flex flex-wrap gap-1.5">
                    {styleCard.products.map((p, i) => (
                      <span key={i} className="px-2 py-1 rounded-full bg-muted text-xs font-medium">{p}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Difficoltà:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    styleCard.difficulty === "facile" ? "bg-green-500/10 text-green-600" :
                    styleCard.difficulty === "avanzato" ? "bg-red-500/10 text-red-600" :
                    "bg-accent/10 text-accent"
                  }`}>{styleCard.difficulty}</span>
                </div>
              </div>
            </div>

            {/* Nearby Professionals */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-primary" />
                <h4 className="font-display font-bold text-sm">Prova questo stile vicino a te</h4>
              </div>

              {loadingPros ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : nearbyPros.length > 0 ? (
                <div className="space-y-2">
                  {nearbyPros.map(pro => (
                    <button
                      key={pro.id}
                      onClick={() => { onClose(); navigate(`/booking/${pro.id}`); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all text-left"
                    >
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${pro.id}`}
                        alt=""
                        className="w-11 h-11 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{pro.business_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Star className="w-3 h-3 text-accent fill-accent" />
                          <span className="text-xs font-medium">{pro.rating || "4.5"}</span>
                          <span className="text-xs text-muted-foreground">({pro.review_count || 0})</span>
                          {pro.city && <span className="text-xs text-muted-foreground flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{pro.city}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">€{pro.hourly_rate || 40}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Coins className="w-3 h-3 text-accent" />
                          <span className="text-xs text-accent font-medium">+{Math.round((pro.hourly_rate || 40) * 0.5)} QRC</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nessun professionista trovato nella tua zona</p>
              )}
            </div>

            <button
              onClick={() => { onClose(); navigate("/stylists"); }}
              className="w-full py-3 rounded-xl bg-muted text-sm font-semibold text-center"
            >
              Vedi tutti i professionisti →
            </button>
          </>
        )}
      </div>
    </div>
  );
}