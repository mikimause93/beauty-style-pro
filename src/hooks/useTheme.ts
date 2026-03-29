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
      root.classList.add("light");
      root.style.setProperty("--background", "0 0% 97%");
      root.style.setProperty("--foreground", "0 0% 8%");
      root.style.setProperty("--card", "0 0% 100%");
      root.style.setProperty("--card-foreground", "0 0% 8%");
      root.style.setProperty("--popover", "0 0% 100%");
      root.style.setProperty("--popover-foreground", "0 0% 8%");
      root.style.setProperty("--secondary", "0 0% 92%");
      root.style.setProperty("--secondary-foreground", "0 0% 15%");
      root.style.setProperty("--muted", "0 0% 94%");
      root.style.setProperty("--muted-foreground", "0 0% 40%");
      root.style.setProperty("--border", "0 0% 88%");
      root.style.setProperty("--input", "0 0% 88%");
      root.style.setProperty("--sidebar-background", "0 0% 97%");
      root.style.setProperty("--sidebar-foreground", "0 0% 8%");
      root.style.setProperty("--sidebar-accent", "0 0% 92%");
      root.style.setProperty("--sidebar-accent-foreground", "0 0% 8%");
      root.style.setProperty("--sidebar-border", "0 0% 88%");
      root.style.setProperty("--gradient-card", "linear-gradient(160deg, hsl(0 0% 100%), hsl(0 0% 97%))");
      root.style.setProperty("--shadow-card", "0 4px 24px hsl(0 0% 0% / 0.08)");
      root.style.setProperty("--gold-foreground", "0 0% 8%");
    } else {
      root.classList.remove("light");
      root.style.setProperty("--background", "0 0% 3%");
      root.style.setProperty("--foreground", "0 0% 95%");
      root.style.setProperty("--card", "0 0% 7%");
      root.style.setProperty("--card-foreground", "0 0% 95%");
      root.style.setProperty("--popover", "0 0% 7%");
      root.style.setProperty("--popover-foreground", "0 0% 95%");
      root.style.setProperty("--secondary", "0 0% 14%");
      root.style.setProperty("--secondary-foreground", "0 0% 90%");
      root.style.setProperty("--muted", "0 0% 10%");
      root.style.setProperty("--muted-foreground", "0 0% 50%");
      root.style.setProperty("--border", "0 0% 12%");
      root.style.setProperty("--input", "0 0% 12%");
      root.style.setProperty("--sidebar-background", "0 0% 5%");
      root.style.setProperty("--sidebar-foreground", "0 0% 95%");
      root.style.setProperty("--sidebar-accent", "0 0% 12%");
      root.style.setProperty("--sidebar-accent-foreground", "0 0% 95%");
      root.style.setProperty("--sidebar-border", "0 0% 12%");
      root.style.setProperty("--gradient-card", "linear-gradient(160deg, hsl(0 0% 8%), hsl(0 0% 5%))");
      root.style.setProperty("--shadow-card", "0 4px 24px hsl(0 0% 0% / 0.3)");
      root.style.setProperty("--gold-foreground", "0 0% 8%");
    }
    safeStorage.setItem("style-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");

  return { theme, setTheme, toggleTheme };
}
