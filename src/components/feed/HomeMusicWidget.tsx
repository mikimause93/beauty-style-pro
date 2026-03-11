import { useState } from "react";
import { Music, Play, Pause, SkipForward, Loader2, X, Search, ExternalLink, Radio as RadioIcon } from "lucide-react";
import { useRadio } from "@/contexts/RadioContext";
import { useNavigate } from "react-router-dom";
import beauty2 from "@/assets/beauty-2.jpg";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";
import beauty1 from "@/assets/beauty-1.jpg";

const coverImages = [beauty2, stylist1, stylist2, beauty3, beauty1, beauty2, stylist1];

type ActivePanel = null | "radio" | "spotify" | "youtube";

export default function HomeMusicWidget() {
  const { isPlaying, loading, currentStation, toggle, nextStation, play, stations, error } = useRadio();
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

  // Spotify state
  const [spotifyQuery, setSpotifyQuery] = useState("");
  const [spotifyPlaylistId, setSpotifyPlaylistId] = useState("37i9dQZF1DX4sWSpwq3LiO");

  // YouTube state
  const [youtubeQuery, setYoutubeQuery] = useState("");
  const [youtubeVideoId, setYoutubeVideoId] = useState("lFcSrYw-ARY");

  const currentIdx = stations.findIndex(s => s.id === currentStation.id);
  const cover = coverImages[currentIdx % coverImages.length];

  if (hidden) return null;

  const searchSpotify = () => {
    if (!spotifyQuery.trim()) return;
    window.open(`https://open.spotify.com/search/${encodeURIComponent(spotifyQuery.trim())}`, "_blank");
  };

  const searchYouTube = () => {
    if (!youtubeQuery.trim()) return;
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeQuery.trim())}`, "_blank");
  };

  const spotifyPlaylists = [
    { name: "Peaceful Piano", id: "37i9dQZF1DX4sWSpwq3LiO" },
    { name: "Spa & Relax", id: "37i9dQZF1DX3PIPIT6lEg5" },
    { name: "Chill Hits", id: "37i9dQZF1DX0SM0LYsmbMT" },
    { name: "Italian Hits", id: "37i9dQZF1DX2ENAPP1Tyed" },
    { name: "Pop Mix", id: "37i9dQZF1EQncLwOalG3K7" },
  ];

  const youtubeVideos = [
    { name: "Relaxing", videoId: "lFcSrYw-ARY" },
    { name: "Lofi Beats", videoId: "jfKfPfyJRdk" },
    { name: "Piano", videoId: "BjFWk0ncr70" },
    { name: "Jazz", videoId: "Dx5qFachd3A" },
  ];

  const togglePanel = (panel: ActivePanel) => {
    setActivePanel(prev => prev === panel ? null : panel);
  };

  return (
    <div className="px-5 mb-5">
      <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
        {/* Header con X */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Music className="w-3 h-3 text-primary" />
            </div>
            <h3 className="text-xs font-display font-bold">Stayle Music</h3>
          </div>
          <button onClick={() => setHidden(true)} className="w-6 h-6 rounded-full bg-muted/60 flex items-center justify-center">
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>

        {/* 3 Platform Buttons */}
        <div className="flex gap-2 px-4 py-3">
          {/* Radio */}
          <button
            onClick={() => togglePanel("radio")}
            className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all border ${
              activePanel === "radio"
                ? "bg-primary/15 border-primary/40 shadow-sm"
                : "bg-muted/40 border-transparent hover:bg-muted/70"
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              activePanel === "radio" ? "bg-primary/20" : "bg-primary/10"
            }`}>
              <RadioIcon className="w-5 h-5 text-primary" />
            </div>
            <span className={`text-[10px] font-bold ${activePanel === "radio" ? "text-primary" : "text-muted-foreground"}`}>
              Radio
            </span>
            {isPlaying && activePanel !== "radio" && (
              <div className="flex items-center gap-0.5">
                <div className="w-0.5 h-2 bg-primary rounded-full animate-pulse" />
                <div className="w-0.5 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.1s" }} />
                <div className="w-0.5 h-1.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
              </div>
            )}
          </button>

          {/* Spotify */}
          <button
            onClick={() => togglePanel("spotify")}
            className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all border ${
              activePanel === "spotify"
                ? "bg-[#1DB954]/10 border-[#1DB954]/40 shadow-sm"
                : "bg-muted/40 border-transparent hover:bg-muted/70"
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              activePanel === "spotify" ? "bg-[#1DB954]/20" : "bg-[#1DB954]/10"
            }`}>
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#1DB954]">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </div>
            <span className={`text-[10px] font-bold ${activePanel === "spotify" ? "text-[#1DB954]" : "text-muted-foreground"}`}>
              Spotify
            </span>
          </button>

          {/* YouTube */}
          <button
            onClick={() => togglePanel("youtube")}
            className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all border ${
              activePanel === "youtube"
                ? "bg-[#FF0000]/10 border-[#FF0000]/40 shadow-sm"
                : "bg-muted/40 border-transparent hover:bg-muted/70"
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              activePanel === "youtube" ? "bg-[#FF0000]/20" : "bg-[#FF0000]/10"
            }`}>
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#FF0000]">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>
            <span className={`text-[10px] font-bold ${activePanel === "youtube" ? "text-[#FF0000]" : "text-muted-foreground"}`}>
              YouTube
            </span>
          </button>
        </div>

        {/* ===== RADIO PANEL ===== */}
        {activePanel === "radio" && (
          <div className="border-t border-border/30 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5">
              <button onClick={() => navigate("/radio")} className="relative shrink-0">
                <img src={cover} alt=""
                  className={`w-10 h-10 rounded-xl object-cover ${isPlaying ? "animate-[spin_8s_linear_infinite]" : ""}`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-background/80 border border-muted" />
                </div>
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{currentStation.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {error ? <span className="text-destructive">{error}</span> : currentStation.genre}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={toggle} disabled={loading}
                  className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-glow disabled:opacity-50">
                  {loading ? <Loader2 className="w-3.5 h-3.5 text-primary-foreground animate-spin" />
                    : isPlaying ? <Pause className="w-3.5 h-3.5 text-primary-foreground" />
                    : <Play className="w-3.5 h-3.5 text-primary-foreground ml-0.5" />}
                </button>
                <button onClick={nextStation} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
                  <SkipForward className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
            <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
              {stations.slice(0, 6).map((station, idx) => {
                const isActive = isPlaying && currentStation.id === station.id;
                return (
                  <button key={station.id} onClick={() => play(station)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl shrink-0 transition-all ${
                      isActive ? "bg-primary/15 border border-primary/30" : "bg-muted/50 border border-transparent hover:border-border"
                    }`}>
                    <img src={coverImages[idx % coverImages.length]} alt="" className="w-7 h-7 rounded-lg object-cover" />
                    <p className={`text-[11px] font-medium leading-tight whitespace-nowrap ${isActive ? "text-primary" : ""}`}>
                      {station.name}
                    </p>
                  </button>
                );
              })}
            </div>
            <div className="px-4 pb-3">
              <button onClick={() => navigate("/radio")} className="w-full py-2 rounded-xl bg-primary/10 text-[11px] font-semibold text-primary">
                Vedi tutte le stazioni →
              </button>
            </div>
          </div>
        )}

        {/* ===== SPOTIFY PANEL ===== */}
        {activePanel === "spotify" && (
          <div className="border-t border-border/30 px-4 py-3 space-y-2.5 animate-in slide-in-from-top-2 duration-200">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input value={spotifyQuery} onChange={e => setSpotifyQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && searchSpotify()}
                  placeholder="Cerca su Spotify..."
                  className="w-full h-8 pl-8 pr-3 rounded-lg bg-muted text-xs focus:outline-none focus:ring-1 focus:ring-[#1DB954]/50" />
              </div>
              <button onClick={searchSpotify} className="h-8 px-3 rounded-lg bg-[#1DB954] text-white text-[10px] font-bold shrink-0">
                Cerca
              </button>
            </div>

            {spotifyQuery && (
              <a href={`https://open.spotify.com/search/${encodeURIComponent(spotifyQuery)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#1DB954]/10 text-[10px] font-semibold text-[#1DB954]">
                <ExternalLink className="w-3 h-3" /> Apri "{spotifyQuery}" su Spotify
              </a>
            )}

            <iframe key={spotifyPlaylistId}
              src={`https://open.spotify.com/embed/playlist/${spotifyPlaylistId}?utm_source=generator&theme=0`}
              width="100%" height="280" frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy" className="rounded-xl" />

            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {spotifyPlaylists.map(pl => (
                <button key={pl.id}
                  onClick={() => { setSpotifyPlaylistId(pl.id); setSpotifyQuery(""); }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold whitespace-nowrap shrink-0 transition-all ${
                    spotifyPlaylistId === pl.id ? "bg-[#1DB954] text-white" : "bg-[#1DB954]/10 text-[#1DB954]"
                  }`}>{pl.name}</button>
              ))}
            </div>
          </div>
        )}

        {/* ===== YOUTUBE PANEL ===== */}
        {activePanel === "youtube" && (
          <div className="border-t border-border/30 px-4 py-3 space-y-2.5 animate-in slide-in-from-top-2 duration-200">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input value={youtubeQuery} onChange={e => setYoutubeQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && searchYouTube()}
                  placeholder="Cerca su YouTube..."
                  className="w-full h-8 pl-8 pr-3 rounded-lg bg-muted text-xs focus:outline-none focus:ring-1 focus:ring-[#FF0000]/50" />
              </div>
              <button onClick={searchYouTube} className="h-8 px-3 rounded-lg bg-[#FF0000] text-white text-[10px] font-bold shrink-0">
                Cerca
              </button>
            </div>

            {youtubeQuery && (
              <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeQuery)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#FF0000]/10 text-[10px] font-semibold text-[#FF0000]">
                <ExternalLink className="w-3 h-3" /> Apri "{youtubeQuery}" su YouTube
              </a>
            )}

            <div className="rounded-xl overflow-hidden aspect-video">
              <iframe key={youtubeVideoId}
                src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=0&rel=0`}
                width="100%" height="100%" frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen loading="lazy" className="w-full h-full" />
            </div>

            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {youtubeVideos.map(v => (
                <button key={v.videoId}
                  onClick={() => { setYoutubeVideoId(v.videoId); setYoutubeQuery(""); }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold whitespace-nowrap shrink-0 transition-all ${
                    youtubeVideoId === v.videoId ? "bg-[#FF0000] text-white" : "bg-[#FF0000]/10 text-[#FF0000]"
                  }`}>{v.name}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
