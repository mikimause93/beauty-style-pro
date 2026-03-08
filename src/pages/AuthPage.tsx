import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
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
    { key: "client", label: "Cliente", icon: "👤", desc: "Prenota servizi beauty" },
    { key: "professional", label: "Professionista", icon: "💇‍♀️", desc: "Offri i tuoi servizi" },
    { key: "business", label: "Business", icon: "🏢", desc: "Gestisci il tuo salone" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Benvenuto!");
        navigate("/");
      }
    } else {
      if (!displayName.trim()) {
        toast.error("Inserisci il tuo nome");
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, displayName, userType);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Account creato! Controlla la tua email per confermare.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 max-w-lg mx-auto">
      <div className="w-full">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="STYLE" className="w-20 h-20 mb-3" />
          <h1 className="text-3xl font-display font-bold text-gradient-primary">STYLE</h1>
          <p className="text-sm text-muted-foreground mt-1">La piattaforma beauty</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              isLogin ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            Accedi
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              !isLogin ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            Registrati
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              {/* Profile Type Selector */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Tipo di account
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {profileTypes.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setUserType(t.key)}
                      className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold transition-all border ${
                        userType === t.key
                          ? "gradient-primary text-primary-foreground border-transparent shadow-glow"
                          : "bg-card border-border text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      <span className="text-lg">{t.icon}</span>
                      <span>{t.label}</span>
                      <span className={`text-[10px] font-normal ${userType === t.key ? "text-primary-foreground/80" : "text-muted-foreground/60"}`}>
                        {t.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full h-12 rounded-xl bg-card border border-border pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full h-12 rounded-xl bg-card border border-border pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full h-12 rounded-xl bg-card border border-border pl-11 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Eye className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm shadow-glow disabled:opacity-50 transition-all hover:scale-[1.02]"
          >
            {loading ? "Caricamento..." : isLogin ? "Accedi" : "Crea Account"}
          </button>
        </form>

        {isLogin && (
          <button className="w-full text-center mt-4 text-sm text-primary">
            Password dimenticata?
          </button>
        )}

        <p className="text-center text-xs text-muted-foreground mt-8">
          Continuando accetti i{" "}
          <span className="text-primary">Termini di Servizio</span> e la{" "}
          <span className="text-primary">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
