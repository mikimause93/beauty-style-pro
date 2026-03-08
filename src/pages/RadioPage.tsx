import MobileLayout from "@/components/layout/MobileLayout";
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, Share2, Radio as RadioIcon, Coins, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useRadioPlayer } from "@/hooks/useRadioPlayer";
import { useQRCoinRewards } from "@/hooks/useQRCoinRewards";
import { toast } from "sonner";
import beauty2 from "@/assets/beauty-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";

const coverImages = [beauty2, stylist1, stylist2, beauty3];

export default function RadioPage() {
  const { isPlaying, loading, error, currentStation, volume, toggle, nextStation, prevStation, play, changeVolume, stations } = useRadioPlayer();
  const [liked, setLiked] = useState(false);
  const { awardCoins } = useQRCoinRewards();

  const currentIdx = stations.findIndex(s => s.id === currentStation.id);
  const cover = coverImages[currentIdx % coverImages.length];

  const handleShare = async () => {
    const shareData = { title: currentStation.name, text: `Ascolta "${currentStation.name}" su STYLE Beauty! 🎵` };
    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        toast.info("Condividi: " + currentStation.name);
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") toast.info("Condividi: " + currentStation.name);
    }
    awardCoins("share");
  };

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
              <RadioIcon className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold">Beauty Radio</h1>
              <p className="text-[10px] text-muted-foreground">Streaming Live</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-accent/10 text-[10px] font-bold text-accent">
              <Coins className="w-3 h-3" /> +1 QRC/2min
            </span>
            <button onClick={() => changeVolume(volume > 0.5 ? 0.3 : 1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 py-6">
        {/* Now Playing */}
        <div className="rounded-3xl overflow-hidden gradient-card shadow-card border border-border p-6">
          <div className="relative mx-auto w-52 h-52 rounded-full overflow-hidden shadow-glow mb-6">
            <img src={cover} alt="In riproduzione"
              className={`w-full h-full object-cover ${isPlaying ? "animate-[spin_8s_linear_infinite]" : ""}`} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-background border-4 border-muted flex items-center justify-center">
                {loading ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : (
                  <div className="w-3 h-3 rounded-full gradient-primary" />
                )}
              </div>
            </div>
          </div>

          <div className="text-center mb-4">
            <h2 className="text-lg font-bold">{currentStation.name}</h2>
            <p className="text-sm text-muted-foreground">{currentStation.genre}</p>
            {isPlaying && (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-green-500/10 text-[10px] text-green-500 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE
              </span>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg p-2 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error} — Prova un'altra stazione</span>
            </div>
          )}

          {/* Volume slider */}
          <div className="flex items-center gap-3 mb-4 px-4">
            <Volume2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <input type="range" min="0" max="1" step="0.05" value={volume}
              onChange={e => changeVolume(parseFloat(e.target.value))}
              className="flex-1 h-1 accent-primary" />
          </div>

          <div className="flex items-center justify-center gap-8">
            <button onClick={prevStation}>
              <SkipBack className="w-6 h-6 text-muted-foreground" />
            </button>
            <button onClick={toggle} disabled={loading}
              className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-glow disabled:opacity-50">
              {loading ? (
                <Loader2 className="w-7 h-7 text-primary-foreground animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-7 h-7 text-primary-foreground" />
              ) : (
                <Play className="w-7 h-7 text-primary-foreground ml-1" />
              )}
            </button>
            <button onClick={nextStation}>
              <SkipForward className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-8 mt-4">
            <button onClick={() => setLiked(!liked)} className="flex flex-col items-center gap-1">
              <Heart className={`w-5 h-5 ${liked ? "text-primary fill-primary" : "text-muted-foreground"}`} />
              <span className="text-[10px] text-muted-foreground">Mi piace</span>
            </button>
            <button onClick={handleShare} className="flex flex-col items-center gap-1">
              <Share2 className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Condividi</span>
            </button>
          </div>
        </div>

        {/* Stations */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Stazioni Radio</h3>
          <div className="space-y-2">
            {stations.map((station, idx) => (
              <button key={station.id} onClick={() => play(station)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  currentStation.id === station.id ? "bg-primary/10 border border-primary/30" : "bg-card hover:bg-muted"
                }`}>
                <img src={coverImages[idx % coverImages.length]} alt="" className="w-12 h-12 rounded-xl object-cover" />
                <div className="flex-1 text-left">
                  <p className={`text-sm font-semibold ${currentStation.id === station.id ? "text-primary" : ""}`}>{station.name}</p>
                  <p className="text-[11px] text-muted-foreground">{station.genre}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{station.listener_count}</span>
                  {currentStation.id === station.id && isPlaying && (
                    <div className="flex items-center gap-0.5">
                      <div className="w-0.5 h-3 bg-primary rounded-full animate-pulse" />
                      <div className="w-0.5 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.1s" }} />
                      <div className="w-0.5 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
