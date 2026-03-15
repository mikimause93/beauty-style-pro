import { useState, useEffect } from "react";
import safeStorage from "@/lib/safeStorage";

type Theme = "dark" | "light";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = safeStorage.getItem("style-theme");
    return (saved === "light" ? "light" : "dark") as Theme;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.style.setProperty("--background", "38 20% 97%");
      root.style.setProperty("--foreground", "270 10% 8%");
      root.style.setProperty("--card", "38 15% 100%");
      root.style.setProperty("--card-foreground", "270 10% 8%");
      root.style.setProperty("--popover", "38 15% 100%");
      root.style.setProperty("--popover-foreground", "270 10% 8%");
      root.style.setProperty("--secondary", "38 12% 92%");
      root.style.setProperty("--secondary-foreground", "270 8% 15%");
      root.style.setProperty("--muted", "38 10% 94%");
      root.style.setProperty("--muted-foreground", "270 6% 40%");
      root.style.setProperty("--border", "38 10% 88%");
      root.style.setProperty("--input", "38 10% 88%");
      root.style.setProperty("--sidebar-background", "38 20% 97%");
      root.style.setProperty("--sidebar-foreground", "270 10% 8%");
      root.style.setProperty("--sidebar-accent", "38 12% 92%");
      root.style.setProperty("--sidebar-accent-foreground", "270 10% 8%");
      root.style.setProperty("--sidebar-border", "38 10% 88%");
      root.style.setProperty("--gradient-card", "linear-gradient(160deg, hsl(38 20% 100%), hsl(38 15% 97%))");
      root.style.setProperty("--gradient-dark-luxury", "linear-gradient(160deg, hsl(38 20% 99%) 0%, hsl(38 15% 97%) 50%, hsl(38 18% 98%) 100%)");
      root.style.setProperty("--shadow-card", "0 4px 24px hsl(270 8% 0% / 0.08)");
      root.style.setProperty("--gold-foreground", "0 0% 8%");
    } else {
      root.style.setProperty("--background", "270 8% 4%");
      root.style.setProperty("--foreground", "40 20% 96%");
      root.style.setProperty("--card", "270 8% 7%");
      root.style.setProperty("--card-foreground", "40 20% 96%");
      root.style.setProperty("--popover", "270 8% 7%");
      root.style.setProperty("--popover-foreground", "40 20% 96%");
      root.style.setProperty("--secondary", "270 6% 14%");
      root.style.setProperty("--secondary-foreground", "40 15% 90%");
      root.style.setProperty("--muted", "270 6% 10%");
      root.style.setProperty("--muted-foreground", "270 5% 52%");
      root.style.setProperty("--border", "270 6% 13%");
      root.style.setProperty("--input", "270 6% 13%");
      root.style.setProperty("--sidebar-background", "270 8% 5%");
      root.style.setProperty("--sidebar-foreground", "40 20% 96%");
      root.style.setProperty("--sidebar-accent", "270 6% 12%");
      root.style.setProperty("--sidebar-accent-foreground", "40 20% 96%");
      root.style.setProperty("--sidebar-border", "270 6% 12%");
      root.style.setProperty("--gradient-card", "linear-gradient(160deg, hsl(270 8% 9%), hsl(270 8% 5%))");
      root.style.setProperty("--gradient-dark-luxury", "linear-gradient(160deg, hsl(270 12% 11%) 0%, hsl(270 8% 6%) 50%, hsl(280 10% 8%) 100%)");
      root.style.setProperty("--shadow-card", "0 6px 40px hsl(270 8% 0% / 0.5), 0 1px 0 hsl(0 0% 100% / 0.03) inset");
      root.style.setProperty("--gold-foreground", "0 0% 8%");
    }
    safeStorage.setItem("style-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");

  return { theme, setTheme, toggleTheme };
}
