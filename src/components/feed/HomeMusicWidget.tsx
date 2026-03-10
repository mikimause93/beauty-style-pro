import { useState } from "react";
import { Music, Play, Pause, SkipForward, Loader2, X, Search } from "lucide-react";
import { useRadio } from "@/contexts/RadioContext";
import { useNavigate } from "react-router-dom";
import beauty2 from "@/assets/beauty-2.jpg";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";
import beauty1 from "@/assets/beauty-1.jpg";

const coverImages = [beauty2, stylist1, stylist2, beauty3, beauty1, beauty2, stylist1];

type SourceTab = "radio" | "spotify" | "youtube";

export default function HomeMusicWidget() {
  const { isPlaying, loading, currentStation, toggle, nextStation, play, stations, error } = useRadio();
  const navigate = useNavigate();
  const [source, setSource] = useState<SourceTab>("radio");
  const [hidden, setHidden] = useState(false);
  const [spotifyQuery, setSpotifyQuery] = useState("");
  const [youtubeQuery, setYoutubeQuery] = useState("");
  const [spotifyEmbed, setSpotifyEmbed] = useState("https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO?utm_source=generator&theme=0");
  const [youtubeEmbed, setYoutubeEmbed] = useState("https://www.youtube.com/embed/videoseries?list=PLMWjhejkSIMpGNUfMIBGbrkiRMIJSn1cD");

  const currentIdx = stations.findIndex(s => s.id === currentStation.id);
  const cover = coverImages[currentIdx % coverImages.length];

  if (hidden) return null;

  const searchSpotify = () => {
    if (!spotifyQuery.trim()) return;
    // Use Spotify's search embed - opens search results inside the embed
    const encoded = encodeURIComponent(spotifyQuery.trim());
    setSpotifyEmbed(`https://open.spotify.com/embed/search/${encoded}?utm_source=generator&theme=0`);
  };

  const searchYouTube = () => {
    if (!youtubeQuery.trim()) return;
    const encoded = encodeURIComponent(youtubeQuery.trim());
    setYoutubeEmbed(`https://www.youtube.com/embed?listType=search&list=${encoded}&autoplay=0`);
  };

  const spotifyPlaylists = [
    { name: "Peaceful Piano", id: "37i9dQZF1DX4sWSpwq3LiO" },
    { name: "Spa & Relax", id: "37i9dQZF1DX3PIPIT6lEg5" },
    { name: "Chill Hits", id: "37i9dQZF1DX0SM0LYsmbMT" },
    { name: "Italian Hits", id: "37i9dQZF1DX2ENAPP1Tyed" },
    { name: "Pop Mix", id: "37i9dQZF1EQncLwOalG3K7" },
  ];

  const youtubePlaylistIds = [
    { name: "Salon Relax", id: "PLDfKAXSi6kOaiaFt8vMiJJMLNBeqaSMP8" },
    { name: "Lofi Beats", id: "PLOzDu-MXXLliO9fBNZOQTBDddoA3FzZUo" },
    { name: "Piano Music", id: "PLMIbGomroEscpWKsxpCY7LtZMBkMb7Riv" },
    { name: "Italian Pop", id: "PLcfQmtiAG0X-fmM85dPlql5wfYbmFumzQ" },
  ];

  const sourceTabs: { key: SourceTab; label: string; icon: React.ReactNode }[] = [
    { key: "radio", label: "Radio", icon: <Music className="w-3 h-3" /> },
    {
      key: "spotify",
      label: "Spotify",
      icon: (
        <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
      ),
    },
    {
      key: "youtube",
      label: "YouTube",
      icon: (
        <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
    },
  ];

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
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/radio")} className="text-[10px] text-primary font-semibold">
              Apri →
            </button>
            <button onClick={() => setHidden(true)} className="w-6 h-6 rounded-full bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Source toggle */}
        <div className="flex gap-1 px-4 pb-2">
          {sourceTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setSource(tab.key)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                source === tab.key
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===== RADIO ===== */}
        {source === "radio" && (
          <>
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
                <p className="text-[10px] text-muted-foreground truncate">
                  {error ? <span className="text-destructive">{error}</span> : currentStation.genre}
                </p>
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

            {/* Station list */}
            <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
              {stations.slice(0, 6).map((station, idx) => {
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
                    <img src={coverImages[idx % coverImages.length]} alt="" className="w-7 h-7 rounded-lg object-cover" />
                    <p className={`text-[11px] font-medium leading-tight whitespace-nowrap ${isActive ? "text-primary" : ""}`}>
                      {station.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ===== SPOTIFY ===== */}
        {source === "spotify" && (
          <div className="px-4 py-3 space-y-2.5">
            {/* Search bar */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={spotifyQuery}
                  onChange={e => setSpotifyQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && searchSpotify()}
                  placeholder="Cerca musica su Spotify..."
                  className="w-full h-8 pl-8 pr-3 rounded-lg bg-muted text-xs focus:outline-none focus:ring-1 focus:ring-[#1DB954]/50"
                />
              </div>
              <button
                onClick={searchSpotify}
                className="h-8 px-3 rounded-lg bg-[#1DB954] text-white text-[10px] font-bold shrink-0"
              >
                Cerca
              </button>
            </div>

            {/* Spotify embed */}
            <iframe
              key={spotifyEmbed}
              src={spotifyEmbed}
              width="100%"
              height="352"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-xl"
            />

            {/* Quick playlists */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {spotifyPlaylists.map(pl => (
                <button
                  key={pl.id}
                  onClick={() => {
                    setSpotifyEmbed(`https://open.spotify.com/embed/playlist/${pl.id}?utm_source=generator&theme=0`);
                    setSpotifyQuery("");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#1DB954]/10 text-[10px] font-semibold text-[#1DB954] whitespace-nowrap shrink-0"
                >
                  {pl.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===== YOUTUBE ===== */}
        {source === "youtube" && (
          <div className="px-4 py-3 space-y-2.5">
            {/* Search bar */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={youtubeQuery}
                  onChange={e => setYoutubeQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && searchYouTube()}
                  placeholder="Cerca musica su YouTube..."
                  className="w-full h-8 pl-8 pr-3 rounded-lg bg-muted text-xs focus:outline-none focus:ring-1 focus:ring-[#FF0000]/50"
                />
              </div>
              <button
                onClick={searchYouTube}
                className="h-8 px-3 rounded-lg bg-[#FF0000] text-white text-[10px] font-bold shrink-0"
              >
                Cerca
              </button>
            </div>

            {/* YouTube embed */}
            <div className="rounded-xl overflow-hidden aspect-video">
              <iframe
                key={youtubeEmbed}
                src={youtubeEmbed}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                className="w-full h-full"
              />
            </div>

            {/* Quick playlists */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {youtubePlaylistIds.map(pl => (
                <button
                  key={pl.id}
                  onClick={() => {
                    setYoutubeEmbed(`https://www.youtube.com/embed/videoseries?list=${pl.id}&autoplay=0`);
                    setYoutubeQuery("");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#FF0000]/10 text-[10px] font-semibold text-[#FF0000] whitespace-nowrap shrink-0"
                >
                  {pl.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
