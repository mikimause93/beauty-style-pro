import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, MapPin, Euro, Calendar, Briefcase, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CreateJobPostPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "hair",
    employment_type: "full_time",
    location: "",
    salary_min: "",
    salary_max: "",
    required_skills: [] as string[],
    benefits: [] as string[],
    expiration_days: 30,
  });

  const [newSkill, setNewSkill] = useState("");
  const [newBenefit, setNewBenefit] = useState("");

  const categories = [
    { key: "hair", label: "Hair Stylist", emoji: "💇‍♀️" },
    { key: "beauty", label: "Estetista", emoji: "💄" },
    { key: "nails", label: "Nail Artist", emoji: "💅" },
    { key: "massage", label: "Massaggiatore", emoji: "💆" },
    { key: "barbershop", label: "Barbiere", emoji: "💈" },
    { key: "spa", label: "SPA", emoji: "🧖‍♀️" },
    { key: "makeup", label: "Makeup Artist", emoji: "🎨" },
  ];

  const employmentTypes = [
    { key: "full_time", label: "Full-time" },
    { key: "part_time", label: "Part-time" },
    { key: "freelance", label: "Freelance" },
    { key: "internship", label: "Stage" },
    { key: "contract", label: "Contratto" },
  ];

  const addSkill = () => {
    if (newSkill.trim() && !formData.required_skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        required_skills: [...prev.required_skills, newSkill.trim()],
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      required_skills: prev.required_skills.filter(s => s !== skill),
    }));
  };

  const addBenefit = () => {
    if (newBenefit.trim() && !formData.benefits.includes(newBenefit.trim())) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit.trim()],
      }));
      setNewBenefit("");
    }
  };

  const removeBenefit = (benefit: string) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter(b => b !== benefit),
    }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Devi essere loggato");
      return;
    }

    if (!formData.title || !formData.description || !formData.location) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }

    setLoading(true);

    try {
      // Get professional or business ID
      const { data: prof } = await supabase
        .from("professionals")
        .select("id")
        .eq("user_id", user.id)
        .single();

      const { data: bus } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!prof && !bus) {
        toast.error("Devi essere un professionista o business per pubblicare annunci");
        setLoading(false);
        return;
      }

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + formData.expiration_days);

      const { error } = await supabase.from("job_posts").insert({
        professional_id: prof?.id || null,
        business_id: bus?.id || null,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        employment_type: formData.employment_type,
        location: formData.location,
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
        required_skills: formData.required_skills,
        benefits: formData.benefits,
        expiration_date: expirationDate.toISOString(),
        status: "active",
      });

      if (error) throw error;

      toast.success("Annuncio pubblicato con successo! 🎉");
      navigate("/hr");
    } catch (error) {
      console.error("Create job error:", error);
      toast.error("Errore nella pubblicazione");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold">Nuovo Annuncio</h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 rounded-full gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
        >
          {loading ? "..." : "Pubblica"}
        </button>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Title */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            Titolo Posizione *
          </label>
          <input
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="es. Parrucchiera con esperienza"
            className="w-full h-12 rounded-xl bg-card border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            Categoria
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setFormData(prev => ({ ...prev, category: cat.key }))}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  formData.category === cat.key
                    ? "gradient-primary text-primary-foreground"
                    : "bg-card border border-border"
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Employment Type */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            Tipo Contratto
          </label>
          <div className="flex flex-wrap gap-2">
            {employmentTypes.map(type => (
              <button
                key={type.key}
                onClick={() => setFormData(prev => ({ ...prev, employment_type: type.key }))}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  formData.employment_type === type.key
                    ? "gradient-primary text-primary-foreground"
                    : "bg-card border border-border"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            <MapPin className="w-3 h-3 inline mr-1" /> Località *
          </label>
          <input
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="es. Milano Centro"
            className="w-full h-12 rounded-xl bg-card border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Salary */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            <Euro className="w-3 h-3 inline mr-1" /> Range Stipendio (€/mese)
          </label>
          <div className="flex gap-3">
            <input
              value={formData.salary_min}
              onChange={(e) => setFormData(prev => ({ ...prev, salary_min: e.target.value }))}
              placeholder="Min"
              type="number"
              className="flex-1 h-12 rounded-xl bg-card border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              value={formData.salary_max}
              onChange={(e) => setFormData(prev => ({ ...prev, salary_max: e.target.value }))}
              placeholder="Max"
              type="number"
              className="flex-1 h-12 rounded-xl bg-card border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            Descrizione *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Descrivi la posizione, i requisiti, cosa offrite..."
            rows={6}
            className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Required Skills */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            Competenze Richieste
          </label>
          <div className="flex gap-2 mb-2">
            <input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addSkill()}
              placeholder="Aggiungi skill..."
              className="flex-1 h-10 rounded-xl bg-card border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button onClick={addSkill} className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Plus className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.required_skills.map(skill => (
              <span key={skill} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs flex items-center gap-1">
                {skill}
                <button onClick={() => removeSkill(skill)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            Cosa Offrite
          </label>
          <div className="flex gap-2 mb-2">
            <input
              value={newBenefit}
              onChange={(e) => setNewBenefit(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addBenefit()}
              placeholder="Aggiungi benefit..."
              className="flex-1 h-10 rounded-xl bg-card border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button onClick={addBenefit} className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Plus className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.benefits.map(benefit => (
              <span key={benefit} className="px-3 py-1 rounded-full bg-success/10 text-success text-xs flex items-center gap-1">
                {benefit}
                <button onClick={() => removeBenefit(benefit)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Expiration */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            <Calendar className="w-3 h-3 inline mr-1" /> Durata Annuncio
          </label>
          <div className="flex gap-2">
            {[15, 30, 60, 90].map(days => (
              <button
                key={days}
                onClick={() => setFormData(prev => ({ ...prev, expiration_days: days }))}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                  formData.expiration_days === days
                    ? "gradient-primary text-primary-foreground"
                    : "bg-card border border-border"
                }`}
              >
                {days} giorni
              </button>
            ))}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
