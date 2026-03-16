import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, userType?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

/** Translates Supabase English error messages to Italian. */
export function localizeAuthError(message: string): string {
  if (!message) return "Si è verificato un errore. Riprova.";
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("invalid credentials"))
    return "Credenziali non valide. Controlla email e password.";
  if (m.includes("email not confirmed"))
    return "Email non verificata. Controlla la tua casella di posta.";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "Questa email è già registrata. Prova ad accedere.";
  if (m.includes("password should be at least"))
    return "La password deve contenere almeno 6 caratteri.";
  if (m.includes("signup is disabled"))
    return "La registrazione è temporaneamente disabilitata.";
  if (m.includes("email rate limit exceeded") || m.includes("rate limit"))
    return "Troppi tentativi. Aspetta qualche minuto e riprova.";
  if (m.includes("invalid phone") || m.includes("phone number"))
    return "Numero di telefono non valido.";
  if (m.includes("otp expired") || m.includes("token has expired"))
    return "Il codice OTP è scaduto. Richiedine uno nuovo.";
  if (m.includes("invalid otp") || m.includes("token is invalid"))
    return "Codice OTP non valido. Controlla il codice ricevuto.";
  if (m.includes("network") || m.includes("fetch"))
    return "Errore di rete. Controlla la connessione e riprova.";
  return message;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      setProfile(data ?? null);
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Handle expired/invalid tokens gracefully
        if (event === "TOKEN_REFRESHED" && !session) {
          console.warn("Token refresh failed, signing out");
          setUser(null);
          setSession(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        if (event === "SIGNED_OUT") {
          setUser(null);
          setSession(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 500);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn("Session recovery failed:", error.message);
        // Clear stale tokens
        supabase.auth.signOut().catch(() => {});
        setUser(null);
        setSession(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName: string, userType: string = "client") => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName, user_type: userType },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut, refreshProfile, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
