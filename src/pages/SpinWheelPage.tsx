import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSpin } from "@/hooks/useData";
import { toast } from "sonner";

const spinPrizes = [
  { label: "10 QRC", type: "QR_COIN", value: 10, color: "#ef4444" },
  { label: "25 QRC", type: "QR_COIN", value: 25, color: "#f59e0b" },
  { label: "50 QRC", type: "QR_COIN", value: 50, color: "#10b981" },
  { label: "10%", type: "DISCOUNT", value: 10, color: "#3b82f6" },
  { label: "20%", type: "DISCOUNT", value: 20, color: "#8b5cf6" },
  { label: "100 QRC", type: "QR_COIN", value: 100, color: "#ec4899" },
  { label: "Free!", type: "FREE_SERVICE", value: 1, color: "#06b6d4" },
  { label: "5 QRC", type: "QR_COIN", value: 5, color: "#f97316" },
];

export default function SpinWheelPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const spinMutation = useSpin();
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);

  const handleSpin = async () => {
    if (isSpinning) return;
    if (!user) {
      toast.error("Accedi per girare la ruota");
      navigate("/auth");
      return;
    }

    setIsSpinning(true);
    setSpinResult(null);

    const prizeIndex = Math.floor(Math.random() * spinPrizes.length);
    const prize = spinPrizes[prizeIndex];
    const segmentAngle = 360 / spinPrizes.length;
    const targetAngle = 360 - (prizeIndex * segmentAngle + segmentAngle / 2);
    const totalRotation = rotation + 1800 + targetAngle;
    setRotation(totalRotation);

    setTimeout(async () => {
      setIsSpinning(false);
      setSpinResult(prize.label);

      try {
        await spinMutation.mutateAsync({
          userId: user.id,
          prizeType: prize.type,
          prizeValue: prize.value,
          prizeDescription: prize.label,
        });
        toast.success(`🎉 Hai vinto ${prize.label}!`);
      } catch {
        // Still show result even if save fails
      }
    }, 4000);
  };

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold">Spin & Win</h1>
        </div>
        <div className="flex items-center gap-1 px-3 py-1 rounded-full gradient-gold">
          <Coins className="w-3.5 h-3.5 text-gold-foreground" />
          <span className="text-xs font-bold text-gold-foreground">0714</span>
        </div>
      </header>

      <div className="flex flex-col items-center px-4 py-8">
        <p className="text-sm text-muted-foreground mb-6">Gira la ruota e vinci premi! 🎰</p>

        {/* Spin Wheel */}
        <div className="relative w-72 h-72 mb-8">
          {/* Arrow */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
            <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-gold" />
          </div>

          <div
            className="w-full h-full rounded-full border-4 border-gold overflow-hidden relative"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
            }}
          >
            {/* Conic gradient segments */}
            <div className="absolute inset-0 rounded-full" style={{
              background: `conic-gradient(${spinPrizes.map((p, i) => {
                const start = (i / spinPrizes.length) * 360;
                const end = ((i + 1) / spinPrizes.length) * 360;
                return `${p.color} ${start}deg ${end}deg`;
              }).join(", ")})`
            }} />

            {/* Prize labels */}
            {spinPrizes.map((prize, i) => {
              const angle = (360 / spinPrizes.length) * i + (360 / spinPrizes.length / 2);
              const rad = (angle * Math.PI) / 180;
              const x = 50 + 32 * Math.sin(rad);
              const y = 50 - 32 * Math.cos(rad);
              return (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                  }}
                >
                  <span className="text-[10px] font-bold text-primary-foreground whitespace-nowrap">
                    {prize.label}
                  </span>
                </div>
              );
            })}

            {/* Center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full gradient-card border-4 border-gold flex flex-col items-center justify-center z-10 shadow-lg">
                <span className="text-xs font-bold">SPIN</span>
                <span className="text-[10px] text-muted-foreground">0714</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className={`px-10 py-3.5 rounded-full text-lg font-bold transition-all ${
            isSpinning
              ? "bg-muted text-muted-foreground"
              : "gradient-primary text-primary-foreground shadow-glow hover:scale-105 active:scale-95"
          }`}
        >
          {isSpinning ? "Spinning..." : "Spin Now!"}
        </button>

        {spinResult && (
          <div className="mt-6 p-5 rounded-2xl gradient-gold text-center slide-up w-full max-w-xs">
            <p className="text-lg font-bold text-gold-foreground">🎉 Hai vinto!</p>
            <p className="text-3xl font-display font-bold text-gold-foreground">{spinResult}</p>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground mt-6 text-center px-8">
          Puoi girare la ruota una volta al giorno. Completa sfide per guadagnare giri extra! 🎯
        </p>
      </div>
    </MobileLayout>
  );
}
