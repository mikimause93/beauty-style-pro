import { useState, useEffect } from "react";
import logoS from "@/assets/logo-s.png";

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"founder" | "logo" | "text" | "fade">("founder");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("logo"), 2500);
    const t2 = setTimeout(() => setPhase("text"), 3500);
    const t3 = setTimeout(() => setPhase("fade"), 5800);
    const t4 = setTimeout(onComplete, 6500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-700 ${phase === "fade" ? "opacity-0" : "opacity-100"}`}
      style={{ backgroundColor: "#000" }}
    >
      {/* Founder name — shows first 2.5s */}
      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${phase === "founder" ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <p
          className="text-white text-lg tracking-[0.15em] text-center"
          style={{ fontFamily: "'Playfair Display', 'Georgia', serif", fontStyle: "italic", fontWeight: 300 }}
        >
          Michele Peschechera
        </p>
      </div>

      {/* Logo + brand — after founder */}
      <div className={`flex flex-col items-center transition-all duration-700 ${phase !== "founder" ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}>
        <img
          src={logoS}
          alt="S"
          className={`w-24 h-24 mb-6 transition-all duration-700 ${phase === "logo" ? "scale-90 opacity-80" : "scale-100 opacity-100"}`}
        />

        <h1
          className={`text-3xl font-light tracking-[0.3em] text-white transition-all duration-500 ${phase !== "founder" && phase !== "logo" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}
        >
          STYLE
        </h1>

        <p className={`text-[11px] text-white/40 mt-2 tracking-widest uppercase transition-all duration-500 delay-200 ${phase === "text" || phase === "fade" ? "opacity-100" : "opacity-0"}`}>
          La piattaforma beauty
        </p>
      </div>

      {/* Founder signature at bottom */}
      <p className={`absolute bottom-12 text-[10px] text-white/20 italic tracking-wide transition-all duration-500 ${phase === "text" || phase === "fade" ? "opacity-100" : "opacity-0"}`}
        style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}
      >
        Founded by Michele Peschechera ®
      </p>
    </div>
  );
}
