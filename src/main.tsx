import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply saved theme on mount
let savedTheme: string | null = null;
try {
  savedTheme = localStorage.getItem("style-theme");
} catch { /* intentionally empty */ }
if (savedTheme === "light") {
  const root = document.documentElement;
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
  root.style.setProperty("--gradient-card", "linear-gradient(160deg, hsl(38 20% 100%), hsl(38 15% 97%))");
  root.style.setProperty("--gradient-dark-luxury", "linear-gradient(160deg, hsl(38 20% 99%) 0%, hsl(38 15% 97%) 50%, hsl(38 18% 98%) 100%)");
  root.style.setProperty("--shadow-card", "0 4px 24px hsl(270 8% 0% / 0.08)");
}

createRoot(document.getElementById("root")!).render(<App />);
