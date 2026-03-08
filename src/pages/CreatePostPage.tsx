import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, X, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function CreatePostPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [postType, setPostType] = useState<"image" | "before_after">("image");
  const [sliderPos, setSliderPos] = useState(50);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "main" | "before" | "after") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (type === "main") { setImageFile(file); setImagePreview(result); }
      else if (type === "before") { setBeforeFile(file); setBeforePreview(result); }
      else { setAfterFile(file); setAfterPreview(result); }
    };
    reader.readAsDataURL(file);
  };

  const uploadFile = async (file: File, folder: string) => {
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/${folder}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("posts").upload(path, file);
    if (error) throw error;
    return supabase.storage.from("posts").getPublicUrl(path).data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!user) { toast.error("Devi effettuare l'accesso"); navigate("/auth"); return; }

    if (postType === "image" && !caption.trim() && !imageFile) {
      toast.error("Aggiungi un testo o un'immagine"); return;
    }
    if (postType === "before_after" && (!beforeFile || !afterFile)) {
      toast.error("Carica entrambe le foto Prima e Dopo"); return;
    }

    setLoading(true);
    try {
      let imageUrl = null, beforeUrl = null, afterUrl = null;

      if (postType === "image" && imageFile) {
        imageUrl = await uploadFile(imageFile, "post");
      }
      if (postType === "before_after") {
        [beforeUrl, afterUrl] = await Promise.all([
          uploadFile(beforeFile!, "before"),
          uploadFile(afterFile!, "after"),
        ]);
      }

      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        caption,
        image_url: imageUrl,
        before_image_url: beforeUrl,
        after_image_url: afterUrl,
        post_type: postType,
      });

      if (error) throw error;
      toast.success("Post pubblicato!");
      navigate("/");
    } catch {
      toast.error("Errore nella pubblicazione");
    }
    setLoading(false);
  };

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold">Nuovo Post</h1>
        </div>
        <button onClick={handleSubmit} disabled={loading}
          className="px-4 py-2 rounded-full gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
          {loading ? "..." : "Pubblica"}
        </button>
      </header>

      <div className="p-4 space-y-4">
        {/* Post Type */}
        <div className="flex gap-2">
          <button onClick={() => setPostType("image")}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold ${postType === "image" ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            Foto/Video
          </button>
          <button onClick={() => setPostType("before_after")}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold ${postType === "before_after" ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            Prima & Dopo
          </button>
        </div>

        {/* Caption */}
        <textarea value={caption} onChange={e => setCaption(e.target.value)}
          placeholder="Scrivi una didascalia..." rows={3}
          className="w-full rounded-xl bg-card border border-border p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50" />

        {/* === IMAGE UPLOAD === */}
        {postType === "image" && (
          <>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={imagePreview} alt="Preview" className="w-full aspect-square object-cover" />
                <button onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-all">
                <Upload className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Carica foto o video</span>
                <span className="text-xs text-muted-foreground">JPG, PNG, MP4 · Max 10MB</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={e => handleFileSelect(e, "main")} className="hidden" />
          </>
        )}

        {/* === BEFORE/AFTER UPLOAD === */}
        {postType === "before_after" && (
          <div className="space-y-4">
            {/* Preview with slider */}
            {beforePreview && afterPreview ? (
              <div className="relative aspect-square rounded-xl overflow-hidden">
                <img src={afterPreview} alt="Dopo" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
                  <img src={beforePreview} alt="Prima" className="w-full h-full object-cover"
                    style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: "none" }} />
                </div>
                <div className="absolute top-0 bottom-0 w-0.5 bg-primary-foreground z-10" style={{ left: `${sliderPos}%` }}>
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-glow">
                    <ChevronLeft className="w-3 h-3 text-primary-foreground" />
                    <ChevronRight className="w-3 h-3 text-primary-foreground" />
                  </div>
                </div>
                <div className="absolute top-3 left-3 px-2 py-1 rounded-full glass text-[10px] font-bold">Prima</div>
                <div className="absolute top-3 right-3 px-2 py-1 rounded-full glass text-[10px] font-bold">Dopo</div>
                <input type="range" min={10} max={90} value={sliderPos}
                  onChange={e => setSliderPos(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20" />
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              {/* Before */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 text-center">📷 PRIMA</p>
                {beforePreview ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <img src={beforePreview} alt="Before" className="w-full aspect-square object-cover" />
                    <button onClick={() => { setBeforeFile(null); setBeforePreview(null); }}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => beforeInputRef.current?.click()}
                    className="w-full aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-all">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Carica foto</span>
                  </button>
                )}
              </div>

              {/* After */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 text-center">✨ DOPO</p>
                {afterPreview ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <img src={afterPreview} alt="After" className="w-full aspect-square object-cover" />
                    <button onClick={() => { setAfterFile(null); setAfterPreview(null); }}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => afterInputRef.current?.click()}
                    className="w-full aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-all">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Carica foto</span>
                  </button>
                )}
              </div>
            </div>

            <input ref={beforeInputRef} type="file" accept="image/*" onChange={e => handleFileSelect(e, "before")} className="hidden" />
            <input ref={afterInputRef} type="file" accept="image/*" onChange={e => handleFileSelect(e, "after")} className="hidden" />
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
