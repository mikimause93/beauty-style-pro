import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { ArrowRight, Building2, Scissors, Upload, MapPin, Phone, Globe, Instagram } from "lucide-react";

export default function OnboardingPage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Professional fields
  const [businessName, setBusinessName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");

  // Business fields
  const [legalName, setLegalName] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [businessType, setBusinessType] = useState("center");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState(user?.email || "");

  const userType = profile?.user_type || "client";

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);

    try {
      if (userType === "professional") {
        if (!businessName.trim() || !city.trim()) {
          toast.error("Inserisci nome attività e città");
          setLoading(false);
          return;
        }

        const { error: profError } = await supabase.from("professionals").insert({
          user_id: user.id,
          business_name: businessName,
          specialty,
          city,
          address,
          description: bio,
        });

        if (profError) throw profError;

        await supabase.from("profiles").update({ bio, city, phone }).eq("user_id", user.id);
      }

      if (userType === "business") {
        if (!legalName.trim() || !vatNumber.trim() || !businessName.trim()) {
          toast.error("Compila ragione sociale, P.IVA e nome attività");
          setLoading(false);
          return;
        }

        const slug = businessName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

        const { error: bizError } = await supabase.from("businesses").insert({
          user_id: user.id,
          legal_name: legalName,
          business_name: businessName,
          slug: `${slug}-${Date.now().toString(36)}`,
          vat_number: vatNumber,
          business_type: businessType,
          city,
          address,
          phone,
          email,
          website,
          instagram: instagramHandle,
        });

        if (bizError) throw bizError;

        await supabase.from("profiles").update({ bio, city, phone }).eq("user_id", user.id);
      }

      await refreshProfile();
      toast.success("Profilo completato! 🎉");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Errore nel salvataggio");
    } finally {
      setLoading(false);
    }
  };

  // Client redirect
  if (userType === "client") {
    navigate("/");
    return null;
  }

  const totalSteps = userType === "business" ? 3 : 2;

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <img src={logo} alt="STYLE" className="w-10 h-10" />
          <div>
            <h1 className="text-xl font-display font-bold">Completa il profilo</h1>
            <p className="text-xs text-muted-foreground">
              {userType === "professional" ? "Professionista" : "Business"} • Step {step}/{totalSteps}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i < step ? "gradient-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 space-y-4">
        {userType === "professional" && step === 1 && (
          <>
            <div className="p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Scissors className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-sm">La tua attività</h3>
              </div>
              <div className="space-y-3">
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Nome Studio / Salone *"
                  className="w-full h-11 rounded-xl bg-background border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Specialità (es. Colorista, Barbiere)"
                  className="w-full h-11 rounded-xl bg-background border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Descrivi la tua attività..."
                  rows={3}
                  className="w-full rounded-xl bg-background border border-border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </>
        )}

        {userType === "professional" && step === 2 && (
          <div className="p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-sm">Posizione & Contatti</h3>
            </div>
            <div className="space-y-3">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Città *"
                className="w-full h-11 rounded-xl bg-background border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Indirizzo"
                className="w-full h-11 rounded-xl bg-background border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                placeholder="@instagram"
                className="w-full h-11 rounded-xl bg-background border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
        )}

        {userType === "business" && step === 1 && (
          <div className="p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-sm">Dati Aziendali</h3>
            </div>
            <div className="space-y-3">
              <input
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Ragione Sociale *"
                className="w-full h-11 rounded-xl bg-background border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Nome Commerciale *"
                className="w-full h-11 rounded-xl bg-background border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                placeholder="Partita IVA *"
                className="w-full h-11 rounded-xl bg-background border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="grid grid-cols-2 gap-2">
                {["center", "barbershop", "spa", "individual"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setBusinessType(t)}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all border ${
                      businessType === t
                        ? "gradient-primary text-primary-foreground border-transparent"
                        : "bg-background border-border text-muted-foreground"
                    }`}
                  >
                    {t === "center" ? "Centro" : t === "barbershop" ? "Barbershop" : t === "spa" ? "Spa" : "Individuale"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {userType === "business" && step === 2 && (
          <div className="p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-sm">Sede & Contatti</h3>
            </div>
            <div className="space-y-3">
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Città *"
                className="w-full h-11 rounded-xl bg-background border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Indirizzo"
                className="w-full h-11 rounded-xl bg-background border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefono" type="tel"
                className="w-full h-11 rounded-xl bg-background border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email aziendale"
                className="w-full h-11 rounded-xl bg-background border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
          </div>
        )}

        {userType === "business" && step === 3 && (
          <div className="p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-sm">Online & Social</h3>
            </div>
            <div className="space-y-3">
              <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Sito web"
                className="w-full h-11 rounded-xl bg-background border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} placeholder="@instagram"
                className="w-full h-11 rounded-xl bg-background border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Descrizione attività..."
                rows={3} className="w-full rounded-xl bg-background border border-border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 space-y-3">
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 h-12 rounded-xl bg-muted text-foreground font-semibold text-sm"
            >
              Indietro
            </button>
          )}
          {step < totalSteps ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex-1 h-12 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm shadow-glow flex items-center justify-center gap-2"
            >
              Avanti <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={loading}
              className="flex-1 h-12 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm shadow-glow disabled:opacity-50"
            >
              {loading ? "Salvataggio..." : "Completa Profilo ✨"}
            </button>
          )}
        </div>
        <button onClick={() => navigate("/")} className="w-full text-center text-xs text-muted-foreground">
          Salta per ora
        </button>
      </div>
    </div>
  );
}
