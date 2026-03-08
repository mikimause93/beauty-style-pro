import { useState, useEffect } from "react";
import logoS from "@/assets/logo-s.png";

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"logo" | "text" | "fade">("logo");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("text"), 800);
    const t2 = setTimeout(() => setPhase("fade"), 2200);
    const t3 = setTimeout(onComplete, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center transition-opacity duration-600 ${phase === "fade" ? "opacity-0" : "opacity-100"}`}>
      {/* Logo S */}
      <img
        src={logoS}
        alt="S"
        className={`w-24 h-24 mb-6 transition-all duration-700 ${phase === "logo" ? "scale-90 opacity-0" : "scale-100 opacity-100"}`}
      />

      {/* STYLE text */}
      <h1 className={`text-3xl font-display font-light tracking-[0.3em] text-foreground transition-all duration-500 ${phase !== "logo" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        STYLE
      </h1>

      {/* Tagline */}
      <p className={`text-[11px] text-muted-foreground mt-2 tracking-widest uppercase transition-all duration-500 delay-200 ${phase === "text" || phase === "fade" ? "opacity-100" : "opacity-0"}`}>
        La piattaforma beauty
      </p>

      {/* Founder signature */}
      <p className={`absolute bottom-12 text-[10px] text-muted-foreground/40 italic tracking-wide transition-all duration-500 ${phase === "text" || phase === "fade" ? "opacity-100" : "opacity-0"}`}>
        Founded by Michele Peschechera
      </p>
    </div>
  );
}
