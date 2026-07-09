import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, Sparkles, Loader2, Heart, Share2, CalendarDays, Coins, ChevronRight, Scissors, Droplets, Palette, PenTool, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import MobileLayout from "@/components/layout/MobileLayout";

const SECTORS = [
  { key: "hair", label: "Capelli", icon: Scissors, color: "from-purple-500 to-pink-500" },
  { key: "barber", label: "Barba", icon: Scissors, color: "from-amber-500 to-orange-500" },
  { key: "tattoo", label: "Tattoo", icon: PenTool, color: "from-slate-600 to-slate-800" },
  { key: "makeup", label: "Makeup", icon: Palette, color: "from-rose-400 to-pink-500" },
  { key: "nails", label: "Nail Art", icon: Star, color: "from-fuchsia-400 to-purple-500" },
  { key: "beauty", label: "Beauty", icon: Droplets, color: "from-teal-400 to-cyan-500" },
];

const STYLES: Record<string, string[]> = {
  hair: ["Balayage", "Bob Corto", "Onde Morbide", "Pixie Cut", "Colore Fantasia", "Extension Lunghe"],
  barber: ["Fade Classico", "Undercut", "Pompadour", "Buzz Cut", "Crew Cut", "Mullet Moderno"],
  tattoo: ["Minimal Fiori", "Geometrico", "Maori Tribale", "Watercolor", "Realistico", "Old School"],
  makeup: ["Smokey Eyes", "Natural Glow", "Glam Sera", "Bridal Look", "Editorial", "Dewy Skin"],
  nails: ["French Moderna", "Chrome Nails", "Nail Art Floreale", "Gel Minimal", "Stiletto Bold", "Baby Boomer"],
  beauty: ["Glow Up", "Anti-Age", "Labbra Filler", "Sopracciglia Perfect", "Skin Glass", "Contour"],
};

export default function AIPreviewPage() {
  const navigate = useNavigate();
  const { sector: paramSector } = useParams();
  const { user } = useAuth();
  const [selectedSector, setSelectedSector] = useState(paramSector || "hair");
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [aiDescription, setAiDescription] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [credits, setCredits] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (user) loadCredits();
  }, [user]);

  const loadCredits = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("ai_credits")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();
    setCredits(data?.balance || 0);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Carica un'immagine valida");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Immagine troppo grande (max 10MB)");
      return;
    }
    setOriginalImage(file);
    setOriginalPreviewUrl(URL.createObjectURL(file));
    setGeneratedImageUrl(null);
    setShowResult(false);
  };

  const generatePreview = async () => {
    if (!user) {
      toast.error("Effettua il login per usare AI Preview");
      navigate("/auth");
      return;
    }
    if (!selectedStyle && !customPrompt) {
      toast.error("Seleziona uno stile o descrivi il look");
      return;
    }
    if (credits < 1) {
      toast.error("Crediti AI esauriti!");
      return;
    }

    setIsProcessing(true);

    try {
      // Upload original image if provided
      let originalUrl = "https://placeholder.co/512x512";
      if (originalImage) {
        const fileName = `original-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("look-photos")
          .upload(`originals/${fileName}`, originalImage, { upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("look-photos")
            .getPublicUrl(`originals/${fileName}`);
          originalUrl = urlData.publicUrl;
        }
      }

      // Create session
      const { data: session, error: sessionError } = await supabase
        .from("preview_sessions")
        .insert({
          user_id: user.id,
          sector: selectedSector,
          style_name: selectedStyle || customPrompt,
          original_image_url: originalUrl,
          status: "uploading",
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Call edge function
      const { data: result, error: fnError } = await supabase.functions.invoke(
        "generate-ai-preview",
        {
          body: {
            session_id: session.id,
            sector: selectedSector,
            style_name: selectedStyle || customPrompt,
            prompt: customPrompt || undefined,
          },
        }
      );

      if (fnError) throw fnError;

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      if (result?.generated_image_url) {
        setGeneratedImageUrl(result.generated_image_url);
      }
      if (result?.ai_description) {
        setAiDescription(result.ai_description);
      }
      setCredits(result?.credits_remaining ?? credits - 1);
      setShowResult(true);
      toast.success("Preview AI generata! ✨");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Errore generazione";
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const currentStyles = STYLES[selectedSector] || STYLES.hair;

  return (
    <MobileLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/30 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted" type="button" aria-label="Torna indietro">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-display font-bold">AI Preview</h1>
                <p className="text-xs text-muted-foreground">Prova il tuo nuovo look</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full">
              <Coins className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-primary">{credits}</span>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-5">
          {/* Sector Selection */}
          <div>
            <h2 className="text-sm font-semibold mb-3">Scegli settore</h2>
            <div className="grid grid-cols-3 gap-2">
              {SECTORS.map(s => {
                const Icon = s.icon;
                const isActive = selectedSector === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => { setSelectedSector(s.key); setSelectedStyle(null); }}
                    className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-1.5 ${
                      isActive
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border/50 bg-card hover:border-primary/30"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Style Selection */}
          <div>
            <h2 className="text-sm font-semibold mb-3">Scegli stile</h2>
            <div className="flex flex-wrap gap-2">
              {currentStyles.map(style => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setSelectedStyle(selectedStyle === style ? null : style)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    selectedStyle === style
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card border border-border/50 text-foreground hover:border-primary/30"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Prompt */}
          <div>
            <h2 className="text-sm font-semibold mb-2">Oppure descrivi il look</h2>
            <textarea
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              placeholder="Es: Capelli corti con ciuffo laterale e sfumatura biondo miele..."
              rows={2}
              className="w-full rounded-xl bg-card border border-border/50 p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          {/* Upload Photo */}
          <div>
            <h2 className="text-sm font-semibold mb-2">La tua foto (opzionale)</h2>
            {!originalPreviewUrl ? (
              <label className="flex flex-col items-center justify-center h-36 rounded-2xl border-2 border-dashed border-border/50 bg-card cursor-pointer hover:border-primary/30 transition-all">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-xs text-muted-foreground">Carica una foto</span>
                <span className="text-xs text-muted-foreground/60">JPG, PNG max 10MB</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            ) : (
              <div className="relative">
                <img src={originalPreviewUrl} alt="Foto originale" className="w-full h-48 object-cover rounded-2xl" />
                <button
                  type="button"
                  onClick={() => { setOriginalImage(null); setOriginalPreviewUrl(null); }}
                  className="absolute top-2 right-2 px-3 py-1 rounded-full bg-background/80 text-xs font-medium"
                >
                  Cambia
                </button>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={generatePreview}
            disabled={isProcessing || (!selectedStyle && !customPrompt)}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-purple-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 shadow-lg shadow-primary/20"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generazione in corso...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Genera Preview AI (1 credito)
              </>
            )}
          </button>

          {/* Result */}
          {showResult && (
            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
              <div className="p-4">
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Risultato AI Preview
                </h3>
                
                {generatedImageUrl ? (
                  <img src={generatedImageUrl} alt="AI Preview" className="w-full rounded-xl mb-3" />
                ) : (
                  <div className="w-full h-48 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center mb-3">
                    <Sparkles className="w-12 h-12 text-primary/40" />
                  </div>
                )}

                {aiDescription && (
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{aiDescription}</p>
                )}

                <div className="flex gap-2">
                  <button type="button" className="flex-1 h-10 rounded-xl bg-muted flex items-center justify-center gap-1.5 text-xs font-medium">
                    <Heart className="w-4 h-4" /> Salva
                  </button>
                  <button type="button" className="flex-1 h-10 rounded-xl bg-muted flex items-center justify-center gap-1.5 text-xs font-medium">
                    <Share2 className="w-4 h-4" /> Condividi
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/stylists")}
                    className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center gap-1.5 text-xs font-bold"
                  >
                    <CalendarDays className="w-4 h-4" /> Prenota
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Recent Previews */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Le tue Preview</h2>
              <button type="button" className="text-xs text-primary font-medium flex items-center gap-0.5">
                Vedi tutte <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Le tue preview appariranno qui</p>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
