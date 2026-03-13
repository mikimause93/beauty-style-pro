import MobileLayout from "@/components/layout/MobileLayout";
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, Share2, Radio as RadioIcon, Coins, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { SpotifyIcon, YouTubeIcon, RadioTowerIcon } from "@/components/icons/BrandIcons";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRadio } from "@/contexts/RadioContext";
import { useQRCoinRewards } from "@/hooks/useQRCoinRewards";
import { toast } from "sonner";
import SpotifyEmbed from "@/components/radio/SpotifyEmbed";
import YouTubeEmbed from "@/components/radio/YouTubeEmbed";
import beauty2 from "@/assets/beauty-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";
import beauty1 from "@/assets/beauty-1.jpg";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";

const coverImages = [beauty2, stylist1, stylist2, beauty3, beauty1, beauty2, stylist1];

type MusicSource = "radio" | "spotify" | "youtube";

type RadioFilter = "all" | "italia" | "beauty";

export default function RadioPage() {
  const navigate = useNavigate();
  const { isPlaying, loading, error, currentStation, volume, toggle, nextStation, prevStation, play, changeVolume, stations } = useRadio();
  const [liked, setLiked] = useState(false);
  const [source, setSource] = useState<MusicSource>("radio");
  const [radioFilter, setRadioFilter] = useState<RadioFilter>("all");
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

  const sourceTabs: { key: MusicSource; label: string; color: string; icon: React.ReactNode }[] = [
    { key: "radio", label: "Radio", color: "text-primary", icon: <RadioTowerIcon className="w-4 h-4" /> },
    { key: "spotify", label: "Spotify", color: "text-[#1DB954]", icon: <SpotifyIcon className="w-4 h-4" /> },
    { key: "youtube", label: "YouTube", color: "text-[#FF0000]", icon: <YouTubeIcon className="w-4 h-4" /> },
  ];

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-foreground/10 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-display font-bold">Beauty Music</h1>
              <p className="text-[10px] text-muted-foreground">Radio · Spotify · YouTube</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-accent/10 text-[10px] font-bold text-accent">
              <Coins className="w-3 h-3" /> +1 QRC/2min
            </span>
          </div>
        </div>

        {/* Source Tabs */}
        <div className="flex gap-1 mt-3">
          {sourceTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setSource(tab.key)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                source === tab.key
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}>
              <span className={source === tab.key ? "" : tab.color}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-6">
        {/* ===== RADIO TAB ===== */}
        {source === "radio" && (
          <>
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
              
              {/* Filter tabs */}
              <div className="flex gap-1.5 mb-3 overflow-x-auto no-scrollbar">
                {([
                  { key: "all" as RadioFilter, label: "Tutte" },
                  { key: "italia" as RadioFilter, label: "🇮🇹 Nazionali" },
                  { key: "beauty" as RadioFilter, label: "✨ Salon & Beauty" },
                ]).map(f => (
                  <button
                    key={f.key}
                    onClick={() => setRadioFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                      radioFilter === f.key
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {stations
                  .filter(s => {
                    if (radioFilter === "italia") return s.genre.includes("🇮🇹");
                    if (radioFilter === "beauty") return s.genre.includes("✨");
                    return true;
                  })
                  .map((station, idx) => (
                  <button key={station.id} onClick={() => play(station)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      currentStation.id === station.id ? "bg-primary/10 border border-primary/30" : "bg-card hover:bg-muted"
                    }`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                      station.genre.includes("🇮🇹") ? "bg-green-500/10 text-green-600" : "bg-primary/10 text-primary"
                    }`}>
                      {station.name.slice(0, 2).toUpperCase()}
                    </div>
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
          </>
        )}

        {/* ===== SPOTIFY TAB ===== */}
        {source === "spotify" && (
          <div className="fade-in">
            <div className="flex items-center gap-2 mb-4">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#1DB954]">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              <div>
                <h2 className="text-base font-display font-bold">Spotify</h2>
                <p className="text-[10px] text-muted-foreground">Playlist integrate per il tuo salone</p>
              </div>
            </div>
            <SpotifyEmbed />
          </div>
        )}

        {/* ===== YOUTUBE TAB ===== */}
        {source === "youtube" && (
          <div className="fade-in">
            <div className="flex items-center gap-2 mb-4">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#FF0000]">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <div>
                <h2 className="text-base font-display font-bold">YouTube Music</h2>
                <p className="text-[10px] text-muted-foreground">Video musicali e playlist complete</p>
              </div>
            </div>
            <YouTubeEmbed />
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
