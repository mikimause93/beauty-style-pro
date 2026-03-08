import MobileLayout from "@/components/layout/MobileLayout";
import { ShoppingBag, Coins, ChevronRight, Gift, Trophy, Star, Zap } from "lucide-react";
import { useState } from "react";
import beauty1 from "@/assets/beauty-1.jpg";
import beauty2 from "@/assets/beauty-2.jpg";
import stylist1 from "@/assets/stylist-1.jpg";

const categories = [
  { name: "Hair Care", count: 24, tag: "Hot" },
  { name: "Skincare", count: 18, tag: null },
  { name: "Makeup", count: 32, tag: "New" },
  { name: "Tools", count: 15, tag: null },
];

const products = [
  { id: 1, name: "Olio Ristrutturante", price: 34.99, image: beauty1, rating: 4.8 },
  { id: 2, name: "Maschera Idratante", price: 28.50, image: beauty2, rating: 4.6 },
  { id: 3, name: "Siero Luminosità", price: 42.00, image: stylist1, rating: 4.9 },
];

const challenges = [
  { id: 1, title: "Consumo Smart", desc: "5 bookings questo mese", progress: 3, target: 5, reward: 50, icon: "🎯" },
  { id: 2, title: "Social Star", desc: "Condividi 10 post", progress: 7, target: 10, reward: 30, icon: "⭐" },
  { id: 3, title: "Referral Master", desc: "Invita 3 amici", progress: 1, target: 3, reward: 100, icon: "👥" },
];

const leaderboard = [
  { rank: 1, name: "Pru Stylers", score: 3100, avatar: stylist1, badge: "🥇" },
  { rank: 2, name: "Stizzi Saies", score: 2800, avatar: beauty2, badge: "🥈" },
  { rank: 3, name: "Enny Lomi", score: 2300, avatar: beauty1, badge: "🥉" },
  { rank: 4, name: "True Font Score", score: 2100, avatar: stylist1, badge: "" },
];

const spinPrizes = [
  "10 QRC", "25 QRC", "50 QRC", "10%", "20%", "100 QRC", "Free!", "5 QRC"
];

export default function ShopPage() {
  const [activeSection, setActiveSection] = useState<"shop" | "challenges" | "spin">("shop");
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<string | null>(null);
  const [qrCoins, setQrCoins] = useState(3450);

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setSpinResult(null);
    const degrees = 1800 + Math.random() * 360;
    setTimeout(() => {
      setIsSpinning(false);
      const prize = spinPrizes[Math.floor(Math.random() * spinPrizes.length)];
      setSpinResult(prize);
    }, 4000);
  };

  const sections = [
    { key: "shop" as const, label: "Shop", icon: ShoppingBag },
    { key: "challenges" as const, label: "Challenges", icon: Trophy },
    { key: "spin" as const, label: "Spin & Win", icon: Gift },
  ];

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-display font-bold text-gradient-primary">Stayle</h1>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full gradient-gold">
            <Coins className="w-4 h-4 text-gold-foreground" />
            <span className="text-sm font-bold text-gold-foreground">{qrCoins.toLocaleString()}</span>
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex gap-2 mt-3">
          {sections.map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeSection === s.key
                    ? "gradient-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {s.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="p-4">
        {activeSection === "shop" && (
          <div className="space-y-4 fade-in">
            {/* QR Coins */}
            <div className="rounded-2xl gradient-card border border-border p-4 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-muted-foreground">I tuoi QR Coins</p>
                  <p className="text-3xl font-bold text-gradient-gold">{qrCoins.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center text-2xl">
                  💰
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded-xl bg-success/20 text-success text-xs font-semibold">
                  Earn QRCoins
                </button>
                <button className="flex-1 py-2 rounded-xl bg-primary/20 text-primary text-xs font-semibold">
                  Spend QRCoins
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              {categories.map(cat => (
                <button key={cat.name} className="w-full flex items-center justify-between p-3 rounded-xl bg-card hover:bg-muted transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{cat.name}</span>
                    {cat.tag && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        cat.tag === "Hot" ? "bg-live/20 text-live" : "bg-primary/20 text-primary"
                      }`}>
                        {cat.tag}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{cat.count}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>

            {/* Products */}
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Prodotti</h3>
            <div className="grid grid-cols-2 gap-3">
              {products.map(product => (
                <div key={product.id} className="rounded-xl bg-card overflow-hidden shadow-card">
                  <img src={product.image} alt={product.name} className="w-full aspect-square object-cover" />
                  <div className="p-3">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-bold text-primary">€{product.price}</span>
                      <span className="text-xs text-gold flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-gold" /> {product.rating}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "challenges" && (
          <div className="space-y-4 fade-in">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Challenges & Leaderboard
            </h3>

            {/* Challenges */}
            {challenges.map(ch => (
              <div key={ch.id} className="rounded-xl bg-card p-4 shadow-card">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{ch.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{ch.title}</p>
                    <p className="text-xs text-muted-foreground">{ch.desc}</p>
                    <div className="mt-2 w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full gradient-primary transition-all"
                        style={{ width: `${(ch.progress / ch.target) * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">{ch.progress}/{ch.target}</span>
                      <span className="text-[10px] text-gold font-semibold">+{ch.reward} QRC</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Leaderboard */}
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-6">
              Top Stylers
            </h3>
            <div className="space-y-2">
              {leaderboard.map(entry => (
                <div key={entry.rank} className={`flex items-center gap-3 p-3 rounded-xl ${
                  entry.rank <= 3 ? "bg-card border border-gold/20" : "bg-card"
                } shadow-card`}>
                  <span className="text-lg w-8 text-center">{entry.badge || `#${entry.rank}`}</span>
                  <img src={entry.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{entry.name}</p>
                    <p className="text-xs text-muted-foreground">Score</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-gold" />
                    <span className="text-sm font-bold">{entry.score.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "spin" && (
          <div className="flex flex-col items-center py-8 fade-in">
            <h2 className="text-2xl font-display font-bold mb-2">Spin & Win</h2>
            <p className="text-sm text-muted-foreground mb-8">Gira la ruota e vinci premi!</p>

            {/* Spin Wheel */}
            <div className="relative w-64 h-64 mb-8">
              <div
                className={`w-full h-full rounded-full border-4 border-gold overflow-hidden relative ${
                  isSpinning ? "spin-wheel" : ""
                }`}
                style={isSpinning ? { ["--spin-degrees" as any]: `${1800 + Math.random() * 360}deg` } : {}}
              >
                {spinPrizes.map((prize, i) => {
                  const angle = (360 / spinPrizes.length) * i;
                  const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];
                  return (
                    <div
                      key={i}
                      className="absolute inset-0 flex items-center justify-end pr-4"
                      style={{
                        transform: `rotate(${angle}deg)`,
                        clipPath: `polygon(50% 50%, 100% 0%, 100% ${100 / spinPrizes.length}%)`,
                      }}
                    >
                      <span className="text-[10px] font-bold text-primary-foreground rotate-90">{prize}</span>
                    </div>
                  );
                })}
                {/* Simple colored sections */}
                <div className="absolute inset-0 rounded-full" style={{
                  background: `conic-gradient(
                    #ef4444 0deg 45deg,
                    #f59e0b 45deg 90deg,
                    #10b981 90deg 135deg,
                    #3b82f6 135deg 180deg,
                    #8b5cf6 180deg 225deg,
                    #ec4899 225deg 270deg,
                    #06b6d4 270deg 315deg,
                    #f97316 315deg 360deg
                  )`
                }} />
                {/* Prize labels */}
                {spinPrizes.map((prize, i) => {
                  const angle = (360 / spinPrizes.length) * i + (360 / spinPrizes.length / 2);
                  return (
                    <div
                      key={i}
                      className="absolute"
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: `rotate(${angle}deg) translateY(-80px)`,
                        transformOrigin: '0 0',
                      }}
                    >
                      <span className="text-[9px] font-bold text-primary-foreground" style={{ transform: `rotate(${90}deg)`, display: 'block' }}>
                        {prize}
                      </span>
                    </div>
                  );
                })}
                {/* Center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full gradient-card border-4 border-gold flex items-center justify-center z-10">
                    <span className="text-xs font-bold">SPIN</span>
                  </div>
                </div>
              </div>
              {/* Arrow */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
                <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-gold" />
              </div>
            </div>

            <button
              onClick={handleSpin}
              disabled={isSpinning}
              className={`px-8 py-3 rounded-full text-lg font-bold transition-all ${
                isSpinning
                  ? "bg-muted text-muted-foreground"
                  : "gradient-primary text-primary-foreground shadow-glow hover:scale-105"
              }`}
            >
              {isSpinning ? "Spinning..." : "Spin Now!"}
            </button>

            {spinResult && (
              <div className="mt-6 p-4 rounded-2xl gradient-gold text-center slide-up">
                <p className="text-lg font-bold text-gold-foreground">🎉 Hai vinto!</p>
                <p className="text-2xl font-display font-bold text-gold-foreground">{spinResult}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
