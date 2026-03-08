import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, MapPin, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CreateCastingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "model",
    casting_type: "casting",
    location: "",
    compensation: "",
    requirements: "",
    event_date: "",
  });

  const castingTypes = [
    { key: "casting", label: "🎬 Casting" },
    { key: "collaboration", label: "🤝 Collaborazione" },
    { key: "model_search", label: "📸 Ricerca Modelli" },
    { key: "brand_collab", label: "💼 Brand Collab" },
  ];

  const categories = [
    { key: "model", label: "Modello/a" },
    { key: "hair", label: "Parrucchiere" },
    { key: "makeup", label: "Makeup Artist" },
    { key: "photographer", label: "Fotografo" },
    { key: "creator", label: "Creator" },
    { key: "influencer", label: "Influencer" },
    { key: "barber", label: "Barbiere" },
    { key: "other", label: "Altro" },
  ];

  const handleSubmit = async () => {
    if (!user) { toast.error("Devi essere loggato"); return; }
    if (!form.title || !form.description) { toast.error("Compila titolo e descrizione"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from("casting_posts").insert({
        creator_id: user.id,
        title: form.title,
        description: form.description,
        category: form.category,
        casting_type: form.casting_type,
        location: form.location || null,
        compensation: form.compensation || null,
        requirements: form.requirements || null,
        event_date: form.event_date || null,
      } as any);
      if (error) throw error;
      toast.success("Annuncio pubblicato!");
      navigate("/marketplace");
    } catch (e: any) {
      toast.error("Errore: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold">Nuovo Casting</h1>
        </div>
        <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 rounded-full gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
          {loading ? "..." : "Pubblica"}
        </button>
      </header>

      <div className="px-4 py-6 space-y-5">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Tipo</label>
          <div className="flex flex-wrap gap-2">
            {castingTypes.map(t => (
              <button key={t.key} onClick={() => set("casting_type", t.key)} className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${form.casting_type === t.key ? "gradient-primary text-primary-foreground" : "bg-card border border-border"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Titolo *</label>
          <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="es. Cerco modella per shooting" className="w-full h-12 rounded-xl bg-card border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Categoria</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button key={c.key} onClick={() => set("category", c.key)} className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${form.category === c.key ? "gradient-primary text-primary-foreground" : "bg-card border border-border"}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Descrizione *</label>
          <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Descrivi il progetto, cosa cerchi..." rows={5} className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Requisiti</label>
          <textarea value={form.requirements} onChange={e => set("requirements", e.target.value)} placeholder="Età, esperienza, portfolio..." rows={3} className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2"><MapPin className="w-3 h-3 inline mr-1" />Località</label>
          <input value={form.location} onChange={e => set("location", e.target.value)} placeholder="es. Roma" className="w-full h-12 rounded-xl bg-card border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Compenso</label>
          <input value={form.compensation} onChange={e => set("compensation", e.target.value)} placeholder="es. 100€/giorno, TFP, da concordare" className="w-full h-12 rounded-xl bg-card border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2"><Calendar className="w-3 h-3 inline mr-1" />Data evento</label>
          <input type="date" value={form.event_date} onChange={e => set("event_date", e.target.value)} className="w-full h-12 rounded-xl bg-card border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
      </div>
    </MobileLayout>
  );
}
