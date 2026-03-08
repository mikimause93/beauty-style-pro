import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Camera, Image, X, Upload } from "lucide-react";
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
  const [loading, setLoading] = useState(false);
  const [postType, setPostType] = useState<"image" | "before_after">("image");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Devi effettuare l'accesso");
      navigate("/auth");
      return;
    }

    if (!caption.trim() && !imageFile) {
      toast.error("Aggiungi un testo o un'immagine");
      return;
    }

    setLoading(true);
    let imageUrl = null;

    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from("posts")
        .upload(fileName, imageFile);

      if (uploadError) {
        toast.error("Errore upload immagine");
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from("posts").getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      caption,
      image_url: imageUrl,
      post_type: postType,
    });

    if (error) {
      toast.error("Errore nella pubblicazione");
    } else {
      toast.success("Post pubblicato! ✨");
      navigate("/");
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
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 rounded-full gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
        >
          {loading ? "..." : "Pubblica"}
        </button>
      </header>

      <div className="p-4 space-y-4">
        {/* Post Type */}
        <div className="flex gap-2">
          <button
            onClick={() => setPostType("image")}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold ${
              postType === "image" ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            📸 Foto/Video
          </button>
          <button
            onClick={() => setPostType("before_after")}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold ${
              postType === "before_after" ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            🔄 Before & After
          </button>
        </div>

        {/* Caption */}
        <textarea
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="Scrivi una didascalia..."
          rows={4}
          className="w-full rounded-xl bg-card border border-border p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
        />

        {/* Image Upload */}
        {imagePreview ? (
          <div className="relative rounded-xl overflow-hidden">
            <img src={imagePreview} alt="Preview" className="w-full aspect-square object-cover" />
            <button
              onClick={() => { setImageFile(null); setImagePreview(null); }}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-video rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-all"
          >
            <Upload className="w-8 h-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Carica foto o video</span>
            <span className="text-xs text-muted-foreground">JPG, PNG, MP4 · Max 10MB</span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </MobileLayout>
  );
}
