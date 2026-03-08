import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Mail, Lock, User, Scissors, Building2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { toast } from "sonner";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<string>("client");
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const profileTypes = [
    { key: "client", label: "Cliente", Icon: User, desc: "Prenota servizi" },
    { key: "professional", label: "Pro", Icon: Scissors, desc: "Offri servizi" },
    { key: "business", label: "Business", Icon: Building2, desc: "Gestisci salone" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) { toast.error(error.message); }
      else { toast.success("Benvenuto!"); navigate("/"); }
    } else {
      if (!displayName.trim()) { toast.error("Inserisci il tuo nome"); setLoading(false); return; }
      const { error } = await signUp(email, password, displayName, userType);
      if (error) { toast.error(error.message); }
      else { toast.success("Account creato! Controlla la tua email."); }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 max-w-lg mx-auto">
      <div className="w-full">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <img src={logo} alt="STYLE" className="w-16 h-16 mb-3" />
          <h1 className="text-2xl font-display font-bold tracking-tight">STYLE</h1>
          <p className="text-xs text-muted-foreground mt-1">La piattaforma beauty</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-muted rounded-xl p-1">
          <button onClick={() => setIsLogin(true)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}>
            Accedi
          </button>
          <button onClick={() => setIsLogin(false)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              !isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}>
            Registrati
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <>
              {/* Profile Type */}
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {profileTypes.map(t => (
                  <button key={t.key} type="button" onClick={() => setUserType(t.key)}
                    className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                      userType === t.key
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border/50 text-muted-foreground"
                    }`}>
                    <t.Icon className="w-5 h-5" />
                    <span>{t.label}</span>
                    <span className={`text-[9px] font-normal ${userType === t.key ? "text-primary-foreground/70" : "text-muted-foreground/50"}`}>{t.desc}</span>
                  </button>
                ))}
              </div>

              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" placeholder="Nome completo" value={displayName} onChange={e => setDisplayName(e.target.value)}
                  className="w-full h-12 rounded-xl bg-card border border-border/50 pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
              </div>
            </>
          )}

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
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 transition-all duration-200">
            {loading ? "Caricamento..." : isLogin ? "Accedi" : "Crea Account"}
          </button>
        </form>

        {isLogin && (
          <button className="w-full text-center mt-4 text-xs text-primary font-medium">Password dimenticata?</button>
        )}

        <p className="text-center text-[10px] text-muted-foreground mt-8">
          Continuando accetti i <span className="text-primary">Termini</span> e la <span className="text-primary">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}