import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Camera, MapPin, Phone, Mail, Navigation, Briefcase, User, Scissors, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import stylist2 from "@/assets/stylist-2.jpg";

const CITIES = ["Milano", "Roma", "Napoli", "Torino", "Firenze", "Bologna", "Palermo", "Genova", "Bari", "Catania"];
const SPECIALTIES = ["Hairstylist", "Colorist", "Barber", "Estetista", "Nail Artist", "Makeup Artist", "Massaggiatore"];

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [city, setCity] = useState(profile?.city || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [userType, setUserType] = useState(profile?.user_type || "client");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<string[]>(profile?.skills || []);
  const [desiredCategories, setDesiredCategories] = useState<string[]>(profile?.desired_categories || []);
  const [locating, setLocating] = useState(false);
  const [iban, setIban] = useState(profile?.iban || "");
  const [bankHolderName, setBankHolderName] = useState(profile?.bank_holder_name || "");

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDetectLocation = async () => {
    setLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });
      // Reverse geocode with a simple approximation based on known cities
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const cityCoords: Record<string, [number, number]> = {
        Milano: [45.4642, 9.19], Roma: [41.9028, 12.4964], Napoli: [40.8518, 14.2681],
        Torino: [45.0703, 7.6869], Firenze: [43.7696, 11.2558], Bologna: [44.4949, 11.3426],
        Palermo: [38.1157, 13.3615], Genova: [44.4056, 8.9463], Bari: [41.1171, 16.8719],
        Catania: [37.5079, 15.09],
      };
      let closest = "Milano";
      let minDist = Infinity;
      for (const [name, [clat, clng]] of Object.entries(cityCoords)) {
        const d = Math.sqrt((lat - clat) ** 2 + (lng - clng) ** 2);
        if (d < minDist) { minDist = d; closest = name; }
      }
      setCity(closest);

      // Save coords to profile
      if (user) {
        await supabase.from("profiles").update({
          availability: {
            ...(profile?.availability as any || {}),
            latitude: lat,
            longitude: lng,
            share_location: true,
          },
        }).eq("user_id", user.id);
      }
      toast.success(`Posizione rilevata: ${closest}`);
    } catch {
      toast.error("Impossibile rilevare la posizione");
    } finally {
      setLocating(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const toggleCategory = (cat: string) => {
    setDesiredCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    let avatarUrl = profile?.avatar_url;
    if (avatarFile) {
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, avatarFile, { upsert: true });
      if (!uploadError) {
        const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
        avatarUrl = data.publicUrl;
      }
    }

    const { error } = await supabase.from("profiles").update({
      display_name: displayName,
      bio, city, phone,
      user_type: userType,
      avatar_url: avatarUrl,
      skills,
      desired_categories: desiredCategories,
    }).eq("user_id", user.id);

    if (error) {
      toast.error("Errore nel salvataggio");
    } else {
      await refreshProfile();
      toast.success("Profilo aggiornato!");
      navigate("/profile");
    }
    setLoading(false);
  };

  if (!user) { navigate("/auth"); return null; }

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold">Modifica Profilo</h1>
        </div>
        <button onClick={handleSave} disabled={loading}
          className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50">
          {loading ? "..." : "Salva"}
        </button>
      </header>

      <div className="px-5 py-6 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
              <img src={avatarPreview || stylist2} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <button onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-background">
              <Camera className="w-3.5 h-3.5 text-primary-foreground" />
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
        </div>

        {/* User Type */}
        <section>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">Tipo Account</p>
          <div className="flex gap-1.5">
            {[
              { key: "client", label: "Cliente", Icon: User },
              { key: "professional", label: "Pro", Icon: Scissors },
              { key: "business", label: "Business", Icon: Building2 },
            ].map(t => (
              <button key={t.key} onClick={() => setUserType(t.key)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  userType === t.key ? "bg-primary text-primary-foreground" : "bg-card border border-border/50 text-muted-foreground"
                }`}>
                <t.Icon className="w-4 h-4 inline mr-1" /> {t.label}
              </button>
            ))}
          </div>
        </section>

        {/* Basic Info */}
        <section className="space-y-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1">Informazioni</p>
          <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Nome"
            className="w-full h-11 rounded-xl bg-card border border-border/50 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Racconta di te..." rows={3}
            className="w-full rounded-xl bg-card border border-border/50 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/30" />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefono" type="tel"
            className="w-full h-11 rounded-xl bg-card border border-border/50 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
          <input value={user.email || ""} disabled
            className="w-full h-11 rounded-xl bg-muted border border-border/50 px-4 text-sm text-muted-foreground" />
        </section>

        {/* Location */}
        <section>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">Posizione</p>
          <div className="flex gap-2">
            <select value={city} onChange={e => setCity(e.target.value)}
              className="flex-1 h-11 rounded-xl bg-card border border-border/50 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30">
              <option value="">Seleziona città</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={handleDetectLocation} disabled={locating}
              className="h-11 px-4 rounded-xl bg-card border border-border/50 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
              <Navigation className="w-4 h-4" />
              {locating ? "..." : "GPS"}
            </button>
          </div>
        </section>

        {/* Skills / Preferences */}
        {userType === "professional" && (
          <section>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">Specialità</p>
            <div className="flex flex-wrap gap-1.5">
              {SPECIALTIES.map(s => (
                <button key={s} onClick={() => toggleSkill(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    skills.includes(s) ? "bg-primary text-primary-foreground" : "bg-card border border-border/50 text-muted-foreground"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </section>
        )}

        {userType === "client" && (
          <section>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">Interessi</p>
            <div className="flex flex-wrap gap-1.5">
              {SPECIALTIES.map(s => (
                <button key={s} onClick={() => toggleCategory(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    desiredCategories.includes(s) ? "bg-primary text-primary-foreground" : "bg-card border border-border/50 text-muted-foreground"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </MobileLayout>
  );
}