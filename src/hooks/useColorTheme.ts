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
  primary: "170 100% 20%",          // Verde vernice petrolio profondo #006B5E
  ring: "170 100% 20%",
  sidebarPrimary: "170 100% 20%",
  sidebarRing: "170 100% 20%",
  gradientPrimary: "linear-gradient(135deg, hsl(170 100% 20%), hsl(170 80% 30%))",
  gradientLuxury: "linear-gradient(135deg, hsl(170 100% 20%), hsl(170 80% 30%), hsl(180 70% 28%))",
  gradientChrome: "linear-gradient(135deg, hsl(240 6% 88%), hsl(170 30% 72%), hsl(240 6% 60%))",
  gradientChromeDark: "linear-gradient(135deg, hsl(240 5% 18%), hsl(170 20% 22%), hsl(240 5% 12%))",
  gradientChromeText: "linear-gradient(135deg, hsl(0 0% 95%), hsl(170 30% 82%), hsl(0 0% 70%))",
  gradientChromeBorder: "linear-gradient(135deg, hsl(0 0% 30%), hsl(170 20% 40%), hsl(0 0% 20%))",
  shadowGlow: "0 0 40px hsl(170 100% 20% / 0.3)",
  shadowLuxury: "0 8px 32px hsl(170 100% 20% / 0.15), 0 2px 8px hsl(0 0% 0% / 0.5)",
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

  const setColorTheme = (t: ColorTheme) => setColorThemeState(t);

  return { colorTheme, setColorTheme };
}
