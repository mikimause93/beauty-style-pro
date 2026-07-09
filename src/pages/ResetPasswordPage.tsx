import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Lock, EyeOff, Eye, CheckCircle, ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }
    // Also listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("La password deve avere almeno 6 caratteri"); return; }
    if (password !== confirmPassword) { toast.error("Le password non corrispondono"); return; }
    
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      setSuccess(true);
      toast.success("Password aggiornata con successo!");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 max-w-lg mx-auto">
        <div className="w-full text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-display font-bold">Password aggiornata!</h2>
          <p className="text-sm text-muted-foreground">La tua password è stata cambiata con successo.</p>
          <button onClick={() => navigate("/")} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
            Vai alla Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 max-w-lg mx-auto">
      <div className="w-full">
        <div className="flex flex-col items-center mb-10">
          <img src={logo} alt="STYLE" className="w-16 h-16 mb-3" />
          <h1 className="text-2xl font-display font-bold tracking-tight">Nuova Password</h1>
          <p className="text-xs text-muted-foreground mt-1">Inserisci la tua nuova password</p>
        </div>

        <form onSubmit={handleReset} className="space-y-3">
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Nuova password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full h-12 rounded-xl bg-card border border-border/50 pl-11 pr-11 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Conferma password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full h-12 rounded-xl bg-card border border-border/50 pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50">
            {loading ? "Aggiornamento..." : "Aggiorna Password"}
          </button>
        </form>

        <button type="button" onClick={() => navigate("/auth")} className="w-full flex items-center justify-center gap-2 mt-6 text-xs text-primary font-medium">
          <ArrowLeft className="w-3 h-3" /> Torna al login
        </button>
      </div>
    </div>
  );
}
