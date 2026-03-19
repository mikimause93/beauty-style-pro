import { useState, useEffect, useCallback } from "react";
import logoS from "@/assets/logo-s.png";
import { APP_VERSION, APP_TAGLINE } from "@/lib/version";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<"founder" | "logo" | "text" | "fade" | "done">("founder");

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    // Only load Playfair Display here — Orbitron is already loaded via index.css
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,300;1,400&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    const timers = [
      setTimeout(() => setPhase("logo"), 2500),
      setTimeout(() => setPhase("text"), 3700),
      setTimeout(() => setPhase("fade"), 5700),
      setTimeout(() => setPhase("done"), 6400),
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
      {/* Ambient neon glow background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(139,92,246,0.12) 0%, rgba(217,70,239,0.06) 50%, transparent 100%)",
          transition: "opacity 1s ease",
          opacity: phase === "founder" ? 0 : 1,
        }}
      />

      {/* Founder name — phase 1 */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center gap-4 transition-all duration-700 ${
          phase === "founder" ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <p
          className="text-[10px] tracking-[0.25em] uppercase"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.25em",
          }}
        >
          Founder
        </p>
        <p
          className="text-2xl tracking-[0.12em] text-center"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontStyle: "italic",
            fontWeight: 300,
            color: "rgba(255,255,255,0.9)",
          }}
        >
          Michele Peschechera
        </p>
        <p
          className="text-[10px] mt-1"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontStyle: "italic",
            color: "rgba(255,255,255,0.25)",
          }}
        >
          Michele Peschechera ®
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
          style={{ filter: "drop-shadow(0 0 24px rgba(139,92,246,0.5))" }}
        />

        <h1
          className={`text-5xl font-bold italic tracking-[0.06em] transition-all duration-500 ${
            phase !== "founder" && phase !== "logo"
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            background: "linear-gradient(135deg, #a855f7, #8b5cf6, #d946ef, #f59e0b)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 24px rgba(168,85,247,0.4))",
          }}
        >
          Style
        </h1>

        <p
          className={`text-[11px] mt-2 tracking-widest uppercase transition-all duration-500 delay-200 ${
            phase === "text" || phase === "fade" ? "opacity-100" : "opacity-0"
          }`}
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          {APP_TAGLINE}
        </p>

        {/* v2.0.0 version badge */}
        <div
          className={`mt-4 transition-all duration-500 delay-300 ${
            phase === "text" || phase === "fade" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
          style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.15em",
            background: "linear-gradient(135deg, #8b5cf6, #d946ef)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "none",
            filter: "drop-shadow(0 0 6px rgba(139,92,246,0.6))",
          }}
        >
          v{APP_VERSION}
        </div>
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
      <div className="absolute bottom-6 w-20 h-[2px] rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #8b5cf6, #d946ef, #f59e0b)",
            animation: "splash-load 5.7s ease-in-out forwards",
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

