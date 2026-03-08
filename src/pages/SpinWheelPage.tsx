import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Coins, Volume2, VolumeX, Star, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MobileLayout from "@/components/layout/MobileLayout";
import { toast } from "sonner";

const spinPrizes = [
  { label: "10 QRC", type: "QR_COIN", value: 10, color: "#ef4444", probability: 0.25 },
  { label: "25 QRC", type: "QR_COIN", value: 25, color: "#f59e0b", probability: 0.20 },
  { label: "50 QRC", type: "QR_COIN", value: 50, color: "#10b981", probability: 0.15 },
  { label: "10%", type: "DISCOUNT", value: 10, color: "#3b82f6", probability: 0.15 },
  { label: "20%", type: "DISCOUNT", value: 20, color: "#8b5cf6", probability: 0.10 },
  { label: "100 QRC", type: "QR_COIN", value: 100, color: "#ec4899", probability: 0.05 },
  { label: "Free!", type: "FREE_SERVICE", value: 1, color: "#06b6d4", probability: 0.05 },
  { label: "5 QRC", type: "QR_COIN", value: 5, color: "#f97316", probability: 0.05 },
];

export default function SpinWheelPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<typeof spinPrizes[0] | null>(null);
  const [rotation, setRotation] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [spinsRemaining, setSpinsRemaining] = useState(3);
  const wheelRef = useRef<HTMLDivElement>(null);

  const qrCoins = profile?.qr_coins || 0;

  const selectPrize = (): typeof spinPrizes[0] => {
    const random = Math.random();
    let cumulative = 0;
    for (const prize of spinPrizes) {
      cumulative += prize.probability;
      if (random <= cumulative) return prize;
    }
    return spinPrizes[0];
  };

  const handleSpin = async () => {
    if (isSpinning) return;
    if (!user) {
      toast.error("Login to spin the wheel");
      navigate("/auth");
      return;
    }
    if (spinsRemaining <= 0) {
      toast.error("No spins remaining. Complete challenges for more!");
      return;
    }

    setIsSpinning(true);
    setSpinResult(null);
    setSpinsRemaining(prev => prev - 1);

    const prize = selectPrize();
    const prizeIndex = spinPrizes.indexOf(prize);
    const segmentAngle = 360 / spinPrizes.length;
    const targetAngle = 360 - (prizeIndex * segmentAngle + segmentAngle / 2);
    const totalRotation = rotation + 2160 + targetAngle; // 6 full spins + target
    
    setRotation(totalRotation);

    setTimeout(async () => {
      setIsSpinning(false);
      setSpinResult(prize);

      // Save result and credit wallet
      try {
        await supabase.from('spin_results').insert({
          user_id: user.id,
          prize_type: prize.type,
          prize_value: prize.value,
          prize_description: prize.label,
        });

        if (prize.type === 'QR_COIN') {
          await supabase
            .from('profiles')
            .update({ qr_coins: qrCoins + prize.value })
            .eq('user_id', user.id);
        }

        toast.success(`🎉 You won ${prize.label}!`);
      } catch (error) {
        console.error('Error saving spin result:', error);
      }
    }, 4500);
  };

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-display font-bold">Spin & Win</h1>
            <p className="text-xs text-muted-foreground">{spinsRemaining} spins remaining</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full gradient-gold">
            <Coins className="w-4 h-4 text-gold-foreground" />
            <span className="text-sm font-bold text-gold-foreground">{qrCoins.toLocaleString()}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-col items-center px-4 py-6 min-h-[calc(100vh-180px)]">
        {/* Decorative stars */}
        <div className="absolute top-20 left-4 text-2xl animate-pulse">⭐</div>
        <div className="absolute top-32 right-8 text-xl animate-pulse delay-75">✨</div>
        <div className="absolute top-48 left-8 text-lg animate-pulse delay-150">🌟</div>

        <p className="text-center text-muted-foreground mb-6 max-w-xs">
          Spin the wheel to win <span className="text-gold font-semibold">QRCoins</span>, 
          discounts and free services!
        </p>

        {/* Spin Wheel Container */}
        <div className="relative w-80 h-80 mb-8">
          {/* Outer glow */}
          <div className="absolute inset-0 rounded-full bg-gold/20 blur-2xl" />
          
          {/* Arrow pointer */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-30">
            <div className="w-0 h-0 border-l-[16px] border-r-[16px] border-t-[28px] border-l-transparent border-r-transparent border-t-gold drop-shadow-lg" />
          </div>

          {/* Wheel */}
          <div
            ref={wheelRef}
            className="w-full h-full rounded-full border-[6px] border-gold overflow-hidden relative shadow-2xl"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning 
                ? "transform 4.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)" 
                : "none",
            }}
          >
            {/* Conic gradient segments */}
            <div 
              className="absolute inset-0 rounded-full" 
              style={{
                background: `conic-gradient(${spinPrizes.map((p, i) => {
                  const start = (i / spinPrizes.length) * 360;
                  const end = ((i + 1) / spinPrizes.length) * 360;
                  return `${p.color} ${start}deg ${end}deg`;
                }).join(", ")})`
              }} 
            />

            {/* Segment borders */}
            {spinPrizes.map((_, i) => {
              const angle = (360 / spinPrizes.length) * i;
              return (
                <div
                  key={i}
                  className="absolute w-full h-0.5 bg-background/30 origin-left top-1/2"
                  style={{
                    transform: `rotate(${angle}deg)`,
                    width: '50%',
                    left: '50%'
                  }}
                />
              );
            })}

            {/* Prize labels */}
            {spinPrizes.map((prize, i) => {
              const angle = (360 / spinPrizes.length) * i + (360 / spinPrizes.length / 2);
              const rad = (angle * Math.PI) / 180;
              const x = 50 + 34 * Math.sin(rad);
              const y = 50 - 34 * Math.cos(rad);
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
                  <span className="text-xs font-bold text-white drop-shadow-lg whitespace-nowrap">
                    {prize.label}
                  </span>
                </div>
              );
            })}

            {/* Center button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-card to-muted border-4 border-gold flex flex-col items-center justify-center z-10 shadow-xl">
                <Sparkles className="w-5 h-5 text-gold mb-1" />
                <span className="text-sm font-bold">SPIN</span>
                <span className="text-[10px] text-muted-foreground">{spinsRemaining} left</span>
              </div>
            </div>
          </div>

          {/* Wheel lights */}
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (360 / 16) * i;
            const rad = (angle * Math.PI) / 180;
            const x = 50 + 48 * Math.sin(rad);
            const y = 50 - 48 * Math.cos(rad);
            return (
              <div
                key={i}
                className={`absolute w-3 h-3 rounded-full ${
                  isSpinning 
                    ? i % 2 === 0 ? 'bg-gold animate-pulse' : 'bg-primary animate-pulse delay-75'
                    : 'bg-muted-foreground/30'
                }`}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            );
          })}
        </div>

        {/* Spin Button */}
        <button
          onClick={handleSpin}
          disabled={isSpinning || spinsRemaining <= 0}
          className={`px-12 py-4 rounded-full text-lg font-bold transition-all ${
            isSpinning || spinsRemaining <= 0
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "gradient-primary text-primary-foreground shadow-glow hover:scale-105 active:scale-95"
          }`}
        >
          {isSpinning ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Spinning...
            </span>
          ) : spinsRemaining <= 0 ? (
            "No Spins Left"
          ) : (
            "Spin Now!"
          )}
        </button>

        {/* Result Modal */}
        {spinResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSpinResult(null)} />
            <div className="relative w-full max-w-sm rounded-3xl gradient-card border border-gold/30 p-8 text-center slide-up shadow-2xl">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center shadow-lg">
                  <Star className="w-6 h-6 text-gold-foreground fill-gold-foreground" />
                </div>
              </div>
              
              <p className="text-lg font-semibold mt-4 mb-2">🎉 Congratulations!</p>
              <p className="text-muted-foreground text-sm mb-4">You won</p>
              
              <div className="py-4 px-6 rounded-2xl gradient-gold mb-6">
                <p className="text-4xl font-display font-bold text-gold-foreground">
                  {spinResult.label}
                </p>
                <p className="text-sm text-gold-foreground/70 mt-1">
                  {spinResult.type === 'QR_COIN' && 'Added to your wallet'}
                  {spinResult.type === 'DISCOUNT' && 'Use on your next booking'}
                  {spinResult.type === 'FREE_SERVICE' && 'Redeem any service'}
                </p>
              </div>
              
              <button 
                onClick={() => setSpinResult(null)}
                className="w-full py-3 rounded-xl bg-muted text-foreground font-semibold hover:bg-muted/80 transition-colors"
              >
                {spinsRemaining > 0 ? 'Spin Again' : 'Done'}
              </button>
            </div>
          </div>
        )}

        {/* Info */}
        <p className="text-[11px] text-muted-foreground mt-6 text-center px-8 leading-relaxed">
          🎯 Complete challenges to earn more spins<br/>
          Prizes are credited instantly to your wallet
        </p>
      </div>
    </MobileLayout>
  );
}
