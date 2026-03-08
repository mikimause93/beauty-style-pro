import { useState, useEffect, useCallback } from "react";
import logoS from "@/assets/logo-s.png";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<"founder" | "logo" | "text" | "fade" | "done">("founder");

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    // Load Playfair Display font
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,300;1,400&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    const timers = [
      setTimeout(() => setPhase("logo"), 2000),
      setTimeout(() => setPhase("text"), 3200),
      setTimeout(() => setPhase("fade"), 5200),
      setTimeout(() => setPhase("done"), 5900),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase === "done") handleComplete();
  }, [phase, handleComplete]);

  if (phase === "done") return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-700 ${
        phase === "fade" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ backgroundColor: "#000" }}
    >
      {/* Founder name — phase 1 */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${
          phase === "founder" ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <p
          className="text-lg tracking-[0.15em] text-center"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontStyle: "italic",
            fontWeight: 300,
            color: "rgba(255,255,255,0.85)",
          }}
        >
          Michele Peschechera
        </p>
      </div>

      {/* Logo + brand — phase 2+ */}
      <div
        className={`flex flex-col items-center transition-all duration-700 ${
          phase !== "founder" ? "opacity-100 scale-100" : "opacity-0 scale-90"
        }`}
      >
        <img
          src={logoS}
          alt="STYLE Logo"
          className={`w-28 h-28 mb-6 object-contain transition-all duration-700 ${
            phase === "logo" ? "scale-95 opacity-80" : "scale-100 opacity-100"
          }`}
        />

        <h1
          className={`text-3xl font-light tracking-[0.3em] transition-all duration-500 ${
            phase !== "founder" && phase !== "logo"
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            color: "#fff",
          }}
        >
          STYLE
        </h1>

        <p
          className={`text-[11px] mt-2 tracking-widest uppercase transition-all duration-500 delay-200 ${
            phase === "text" || phase === "fade" ? "opacity-100" : "opacity-0"
          }`}
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          La piattaforma beauty
        </p>
      </div>

      {/* Footer signature */}
      <p
        className={`absolute bottom-12 text-[10px] italic tracking-wide transition-all duration-500 ${
          phase === "text" || phase === "fade" ? "opacity-100" : "opacity-0"
        }`}
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          color: "rgba(255,255,255,0.15)",
        }}
      >
        Founded by Michele Peschechera ®
      </p>

      {/* Subtle loading bar */}
      <div className="absolute bottom-6 w-16 h-[2px] rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-full rounded-full"
          style={{
            backgroundColor: "rgba(255,255,255,0.3)",
            animation: "splash-load 5.2s ease-in-out forwards",
          }}
        />
      </div>

      <style>{`
        @keyframes splash-load {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
