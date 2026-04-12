import { useState, useEffect } from "react";
import safeStorage from "@/lib/safeStorage";

export type ColorTheme = "female" | "male";

const FEMALE = {
  primary: "262 80% 62%",
  ring: "262 80% 62%",
  sidebarPrimary: "262 80% 62%",
  sidebarRing: "262 80% 62%",
  gradientPrimary: "linear-gradient(135deg, hsl(262 80% 62%), hsl(290 70% 58%))",
  gradientLuxury: "linear-gradient(135deg, hsl(262 80% 62%), hsl(290 70% 58%), hsl(320 65% 55%))",
  gradientChrome: "linear-gradient(135deg, hsl(240 6% 88%), hsl(262 30% 72%), hsl(240 6% 60%))",
  gradientChromeDark: "linear-gradient(135deg, hsl(240 5% 18%), hsl(262 20% 22%), hsl(240 5% 12%))",
  gradientChromeText: "linear-gradient(135deg, hsl(0 0% 95%), hsl(262 30% 82%), hsl(0 0% 70%))",
  gradientChromeBorder: "linear-gradient(135deg, hsl(0 0% 30%), hsl(262 20% 40%), hsl(0 0% 20%))",
  shadowGlow: "0 0 40px hsl(262 80% 62% / 0.3)",
  shadowLuxury: "0 8px 32px hsl(262 80% 62% / 0.15), 0 2px 8px hsl(0 0% 0% / 0.5)",
};

const MALE = {
  primary: "32 80% 48%",             // Oro bronzo caldo #D4882A
  ring: "32 80% 48%",
  sidebarPrimary: "32 80% 48%",
  sidebarRing: "32 80% 48%",
  gradientPrimary: "linear-gradient(135deg, hsl(32 80% 48%), hsl(38 90% 55%))",
  gradientLuxury: "linear-gradient(135deg, hsl(32 80% 48%), hsl(38 90% 55%), hsl(25 70% 42%))",
  gradientChrome: "linear-gradient(135deg, hsl(240 6% 88%), hsl(38 40% 72%), hsl(240 6% 60%))",
  gradientChromeDark: "linear-gradient(135deg, hsl(240 5% 18%), hsl(32 25% 22%), hsl(240 5% 12%))",
  gradientChromeText: "linear-gradient(135deg, hsl(0 0% 95%), hsl(38 40% 82%), hsl(0 0% 70%))",
  gradientChromeBorder: "linear-gradient(135deg, hsl(0 0% 30%), hsl(32 25% 40%), hsl(0 0% 20%))",
  shadowGlow: "0 0 40px hsl(32 80% 48% / 0.3)",
  shadowLuxury: "0 8px 32px hsl(32 80% 48% / 0.15), 0 2px 8px hsl(0 0% 0% / 0.5)",
};

const THEMES: Record<ColorTheme, typeof FEMALE> = { female: FEMALE, male: MALE };

function applyColorTheme(t: ColorTheme) {
  const vars = THEMES[t];
  const r = document.documentElement;
  r.style.setProperty("--primary", vars.primary);
  r.style.setProperty("--ring", vars.ring);
  r.style.setProperty("--sidebar-primary", vars.sidebarPrimary);
  r.style.setProperty("--sidebar-ring", vars.sidebarRing);
  r.style.setProperty("--gradient-primary", vars.gradientPrimary);
  r.style.setProperty("--gradient-luxury", vars.gradientLuxury);
  r.style.setProperty("--gradient-chrome", vars.gradientChrome);
  r.style.setProperty("--gradient-chrome-dark", vars.gradientChromeDark);
  r.style.setProperty("--gradient-chrome-text", vars.gradientChromeText);
  r.style.setProperty("--gradient-chrome-border", vars.gradientChromeBorder);
  r.style.setProperty("--shadow-glow", vars.shadowGlow);
  r.style.setProperty("--shadow-luxury", vars.shadowLuxury);
}

export function useColorTheme() {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    const saved = safeStorage.getItem("style-color-theme");
    return saved === "male" ? "male" : "female";
  });

  useEffect(() => {
    applyColorTheme(colorTheme);
    safeStorage.setItem("style-color-theme", colorTheme);
  }, [colorTheme]);

  const setColorTheme = async (t: ColorTheme) => {
    setColorThemeState(t);
    // Persist to DB
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ color_theme: t }).eq("user_id", user.id);
      }
    } catch { /* ignore if not logged in */ }
  };

  return { colorTheme, setColorTheme };
}
