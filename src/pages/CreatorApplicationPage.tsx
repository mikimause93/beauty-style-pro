import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Send, Scissors, Palette, Sparkles, Star, Instagram, Globe, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/layout/MobileLayout";
import { toast } from "sonner";

const categories = [
  { id: "hairstylist", label: "Hairstylist", Icon: Scissors },
  { id: "colorist", label: "Colorist", Icon: Palette },
  { id: "barber", label: "Barber", Icon: Scissors },
  { id: "estetista", label: "Estetista", Icon: Sparkles },
  { id: "nail_artist", label: "Nail Artist", Icon: Palette },
  { id: "makeup", label: "Makeup Artist", Icon: Star },
];

export default function CreatorApplicationPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [businessName, setBusinessName] = useState(profile?.display_name || "");
  const [specialty, setSpecialty] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState(profile?.city || "");
  const [hourlyRate, setHourlyRate] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");

  if (!user) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
          <Scissors className="w-10 h-10 text-primary mb-4" />
          <h2 className="text-xl font-display font-bold mb-2">Diventa Creator</h2>
          <p className="text-sm text-muted-foreground mb-6">Accedi per candidarti come professionista</p>
          <button onClick={() => navigate("/auth")} className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold">Accedi</button>
        </div>
      </MobileLayout>
    );
  }

  if (submitted) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-display font-bold mb-2">Candidatura Inviata!</h2>
          <p className="text-sm text-muted-foreground mb-6">Riceverai una notifica quando il tuo profilo sarà approvato.</p>
          <button onClick={() => navigate("/creator-dashboard")} className="px-8 py-3 rounded-full gradient-primary text-primary-foreground font-semibold mb-3">Vai alla Dashboard Creator</button>
          <button onClick={() => navigate("/")} className="px-8 py-3 rounded-full bg-muted text-foreground font-semibold">Torna alla Home</button>
        </div>
      </MobileLayout>
    );
  }

  const handleSubmit = async () => {
    if (!businessName.trim() || !specialty || !city.trim()) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("professionals").insert({
        user_id: user.id,
        business_name: businessName.trim(),
        specialty,
        description: description.trim() || null,
        city: city.trim(),
        hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
        address: null,
      });

      if (error) {
        if (error.code === "23505") toast.error("Hai già un profilo professionale");
        else throw error;
      } else {
        // Update profile type
        await supabase.from("profiles").update({ user_type: "professional" }).eq("user_id", user.id);
        setSubmitted(true);
        toast.success("Candidatura inviata!");
      }
    } catch (err: any) {
      toast.error(err.message || "Errore nell'invio");
    }
    setLoading(false);
  };

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-5 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-display font-bold">Diventa Creator</h1>
      </header>

      <div className="px-5 py-6 space-y-6">
        {/* Progress */}
        <div className="flex gap-2">
          {[1, 2].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? "gradient-primary" : "bg-muted"}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-5 fade-in">
            <div>
              <h2 className="text-lg font-display font-bold mb-1">Il tuo profilo</h2>
              <p className="text-xs text-muted-foreground">Inserisci le informazioni base</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Nome Attività *</label>
                <input value={businessName} onChange={e => setBusinessName(e.target.value)}
                  className="w-full rounded-xl bg-card border border-border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="es. Marco Barberi Studio" />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Categoria *</label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map(cat => (
                    <button key={cat.id} onClick={() => setSpecialty(cat.id)}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all ${
                        specialty === cat.id ? "gradient-primary text-primary-foreground" : "bg-card border border-border/50"
                      }`}>
                      <cat.Icon className="w-5 h-5" />
                      <span className="text-[10px] font-medium">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Città *</label>
                <input value={city} onChange={e => setCity(e.target.value)}
                  className="w-full rounded-xl bg-card border border-border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="es. Milano" />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Tariffa oraria (€)</label>
                <input value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} type="number"
                  className="w-full rounded-xl bg-card border border-border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="es. 45" />
              </div>
            </div>

            <button onClick={() => setStep(2)} disabled={!businessName.trim() || !specialty || !city.trim()}
              className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-bold disabled:opacity-50">
              Continua
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 fade-in">
            <div>
              <h2 className="text-lg font-display font-bold mb-1">Dettagli & Link</h2>
              <p className="text-xs text-muted-foreground">Aggiungi una descrizione e i tuoi social</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Descrizione</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                  className="w-full rounded-xl bg-card border border-border p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Parlaci di te e dei tuoi servizi..." />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5" /> Instagram
                </label>
                <input value={instagram} onChange={e => setInstagram(e.target.value)}
                  className="w-full rounded-xl bg-card border border-border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="@tuousername" />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Sito Web
                </label>
                <input value={website} onChange={e => setWebsite(e.target.value)}
                  className="w-full rounded-xl bg-card border border-border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="https://..." />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl bg-muted font-semibold text-sm">
                Indietro
              </button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 py-3 rounded-xl gradient-primary text-primary-foreground font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Invio...</> : <><Send className="w-4 h-4" /> Invia</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
