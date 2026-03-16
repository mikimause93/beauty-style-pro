import { useState, useRef } from "react";
import { Image, Video, FileText, Tag, Megaphone, Upload, X, Plus, Loader2, Eye, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ShowcaseItem {
  id: string;
  type: "image" | "video" | "catalog" | "promo";
  url: string;
  title?: string;
  price?: string;
  description?: string;
}

interface ProfileShowcasePanelProps {
  isOwnProfile: boolean;
  userId: string;
}

const TABS = [
  { key: "image", label: "Foto", Icon: Image },
  { key: "video", label: "Video", Icon: Video },
  { key: "catalog", label: "Catalogo", Icon: FileText },
  { key: "promo", label: "Promo", Icon: Megaphone },
] as const;

export default function ProfileShowcasePanel({ isOwnProfile, userId }: ProfileShowcasePanelProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"image" | "video" | "catalog" | "promo">("image");
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [loadingItems, setLoadingItems] = useState(true);

  // Load showcase items from storage
  useState(() => {
    loadShowcase();
  });

  async function loadShowcase() {
    setLoadingItems(true);
    try {
      const { data } = await supabase.storage.from("posts").list(`showcase/${userId}`, { limit: 100 });
      if (data) {
        const loaded: ShowcaseItem[] = data
          .filter(f => !f.name.startsWith("."))
          .map(f => {
            const { data: urlData } = supabase.storage.from("posts").getPublicUrl(`showcase/${userId}/${f.name}`);
            const parts = f.name.split("__");
            const type = parts[0] || "image";
            return {
              id: f.name,
              type: (["image", "video", "catalog", "promo"].includes(type) ? type : "image") as "image" | "video" | "catalog" | "promo",
              url: urlData.publicUrl,
              title: parts[1]?.replace(/\.[^.]+$/, "").replace(/-/g, " ") || f.name,
            };
          });
        setItems(loaded);
      }
    } catch (err) {
      console.error("Showcase load error:", err);
    }
    setLoadingItems(false);
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const safeName = (newTitle || file.name.replace(/\.[^.]+$/, "")).replace(/\s+/g, "-").substring(0, 40);
      const fileName = `showcase/${user.id}/${activeTab}__${safeName}__${Date.now()}.${ext}`;

      const { error } = await supabase.storage.from("posts").upload(fileName, file, { upsert: false });
      if (error) throw error;

      toast.success("Caricato con successo!");
      setShowAddForm(false);
      setNewTitle("");
      setNewPrice("");
      setNewDescription("");
      await loadShowcase();
    } catch (err: unknown) {
      toast.error("Errore nel caricamento");
      console.error(err);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDelete = async (item: ShowcaseItem) => {
    if (!user) return;
    try {
      await supabase.storage.from("posts").remove([`showcase/${user.id}/${item.id}`]);
      setItems(prev => prev.filter(i => i.id !== item.id));
      toast.success("Rimosso");
    } catch {
      toast.error("Errore nella rimozione");
    }
  };

  const filtered = items.filter(i => i.type === activeTab);

  const acceptMap = {
    image: "image/*",
    video: "video/*",
    catalog: "image/*,.pdf",
    promo: "image/*,video/*",
  };

  return (
    <div className="pt-2 fade-in">
      {/* Sub-tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto no-scrollbar">
        {TABS.map(tab => {
          const Icon = tab.Icon;
          const count = items.filter(i => i.type === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border/50 text-muted-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {count > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? "bg-primary-foreground/20" : "bg-muted"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Upload button for own profile */}
      {isOwnProfile && (
        <div className="mb-4">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-3 rounded-xl border-2 border-dashed border-primary/30 flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Aggiungi {TABS.find(t => t.key === activeTab)?.label}
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Nuovo {TABS.find(t => t.key === activeTab)?.label}</p>
                <button onClick={() => setShowAddForm(false)}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Titolo (opzionale)"
                className="w-full h-10 rounded-lg bg-muted/50 border border-border/50 px-3 text-sm"
              />

              {(activeTab === "catalog" || activeTab === "promo") && (
                <>
                  <input
                    value={newPrice}
                    onChange={e => setNewPrice(e.target.value)}
                    placeholder="Prezzo (es. €25.00)"
                    className="w-full h-10 rounded-lg bg-muted/50 border border-border/50 px-3 text-sm"
                  />
                  <textarea
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    placeholder="Descrizione..."
                    className="w-full h-20 rounded-lg bg-muted/50 border border-border/50 px-3 py-2 text-sm resize-none"
                  />
                </>
              )}

              <input
                ref={fileRef}
                type="file"
                accept={acceptMap[activeTab]}
                onChange={handleUpload}
                className="hidden"
              />

              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {uploading ? "Caricamento..." : "Carica File"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Items Grid */}
      {loadingItems ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length > 0 ? (
        <div className={`grid ${activeTab === "video" ? "grid-cols-2" : "grid-cols-3"} gap-1`}>
          {filtered.map(item => (
            <div key={item.id} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
              {item.type === "video" ? (
                <video src={item.url} className="w-full h-full object-cover" muted />
              ) : (
                <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-background/0 group-hover:bg-background/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-card/80 flex items-center justify-center">
                  <Eye className="w-3.5 h-3.5" />
                </a>
                {isOwnProfile && (
                  <button onClick={() => handleDelete(item)} className="w-8 h-8 rounded-full bg-destructive/80 flex items-center justify-center">
                    <Trash2 className="w-3.5 h-3.5 text-destructive-foreground" />
                  </button>
                )}
              </div>

              {/* Title overlay */}
              {item.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent px-2 py-1.5">
                  <p className="text-[9px] font-medium text-foreground truncate">{item.title}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          {activeTab === "image" && <Image className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />}
          {activeTab === "video" && <Video className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />}
          {activeTab === "catalog" && <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />}
          {activeTab === "promo" && <Megaphone className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />}
          <p className="text-xs text-muted-foreground">
            {isOwnProfile
              ? `Nessun contenuto. Aggiungi ${TABS.find(t => t.key === activeTab)?.label.toLowerCase()}`
              : "Nessun contenuto in questa sezione"}
          </p>
        </div>
      )}
    </div>
  );
}
