import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Camera, Save, MapPin, Briefcase, Phone, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import stylist2 from "@/assets/stylist-2.jpg";

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

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    let avatarUrl = profile?.avatar_url;

    // Upload avatar if changed
    if (avatarFile) {
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, avatarFile, { upsert: true });

      if (!uploadError) {
        const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
        avatarUrl = data.publicUrl;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        bio,
        city,
        phone,
        user_type: userType,
        avatar_url: avatarUrl,
      })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Errore nel salvataggio");
    } else {
      await refreshProfile();
      toast.success("Profilo aggiornato! ✨");
      navigate("/profile");
    }
    setLoading(false);
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold">Modifica Profilo</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 rounded-full gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
        >
          {loading ? "..." : "Salva"}
        </button>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary">
              <img
                src={avatarPreview || stylist2}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full gradient-primary flex items-center justify-center border-2 border-background"
            >
              <Camera className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarSelect}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground mt-2">Tocca per cambiare foto</p>
        </div>

        {/* User Type */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            Tipo Account
          </label>
          <div className="flex gap-2">
            {[
              { key: "client", label: "Cliente", icon: "👤" },
              { key: "professional", label: "Professionista", icon: "💇‍♀️" },
              { key: "business", label: "Business", icon: "🏢" },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setUserType(t.key)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  userType === t.key ? "gradient-primary text-primary-foreground" : "bg-card border border-border"
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Nome
            </label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Il tuo nome"
              className="w-full h-11 rounded-xl bg-card border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Raccontaci di te..."
              rows={3}
              className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              <MapPin className="w-3 h-3 inline mr-1" /> Città
            </label>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Es. Milano"
              className="w-full h-11 rounded-xl bg-card border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              <Phone className="w-3 h-3 inline mr-1" /> Telefono
            </label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+39 xxx xxx xxxx"
              type="tel"
              className="w-full h-11 rounded-xl bg-card border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              <Mail className="w-3 h-3 inline mr-1" /> Email
            </label>
            <input
              value={user.email || ""}
              disabled
              className="w-full h-11 rounded-xl bg-muted border border-border px-4 text-sm text-muted-foreground"
            />
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
