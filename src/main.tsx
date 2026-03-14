import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply saved theme on mount
const savedTheme = localStorage.getItem("style-theme");
if (savedTheme === "light") {
  const root = document.documentElement;
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
  root.style.setProperty("--gradient-card", "linear-gradient(160deg, hsl(0 0% 100%), hsl(0 0% 97%))");
  root.style.setProperty("--shadow-card", "0 4px 24px hsl(0 0% 0% / 0.08)");
}

createRoot(document.getElementById("root")!).render(<App />);
