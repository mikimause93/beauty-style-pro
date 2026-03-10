import { Music, Play, Pause, SkipForward, Loader2, ExternalLink } from "lucide-react";
import { useRadio } from "@/contexts/RadioContext";
import { useNavigate } from "react-router-dom";
import beauty2 from "@/assets/beauty-2.jpg";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";
import beauty1 from "@/assets/beauty-1.jpg";

const coverImages = [beauty2, stylist1, stylist2, beauty3, beauty1, beauty2, stylist1];

export default function HomeMusicWidget() {
  const { isPlaying, loading, currentStation, toggle, nextStation, play, stations } = useRadio();
  const navigate = useNavigate();

  const currentIdx = stations.findIndex(s => s.id === currentStation.id);
  const cover = coverImages[currentIdx % coverImages.length];

  return (
    <div className="px-5 mb-5">
      <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Music className="w-3.5 h-3.5 text-primary" />
            </div>
            <h3 className="text-sm font-display font-bold">Stayle Music</h3>
          </div>
          <button onClick={() => navigate("/radio")} className="text-[10px] text-primary font-semibold">
            Apri Radio →
          </button>
        </div>

        {/* Now playing bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5">
          <button onClick={() => navigate("/radio")} className="relative shrink-0">
            <img
              src={cover}
              alt=""
              className={`w-10 h-10 rounded-xl object-cover ${isPlaying ? "animate-[spin_8s_linear_infinite]" : ""}`}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-background/80 border border-muted" />
            </div>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{currentStation.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{currentStation.genre}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggle}
              disabled={loading}
              className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-glow disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 text-primary-foreground animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-3.5 h-3.5 text-primary-foreground" />
              ) : (
                <Play className="w-3.5 h-3.5 text-primary-foreground ml-0.5" />
              )}
            </button>
            <button
              onClick={nextStation}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            >
              <SkipForward className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Quick playlists */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
          {stations.slice(0, 5).map((station, idx) => {
            const isActive = isPlaying && currentStation.id === station.id;
            return (
              <button
                key={station.id}
                onClick={() => play(station)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl shrink-0 transition-all ${
                  isActive
                    ? "bg-primary/15 border border-primary/30"
                    : "bg-muted/50 border border-transparent hover:border-border"
                }`}
              >
                <img
                  src={coverImages[idx % coverImages.length]}
                  alt=""
                  className="w-7 h-7 rounded-lg object-cover"
                />
                <div className="text-left">
                  <p className={`text-[11px] font-medium leading-tight ${isActive ? "text-primary" : ""}`}>
                    {station.name}
                  </p>
                  <p className="text-[9px] text-muted-foreground leading-tight">{station.genre}</p>
                </div>
                {isActive && (
                  <div className="flex items-center gap-0.5 ml-1">
                    <div className="w-0.5 h-2.5 bg-primary rounded-full animate-pulse" />
                    <div className="w-0.5 h-3.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.1s" }} />
                    <div className="w-0.5 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* External links */}
        <div className="flex gap-2 px-4 pb-3">
          <a
            href="https://open.spotify.com/search/relax%20salon%20music"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1DB954]/10 text-[10px] font-semibold text-[#1DB954] hover:bg-[#1DB954]/20 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            Spotify
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <a
            href="https://www.youtube.com/results?search_query=salon+relax+music+playlist"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FF0000]/10 text-[10px] font-semibold text-[#FF0000] hover:bg-[#FF0000]/20 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            YouTube
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
