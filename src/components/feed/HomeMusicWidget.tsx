import { useState } from "react";
import { Music, Play, Pause, SkipForward, Loader2, X, Search, Radio as RadioIcon } from "lucide-react";
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

  // YouTube state - always in-app embed
  const [youtubeQuery, setYoutubeQuery] = useState("");
  const [youtubeVideoId, setYoutubeVideoId] = useState("lFcSrYw-ARY");

  const currentIdx = stations.findIndex(s => s.id === currentStation.id);
  const cover = coverImages[currentIdx % coverImages.length];

  if (hidden) return null;

  // Search YouTube in-app by changing the embed to a search results embed
  const searchYouTubeInApp = () => {
    if (!youtubeQuery.trim()) return;
    // Use YouTube embed search - plays first result in-app
    const query = encodeURIComponent(youtubeQuery.trim());
    setYoutubeVideoId(`videoseries?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf&search_query=${query}`);
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
    { name: "Pop Hits", videoId: "kXYiU_JCYtU" },
    { name: "Chill", videoId: "5qap5aO4i9A" },
  ];

  const togglePanel = (panel: ActivePanel) => {
    setActivePanel(prev => prev === panel ? null : panel);
  };

  return (
    <div className="px-5 mb-3">
      <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
        {/* Compact header */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-1.5">
            <Music className="w-3 h-3 text-primary" />
            <h3 className="text-[10px] font-display font-bold">Music</h3>
          </div>
          <div className="flex items-center gap-1">
            {(["radio", "spotify", "youtube"] as ActivePanel[]).map(p => (
              <button key={p} onClick={() => togglePanel(p)}
                className={`px-2 py-0.5 rounded-full text-[9px] font-semibold transition-all ${activePanel === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {p === "radio" ? "📻" : p === "spotify" ? "🟢" : "▶️"}
              </button>
            ))}
            <button onClick={() => setHidden(true)} className="w-5 h-5 rounded-full flex items-center justify-center">
              <X className="w-2.5 h-2.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* No big platform buttons - just panels */}

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
            <iframe key={spotifyPlaylistId}
              src={`https://open.spotify.com/embed/playlist/${spotifyPlaylistId}?utm_source=generator&theme=0`}
              width="100%" height="280" frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy" className="rounded-xl" />

            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {spotifyPlaylists.map(pl => (
                <button key={pl.id}
                  onClick={() => setSpotifyPlaylistId(pl.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold whitespace-nowrap shrink-0 transition-all ${
                    spotifyPlaylistId === pl.id ? "bg-[hsl(141,73%,42%)] text-white" : "bg-[hsl(141,73%,42%)]/10 text-[hsl(141,73%,42%)]"
                  }`}>{pl.name}</button>
              ))}
            </div>
          </div>
        )}

        {/* ===== YOUTUBE PANEL — always in-app ===== */}
        {activePanel === "youtube" && (
          <div className="border-t border-border/30 px-4 py-3 space-y-2.5 animate-in slide-in-from-top-2 duration-200">
            {/* YouTube embed player - stays in-app */}
            <div className="rounded-xl overflow-hidden aspect-video">
              <iframe key={youtubeVideoId}
                src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=0&rel=0`}
                width="100%" height="100%" frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen loading="lazy" className="w-full h-full" />
            </div>

            {/* Quick select videos - all play in-app via embed */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {youtubeVideos.map(v => (
                <button key={v.videoId}
                  onClick={() => { setYoutubeVideoId(v.videoId); setYoutubeQuery(""); }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold whitespace-nowrap shrink-0 transition-all ${
                    youtubeVideoId === v.videoId ? "bg-[hsl(0,100%,50%)] text-white" : "bg-[hsl(0,100%,50%)]/10 text-[hsl(0,100%,50%)]"
                  }`}>{v.name}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
