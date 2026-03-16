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
export function localizeAuthError(message?: string): string {
  if (!message) return "Si è verificato un errore. Riprova.";
  const m = message.toLowerCase();
  // Supabase v2 error codes (checked before text matching)
  if (m.includes("invalid_credentials") || m.includes("invalid login credentials") || m.includes("invalid credentials"))
    return "Credenziali non valide. Controlla email e password.";
  if (m.includes("email_not_confirmed") || m.includes("email not confirmed"))
    return "Email non verificata. Controlla la tua casella di posta e clicca il link di conferma.";
  if (m.includes("user_already_exists") || m.includes("user already registered") || m.includes("already been registered") || m.includes("already registered"))
    return "Questa email è già registrata. Prova ad accedere.";
  if (m.includes("weak_password") || m.includes("password should be at least") || m.includes("password is too short"))
    return "La password deve contenere almeno 6 caratteri.";
  if (m.includes("signup_disabled") || m.includes("signup is disabled") || m.includes("registrations"))
    return "La registrazione è temporaneamente disabilitata.";
  if (m.includes("over_request_rate_limit") || m.includes("email rate limit") || m.includes("rate limit") || m.includes("too many requests"))
    return "Troppi tentativi. Aspetta qualche minuto e riprova.";
  if (m.includes("invalid_phone") || m.includes("invalid phone") || m.includes("phone number"))
    return "Numero di telefono non valido.";
  if (m.includes("otp_expired") || m.includes("otp expired") || m.includes("token has expired"))
    return "Il codice OTP è scaduto. Richiedine uno nuovo.";
  if (m.includes("otp_disabled") || m.includes("invalid otp") || m.includes("token is invalid") || m.includes("invalid token"))
    return "Codice OTP non valido. Controlla il codice ricevuto.";
  if (m.includes("same_password"))
    return "La nuova password deve essere diversa da quella attuale.";
  if (m.includes("email_address_invalid") || m.includes("invalid email") || m.includes("unable to validate email"))
    return "Indirizzo email non valido.";
  if (m.includes("network") || m.includes("fetch") || m.includes("failed to fetch") || m.includes("networkerror"))
    return "Errore di rete. Controlla la connessione e riprova.";
  if (m.includes("timeout") || m.includes("timed out"))
    return "La richiesta ha impiegato troppo tempo. Riprova.";
  if (m.includes("unauthorized") || m.includes("not authorized"))
    return "Non autorizzato. Rieffettua il login.";
  // Return a generic Italian message for any unrecognized error instead of raw English
  return "Si è verificato un errore. Riprova.";
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
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName, user_type: userType },
          emailRedirectTo: window.location.origin,
        },
      });
      return { error };
    } catch (e: any) {
      return { error: { message: e?.message || "Errore di rete. Controlla la connessione." } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (e: any) {
      return { error: { message: e?.message || "Errore di rete. Controlla la connessione." } };
    }
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
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });
      return { error };
    } catch (e: any) {
      return { error: { message: e?.message || "Errore di rete. Controlla la connessione." } };
    }
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
