import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import safeStorage from "@/lib/safeStorage";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, userType?: string, gender?: string, colorTheme?: string, extraMeta?: Record<string, any>) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const [profileRes, privateRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("profiles_private").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    const merged = {
      ...profileRes.data,
      ...(privateRes.data ? {
        iban: privateRes.data.iban,
        bank_holder_name: privateRes.data.bank_holder_name,
        birth_date: privateRes.data.birth_date,
        document_urls: privateRes.data.document_urls,
        verification_notes: privateRes.data.verification_notes,
      } : {}),
    };
    setProfile(merged);

    // Apply color theme from profile on login
    const ct = merged?.color_theme;
    if (ct === "male" || ct === "female") {
      safeStorage.setItem("style-color-theme", ct);
      // Dynamically import to avoid circular deps
      import("@/hooks/useColorTheme").then(mod => {
        // trigger CSS variable update by dispatching a custom event
        const r = document.documentElement;
        if (ct === "male") {
          r.style.setProperty("--primary", "170 100% 20%");
          r.style.setProperty("--ring", "170 100% 20%");
          r.style.setProperty("--gradient-primary", "linear-gradient(135deg, hsl(170 100% 20%), hsl(170 80% 30%))");
          r.style.setProperty("--shadow-glow", "0 0 40px hsl(170 100% 20% / 0.3)");
        } else {
          r.style.setProperty("--primary", "262 80% 62%");
          r.style.setProperty("--ring", "262 80% 62%");
          r.style.setProperty("--gradient-primary", "linear-gradient(135deg, hsl(262 80% 62%), hsl(290 70% 58%))");
          r.style.setProperty("--shadow-glow", "0 0 40px hsl(262 80% 62% / 0.3)");
        }
      }).catch(() => {});
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

  const signUp = async (email: string, password: string, displayName: string, userType: string = "client", gender?: string, colorTheme?: string, extraMeta?: Record<string, any>) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName, user_type: userType, gender: gender || null, color_theme: colorTheme || "female", ...extraMeta },
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

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut, refreshProfile }}>
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
