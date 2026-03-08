import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, MapPin, Euro, Calendar, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CreateServiceRequestPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "hair",
    location: "",
    budget_min: "",
    budget_max: "",
    preferred_date: "",
    preferred_time: "",
    urgency: "normal",
  });

  const categories = [
    { key: "hair", label: "Parrucchiere" },
    { key: "beauty", label: "Estetista" },
    { key: "nails", label: "Nail Artist" },
    { key: "massage", label: "Massaggiatore" },
    { key: "barbershop", label: "Barbiere" },
    { key: "makeup", label: "Makeup" },
    { key: "tattoo", label: "Tattoo" },
    { key: "model", label: "Modello/a" },
    { key: "photographer", label: "Fotografo" },
    { key: "other", label: "Altro" },
  ];

  const handleSubmit = async () => {
    if (!user) { toast.error("Devi essere loggato"); return; }
    if (!form.title || !form.description) { toast.error("Compila titolo e descrizione"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from("service_requests").insert({
        user_id: user.id,
        title: form.title,
        description: form.description,
        category: form.category,
        location: form.location || null,
        budget_min: form.budget_min ? parseFloat(form.budget_min) : null,
        budget_max: form.budget_max ? parseFloat(form.budget_max) : null,
        preferred_date: form.preferred_date || null,
        preferred_time: form.preferred_time || null,
        urgency: form.urgency,
      } as any);
      if (error) throw error;
      toast.success("Richiesta pubblicata!");
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
          <h1 className="text-lg font-display font-bold">Nuova Richiesta</h1>
        </div>
        <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 rounded-full gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
          {loading ? "..." : "Pubblica"}
        </button>
      </header>

      <div className="px-4 py-6 space-y-5">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Titolo *</label>
          <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="es. Cerco parrucchiere per domani" className="w-full h-12 rounded-xl bg-card border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
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
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Urgenza</label>
          <div className="flex gap-2">
            {[{ key: "urgent", label: "🔴 Urgente" }, { key: "normal", label: "🟡 Normale" }, { key: "flexible", label: "🟢 Flessibile" }].map(u => (
              <button key={u.key} onClick={() => set("urgency", u.key)} className={`flex-1 py-2 rounded-xl text-xs font-semibold ${form.urgency === u.key ? "gradient-primary text-primary-foreground" : "bg-card border border-border"}`}>
                {u.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Descrizione *</label>
          <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Descrivi cosa cerchi..." rows={4} className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2"><MapPin className="w-3 h-3 inline mr-1" />Località</label>
          <input value={form.location} onChange={e => set("location", e.target.value)} placeholder="es. Milano" className="w-full h-12 rounded-xl bg-card border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2"><Euro className="w-3 h-3 inline mr-1" />Budget (€)</label>
          <div className="flex gap-3">
            <input value={form.budget_min} onChange={e => set("budget_min", e.target.value)} placeholder="Min" type="number" className="flex-1 h-12 rounded-xl bg-card border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <input value={form.budget_max} onChange={e => set("budget_max", e.target.value)} placeholder="Max" type="number" className="flex-1 h-12 rounded-xl bg-card border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2"><Calendar className="w-3 h-3 inline mr-1" />Data</label>
            <input type="date" value={form.preferred_date} onChange={e => set("preferred_date", e.target.value)} className="w-full h-12 rounded-xl bg-card border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="flex-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2"><Clock className="w-3 h-3 inline mr-1" />Orario</label>
            <input type="time" value={form.preferred_time} onChange={e => set("preferred_time", e.target.value)} className="w-full h-12 rounded-xl bg-card border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
