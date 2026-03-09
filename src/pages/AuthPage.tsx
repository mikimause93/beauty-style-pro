import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Mail, Lock, User, Scissors, Building2, MapPin, Phone, Camera, ChevronRight, ChevronLeft, Globe, Calendar, Briefcase, Upload, Loader2, CheckCircle, Instagram, AtSign } from "lucide-react";
import logo from "@/assets/logo.png";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────
type AccountType = "client" | "professional" | "business";
type RegistrationResult = { success: boolean; email?: string; accountType?: AccountType } | null;

const CATEGORIES_PRO = [
  "Hairstylist", "Colorist", "Barber", "Estetista", "Nail Artist",
  "Makeup Artist", "Tattoo Artist", "Photographer", "Creator",
];

const CATEGORIES_BIZ = [
  "Salone", "Brand", "Accademia", "Shop", "Agenzia",
];

// ─── Component ───────────────────────────────────────────
export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [step, setStep] = useState(0); // 0=type select, 1+=form steps
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();

  // Shared fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Client fields
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Italia");
  const [birthDate, setBirthDate] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [facebook, setFacebook] = useState("");

  // Professional fields
  const [whatsapp, setWhatsapp] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  // Business fields
  const [companyName, setCompanyName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [address, setAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [website, setWebsite] = useState("");
  const [bizCategory, setBizCategory] = useState("");

  // Location
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate("/");
  }, [user]);

  // ─── GPS ─────────────────────────────────────────────
  const requestLocation = async () => {
    setLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
      );
      setLatitude(pos.coords.latitude);
      setLongitude(pos.coords.longitude);

      // Reverse geocode approximation
      const cityCoords: Record<string, [number, number]> = {
        Milano: [45.4642, 9.19], Roma: [41.9028, 12.4964], Napoli: [40.8518, 14.2681],
        Torino: [45.0703, 7.6869], Firenze: [43.7696, 11.2558], Bologna: [44.4949, 11.3426],
        Palermo: [38.1157, 13.3615], Genova: [44.4056, 8.9463], Bari: [41.1171, 16.8719], Catania: [37.5079, 15.09],
      };
      let closest = "Milano";
      let minDist = Infinity;
      for (const [n, [clat, clng]] of Object.entries(cityCoords)) {
        const d = Math.sqrt((pos.coords.latitude - clat) ** 2 + (pos.coords.longitude - clng) ** 2);
        if (d < minDist) { minDist = d; closest = n; }
      }
      if (!city) setCity(closest);
      toast.success(`Posizione rilevata: ${closest}`);
    } catch {
      toast.error("Impossibile ottenere la posizione");
    }
    setLocating(false);
  };

  // ─── Login ───────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) toast.error(error.message);
    else { toast.success("Benvenuto!"); navigate("/"); }
    setLoading(false);
  };

  // ─── Signup ──────────────────────────────────────────
  const handleSignup = async () => {
    if (!accountType) return;
    setLoading(true);

    const displayName = accountType === "business" ? ownerName : `${name} ${surname}`.trim();
    if (!displayName) { toast.error("Inserisci il tuo nome"); setLoading(false); return; }
    if (!email || !password) { toast.error("Email e password obbligatorie"); setLoading(false); return; }

    const { error } = await signUp(email, password, displayName, accountType);
    if (error) { toast.error(error.message); setLoading(false); return; }

    // Wait briefly for profile creation trigger
    await new Promise(r => setTimeout(r, 1500));

    // Get the new user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { toast.success("Account creato! Effettua il login."); setLoading(false); return; }

    const userId = session.user.id;

    // Update profile with extra fields
    const profileUpdate: Record<string, any> = {
      surname, username, phone, city, country, bio, whatsapp,
      latitude, longitude,
      interests: interests.length > 0 ? interests : null,
      birth_date: birthDate || null,
      instagram: instagram || null,
      tiktok: tiktok || null,
      facebook: facebook || null,
    };
    await supabase.from("profiles").update(profileUpdate).eq("user_id", userId);

    // Create professional record
    if (accountType === "professional") {
      await supabase.from("professionals").insert({
        user_id: userId,
        business_name: displayName,
        specialty: category || null,
        description: description || null,
        city: city || null,
        whatsapp: whatsapp || null,
        price_min: priceMin ? parseFloat(priceMin) : null,
        price_max: priceMax ? parseFloat(priceMax) : null,
        latitude, longitude,
      });
    }

    // Create business record
    if (accountType === "business") {
      const slug = companyName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      await supabase.from("businesses").insert({
        user_id: userId,
        business_name: companyName,
        legal_name: companyName,
        vat_number: vatNumber,
        tax_code: taxCode || null,
        slug: slug || `biz-${Date.now()}`,
        city: city || null,
        address: address || null,
        zip_code: zipCode || null,
        phone: phone || null,
        email: email,
        website: website || null,
        business_type: bizCategory || "center",
        latitude, longitude,
      });
    }

    toast.success("Registrazione completata!");
    navigate("/");
    setLoading(false);
  };

  // ─── Step logic per account type ─────────────────────
  const totalSteps = accountType === "client" ? 3 : accountType === "professional" ? 3 : accountType === "business" ? 3 : 0;

  const canProceed = () => {
    if (step === 0) return !!accountType;
    if (step === 1) {
      if (accountType === "client") return !!name && !!email && !!password;
      if (accountType === "professional") return !!name && !!email && !!password;
      if (accountType === "business") return !!companyName && !!ownerName && !!email && !!password && !!vatNumber;
    }
    if (step === 2 && accountType === "client") return !!city && !!birthDate;
    return true;
  };

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else handleSignup();
  };

  // ─── RENDER: LOGIN ──────────────────────────────────
  if (isLogin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 max-w-lg mx-auto">
        <div className="w-full">
          <div className="flex flex-col items-center mb-10">
            <img src={logo} alt="STYLE" className="w-16 h-16 mb-3" />
            <h1 className="text-2xl font-display font-bold tracking-tight">STYLE</h1>
            <p className="text-xs text-muted-foreground mt-1">La piattaforma beauty</p>
          </div>

          <div className="flex gap-1 mb-6 bg-muted rounded-xl p-1">
            <button onClick={() => setIsLogin(true)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-card text-foreground shadow-sm">Accedi</button>
            <button onClick={() => { setIsLogin(false); setStep(0); }} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-muted-foreground">Registrati</button>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full h-12 rounded-xl bg-card border border-border/50 pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type={showPassword ? "text" : "password"} placeholder="Password" value={password}
                onChange={e => setPassword(e.target.value)} required minLength={6}
                className="w-full h-12 rounded-xl bg-card border border-border/50 pl-11 pr-11 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2">
                {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50">
              {loading ? "Caricamento..." : "Accedi"}
            </button>
          </form>
          <button className="w-full text-center mt-4 text-xs text-primary font-medium">Password dimenticata?</button>
          <p className="text-center text-[10px] text-muted-foreground mt-8">
            Continuando accetti i <span className="text-primary">Termini</span> e la <span className="text-primary">Privacy Policy</span>
          </p>
        </div>
      </div>
    );
  }

  // ─── RENDER: REGISTRATION ───────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col px-6 max-w-lg mx-auto py-8">
      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        <img src={logo} alt="STYLE" className="w-12 h-12 mb-2" />
        <h1 className="text-xl font-display font-bold tracking-tight">Crea il tuo account</h1>
      </div>

      {/* Tab switch */}
      <div className="flex gap-1 mb-6 bg-muted rounded-xl p-1">
        <button onClick={() => setIsLogin(true)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-muted-foreground">Accedi</button>
        <button className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-card text-foreground shadow-sm">Registrati</button>
      </div>

      {/* Progress bar */}
      {step > 0 && totalSteps > 0 && (
        <div className="flex gap-1.5 mb-6">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i < step ? "bg-primary" : i === step ? "bg-primary/50" : "bg-muted"}`} />
          ))}
        </div>
      )}

      {/* STEP 0: Choose account type */}
      {step === 0 && (
        <div className="space-y-4 fade-in">
          <p className="text-sm text-muted-foreground text-center mb-2">Scegli il tipo di account</p>
          {([
            { key: "client" as AccountType, label: "Cliente", desc: "Scopri, prenota e socializza", Icon: User, color: "from-blue-500 to-cyan-500" },
            { key: "professional" as AccountType, label: "Professionista", desc: "Offri servizi, ricevi prenotazioni", Icon: Scissors, color: "from-purple-500 to-pink-500" },
            { key: "business" as AccountType, label: "Business", desc: "Gestisci salone o attività", Icon: Building2, color: "from-amber-500 to-orange-500" },
          ]).map(t => (
            <button key={t.key} onClick={() => { setAccountType(t.key); setStep(1); }}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 ${
                accountType === t.key ? "border-primary bg-primary/5" : "border-border/50 bg-card hover:border-primary/30"
              }`}>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center`}>
                <t.Icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-sm">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}

      {/* ═══ CLIENT STEP 1: Basic Info ═══ */}
      {step === 1 && accountType === "client" && (
        <div className="space-y-4 fade-in">
          <h2 className="text-lg font-display font-bold">I tuoi dati</h2>
          <div className="grid grid-cols-2 gap-3">
            <InputField icon={<User className="w-4 h-4" />} placeholder="Nome *" value={name} onChange={setName} />
            <InputField placeholder="Cognome *" value={surname} onChange={setSurname} />
          </div>
          <InputField placeholder="Username" value={username} onChange={setUsername} />
          <InputField icon={<Mail className="w-4 h-4" />} placeholder="Email *" value={email} onChange={setEmail} type="email" />
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type={showPassword ? "text" : "password"} placeholder="Password *" value={password}
              onChange={e => setPassword(e.target.value)} minLength={6}
              className="w-full h-12 rounded-xl bg-card border border-border/50 pl-11 pr-11 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
            </button>
          </div>
          <InputField icon={<Phone className="w-4 h-4" />} placeholder="Telefono" value={phone} onChange={setPhone} type="tel" />
          <InputField icon={<Calendar className="w-4 h-4" />} placeholder="Data di nascita *" value={birthDate} onChange={setBirthDate} type="date" />
        </div>
      )}

      {/* ═══ CLIENT STEP 2: Città, Bio & Interessi ═══ */}
      {step === 2 && accountType === "client" && (
        <div className="space-y-4 fade-in">
          <h2 className="text-lg font-display font-bold">Dove ti trovi</h2>
          <LocationPicker city={city} setCity={setCity} country={country} setCountry={setCountry}
            locating={locating} requestLocation={requestLocation} latitude={latitude} />
          <InputField placeholder="Parlaci di te... *" value={bio} onChange={setBio} multiline />
          <div>
            <p className="text-xs font-semibold mb-2 text-muted-foreground">I tuoi interessi</p>
            <div className="flex flex-wrap gap-2">
              {["Hair", "Makeup", "Nails", "Skin", "Tattoo", "Fashion", "Fitness", "Barber", "Wellness"].map(i => (
                <button key={i} type="button" onClick={() => setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    interests.includes(i) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>{i}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ CLIENT STEP 3: Social Links ═══ */}
      {step === 3 && accountType === "client" && (
        <div className="space-y-4 fade-in">
          <h2 className="text-lg font-display font-bold">I tuoi social</h2>
          <p className="text-xs text-muted-foreground">Aggiungi i tuoi profili social per farti trovare più facilmente</p>
          <InputField icon={<Instagram className="w-4 h-4" />} placeholder="@instagram" value={instagram} onChange={setInstagram} />
          <InputField icon={<AtSign className="w-4 h-4" />} placeholder="@tiktok" value={tiktok} onChange={setTiktok} />
          <InputField icon={<Globe className="w-4 h-4" />} placeholder="Facebook (link o username)" value={facebook} onChange={setFacebook} />
        </div>
      )}

      {/* ═══ PRO STEP 1: Basic Info ═══ */}
      {step === 1 && accountType === "professional" && (
        <div className="space-y-4 fade-in">
          <h2 className="text-lg font-display font-bold">I tuoi dati</h2>
          <div className="grid grid-cols-2 gap-3">
            <InputField icon={<User className="w-4 h-4" />} placeholder="Nome *" value={name} onChange={setName} />
            <InputField placeholder="Cognome" value={surname} onChange={setSurname} />
          </div>
          <InputField icon={<Mail className="w-4 h-4" />} placeholder="Email *" value={email} onChange={setEmail} type="email" />
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type={showPassword ? "text" : "password"} placeholder="Password *" value={password}
              onChange={e => setPassword(e.target.value)} minLength={6}
              className="w-full h-12 rounded-xl bg-card border border-border/50 pl-11 pr-11 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
            </button>
          </div>
          <InputField icon={<Phone className="w-4 h-4" />} placeholder="Telefono *" value={phone} onChange={setPhone} type="tel" />
          <InputField icon={<Phone className="w-4 h-4" />} placeholder="WhatsApp *" value={whatsapp} onChange={setWhatsapp} type="tel" />
        </div>
      )}

      {/* ═══ PRO STEP 2: Category & Details ═══ */}
      {step === 2 && accountType === "professional" && (
        <div className="space-y-4 fade-in">
          <h2 className="text-lg font-display font-bold">Professione</h2>
          <div>
            <p className="text-xs font-semibold mb-2 text-muted-foreground">Categoria *</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES_PRO.map(c => (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    category === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>{c}</button>
              ))}
            </div>
          </div>
          <InputField placeholder="Descrizione servizi" value={description} onChange={setDescription} multiline />
          <div className="grid grid-cols-2 gap-3">
            <InputField placeholder="Prezzo min (€)" value={priceMin} onChange={setPriceMin} type="number" />
            <InputField placeholder="Prezzo max (€)" value={priceMax} onChange={setPriceMax} type="number" />
          </div>
        </div>
      )}

      {/* ═══ PRO STEP 3: Location ═══ */}
      {step === 3 && accountType === "professional" && (
        <div className="space-y-4 fade-in">
          <h2 className="text-lg font-display font-bold">Posizione</h2>
          <LocationPicker city={city} setCity={setCity} country={country} setCountry={setCountry}
            locating={locating} requestLocation={requestLocation} latitude={latitude} />
          <InputField placeholder="Bio (opzionale)" value={bio} onChange={setBio} multiline />
        </div>
      )}

      {/* ═══ BUSINESS STEP 1: Company Info ═══ */}
      {step === 1 && accountType === "business" && (
        <div className="space-y-4 fade-in">
          <h2 className="text-lg font-display font-bold">Dati aziendali</h2>
          <InputField icon={<Building2 className="w-4 h-4" />} placeholder="Nome Azienda *" value={companyName} onChange={setCompanyName} />
          <InputField icon={<User className="w-4 h-4" />} placeholder="Nome Titolare *" value={ownerName} onChange={setOwnerName} />
          <InputField icon={<Mail className="w-4 h-4" />} placeholder="Email *" value={email} onChange={setEmail} type="email" />
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type={showPassword ? "text" : "password"} placeholder="Password *" value={password}
              onChange={e => setPassword(e.target.value)} minLength={6}
              className="w-full h-12 rounded-xl bg-card border border-border/50 pl-11 pr-11 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
            </button>
          </div>
          <InputField icon={<Briefcase className="w-4 h-4" />} placeholder="P.IVA *" value={vatNumber} onChange={setVatNumber} />
          <InputField placeholder="Codice Fiscale" value={taxCode} onChange={setTaxCode} />
          <InputField icon={<Phone className="w-4 h-4" />} placeholder="Telefono" value={phone} onChange={setPhone} type="tel" />
          <InputField icon={<Phone className="w-4 h-4" />} placeholder="WhatsApp" value={whatsapp} onChange={setWhatsapp} type="tel" />
        </div>
      )}

      {/* ═══ BUSINESS STEP 2: Details ═══ */}
      {step === 2 && accountType === "business" && (
        <div className="space-y-4 fade-in">
          <h2 className="text-lg font-display font-bold">Dettagli attività</h2>
          <div>
            <p className="text-xs font-semibold mb-2 text-muted-foreground">Categoria</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES_BIZ.map(c => (
                <button key={c} type="button" onClick={() => setBizCategory(c.toLowerCase())}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    bizCategory === c.toLowerCase() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>{c}</button>
              ))}
            </div>
          </div>
          <InputField icon={<Globe className="w-4 h-4" />} placeholder="Sito Web" value={website} onChange={setWebsite} />
          <InputField placeholder="Indirizzo" value={address} onChange={setAddress} />
          <div className="grid grid-cols-2 gap-3">
            <InputField placeholder="CAP" value={zipCode} onChange={setZipCode} />
            <InputField placeholder="Descrizione" value={description} onChange={setDescription} multiline />
          </div>
        </div>
      )}

      {/* ═══ BUSINESS STEP 3: Location & KYC notice ═══ */}
      {step === 3 && accountType === "business" && (
        <div className="space-y-4 fade-in">
          <h2 className="text-lg font-display font-bold">Posizione e Verifica</h2>
          <LocationPicker city={city} setCity={setCity} country={country} setCountry={setCountry}
            locating={locating} requestLocation={requestLocation} latitude={latitude} />

          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Verifica KYC</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Dopo la registrazione potrai verificare il tuo account caricando documenti d'identità e aziendali per ottenere il badge <strong>Business Verificato</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      {step > 0 && (
        <div className="mt-8 space-y-3">
          <button onClick={handleNext} disabled={loading || !canProceed()}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creazione...</> :
              step < totalSteps ? <>Continua <ChevronRight className="w-4 h-4" /></> :
              <>Crea Account <CheckCircle className="w-4 h-4" /></>}
          </button>
          <button onClick={() => setStep(Math.max(0, step - 1))}
            className="w-full h-10 rounded-xl bg-muted text-foreground font-medium text-sm flex items-center justify-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Indietro
          </button>
        </div>
      )}

      <p className="text-center text-[10px] text-muted-foreground mt-6">
        Continuando accetti i <span className="text-primary">Termini</span> e la <span className="text-primary">Privacy Policy</span>
      </p>
    </div>
  );
}

// ─── Reusable Input ───────────────────────────────────
function InputField({ icon, placeholder, value, onChange, type = "text", multiline = false }: {
  icon?: React.ReactNode; placeholder: string; value: string; onChange: (v: string) => void; type?: string; multiline?: boolean;
}) {
  if (multiline) {
    return (
      <textarea placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} rows={3}
        className="w-full rounded-xl bg-card border border-border/50 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/30" />
    );
  }
  return (
    <div className="relative">
      {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>}
      <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
        className={`w-full h-12 rounded-xl bg-card border border-border/50 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 ${icon ? "pl-11" : "pl-4"}`} />
    </div>
  );
}

// ─── Location Picker ──────────────────────────────────
function LocationPicker({ city, setCity, country, setCountry, locating, requestLocation, latitude }: {
  city: string; setCity: (v: string) => void; country: string; setCountry: (v: string) => void;
  locating: boolean; requestLocation: () => void; latitude: number | null;
}) {
  return (
    <div className="space-y-3">
      <button type="button" onClick={requestLocation} disabled={locating}
        className={`w-full h-12 rounded-xl border font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
          latitude ? "border-primary/30 bg-primary/5 text-primary" : "border-border/50 bg-card text-foreground"
        }`}>
        {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
        {latitude ? "Posizione rilevata ✓" : "Rileva posizione GPS"}
      </button>
      <div className="grid grid-cols-2 gap-3">
        <InputField icon={<MapPin className="w-4 h-4" />} placeholder="Città" value={city} onChange={setCity} />
        <InputField icon={<Globe className="w-4 h-4" />} placeholder="Paese" value={country} onChange={setCountry} />
      </div>
    </div>
  );
}
