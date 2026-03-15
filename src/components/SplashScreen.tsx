import { useState, useEffect, useCallback } from "react";
import logoS from "@/assets/logo-s.png";

interface SplashScreenProps {
  onComplete: () => void;
}

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: 5 + (i * 5.5) % 90,
  delay: (i * 0.28) % 2.8,
  size: i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1.5,
  duration: 2.5 + (i % 5) * 0.4,
}));

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<"founder" | "logo" | "text" | "fade" | "done">("founder");

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  useEffect(() => {
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
      style={{ background: "radial-gradient(ellipse at 40% 30%, #0e0a18 0%, #060408 60%, #000 100%)" }}
    >
      {/* Ambient glow orbs */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "15%", left: "20%", width: 260, height: 260,
          background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
          animation: "splash-orb-a 6s ease-in-out infinite",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "20%", right: "15%", width: 200, height: 200,
          background: "radial-gradient(circle, rgba(249,168,37,0.10) 0%, transparent 70%)",
          filter: "blur(36px)",
          animation: "splash-orb-b 7s ease-in-out infinite",
        }}
      />

      {/* Floating diamond particles */}
      {(phase === "text" || phase === "fade") && PARTICLES.map(p => (
        <span
          key={p.id}
          className="absolute pointer-events-none"
          style={{
            left: `${p.left}%`,
            bottom: "8%",
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: p.id % 4 === 0
              ? "hsl(42 98% 70%)"
              : p.id % 4 === 1
              ? "hsl(263 85% 72%)"
              : p.id % 4 === 2
              ? "hsl(302 80% 68%)"
              : "hsl(220 10% 80%)",
            opacity: 0,
            boxShadow: `0 0 ${p.size * 3}px currentColor`,
            animation: `splash-particle ${p.duration}s ease-out ${p.delay}s infinite`,
          }}
        />
      ))}

      {/* Founder name — phase 1 */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center gap-4 transition-all duration-700 ${
          phase === "founder" ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <p
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.28em",
            fontSize: 10,
            textTransform: "uppercase",
          }}
        >
          Fondatore
        </p>
        <p
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 22,
            letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.88)",
            textAlign: "center",
          }}
        >
          Michele Peschechera
        </p>
        {/* thin gold line */}
        <div style={{ width: 48, height: 1, background: "linear-gradient(90deg, transparent, rgba(249,168,37,0.5), transparent)", margin: "4px auto" }} />
        <p
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontStyle: "italic",
            fontSize: 10,
            color: "rgba(255,255,255,0.22)",
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
        {/* Logo ring */}
        <div className="relative mb-6">
          {/* Rotating gradient ring */}
          <div
            style={{
              position: "absolute", inset: -6,
              borderRadius: "50%",
              background: "conic-gradient(from 0deg, transparent 60%, rgba(139,92,246,0.5) 75%, rgba(217,70,239,0.6) 85%, rgba(249,168,37,0.5) 95%, transparent)",
              animation: "splash-ring-spin 5s linear infinite",
              filter: "blur(2px)",
            }}
          />
          <img
            src={logoS}
            alt="STYLE Logo"
            className={`w-28 h-28 object-contain relative z-10 transition-all duration-700 ${
              phase === "logo" ? "scale-95 opacity-80" : "scale-100 opacity-100"
            }`}
            style={{ filter: "drop-shadow(0 0 20px rgba(139,92,246,0.4))" }}
          />
        </div>

        <h1
          className={`text-5xl font-bold italic tracking-[0.06em] transition-all duration-500 ${
            phase !== "founder" && phase !== "logo"
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            background: "linear-gradient(135deg, #c4b5fd, #a855f7, #d946ef, #f59e0b, #fcd34d)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 24px rgba(168,85,247,0.45))",
            letterSpacing: "0.06em",
          }}
        >
          Style
        </h1>

        <p
          className={`text-[11px] mt-2 tracking-[0.3em] uppercase transition-all duration-500 delay-200 ${
            phase === "text" || phase === "fade" ? "opacity-100" : "opacity-0"
          }`}
          style={{ color: "rgba(255,255,255,0.38)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
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
          color: "rgba(255,255,255,0.13)",
        }}
      >
        Founded by Michele Peschechera ®
      </p>

      {/* Premium loading bar */}
      <div className="absolute bottom-6 w-24 h-[2px] rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-full rounded-full relative overflow-hidden"
          style={{
            background: "linear-gradient(90deg, #a855f7, #d946ef, #f59e0b, #fcd34d)",
            animation: "splash-load 5.7s ease-in-out forwards",
          }}
        >
          {/* shimmer on bar */}
          <span
            style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)",
              animation: "splash-bar-shimmer 1.8s linear infinite",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes splash-load {
          0%   { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes splash-orb-a {
          0%, 100% { transform: translate(0,0) scale(1); opacity: 0.7; }
          50%       { transform: translate(20px,-20px) scale(1.15); opacity: 1; }
        }
        @keyframes splash-orb-b {
          0%, 100% { transform: translate(0,0) scale(1); opacity: 0.6; }
          50%       { transform: translate(-15px,15px) scale(1.2); opacity: 0.9; }
        }
        @keyframes splash-ring-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes splash-particle {
          0%   { opacity: 0;   transform: translateY(0) scale(0.5); }
          15%  { opacity: 0.9; }
          85%  { opacity: 0.7; }
          100% { opacity: 0;   transform: translateY(-120px) scale(1.2); }
        }
        @keyframes splash-bar-shimmer {
          from { transform: translateX(-100%); }
          to   { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}
