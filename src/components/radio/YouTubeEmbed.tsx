import { useState } from "react";
import { Search, Loader2, Youtube } from "lucide-react";

const defaultPlaylists = [
  { id: "PLDfKAXSi6kOaiaFt8vMiJJMLNBeqaSMP8", name: "Salon Relax Music", genre: "Relax & Spa" },
  { id: "PLDfKAXSi6kOY2PCKgjHB4kYeZLq8qJXhd", name: "Chill Lofi Beats", genre: "Lo-Fi & Chill" },
  { id: "PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf", name: "Peaceful Piano", genre: "Piano" },
  { id: "PLOzDu-MXXLliO9fBNZOQTBDddoA3FzZUo", name: "Smooth Jazz Mix", genre: "Jazz" },
  { id: "PL6NdkXsPL07KiewBDpJC1R5h7bw3gMo0z", name: "Ambient Vibes", genre: "Ambient" },
  { id: "PLjp0AEEJ0-fHdJGAbYGEkmUEvu3mFNuJH", name: "Beauty BGM", genre: "Background Music" },
];

export default function YouTubeEmbed() {
  const [activePlaylist, setActivePlaylist] = useState(defaultPlaylists[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const filtered = searchQuery
    ? defaultPlaylists.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.genre.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : defaultPlaylists;

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cerca playlist YouTube..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted/50 border border-border/50 text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary/30"
        />
      </div>

      {/* Embedded Player */}
      <div className="rounded-xl overflow-hidden bg-card border border-border/50 relative aspect-video">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-card z-10">
            <Loader2 className="w-5 h-5 text-[#FF0000] animate-spin" />
          </div>
        )}
        <iframe
          src={`https://www.youtube.com/embed/videoseries?list=${activePlaylist.id}&autoplay=0`}
          width="100%"
          height="100%"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          onLoad={() => setLoading(false)}
          className="absolute inset-0 w-full h-full"
        />
      </div>

      {/* Playlist selector */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Playlist</p>
        <div className="space-y-1">
          {filtered.map(pl => {
            const isActive = activePlaylist.id === pl.id;
            return (
              <button
                key={pl.id}
                onClick={() => { setActivePlaylist(pl); setLoading(true); }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${
                  isActive
                    ? "bg-[#FF0000]/10 border border-[#FF0000]/30"
                    : "bg-muted/30 border border-transparent hover:border-border/50"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isActive ? "bg-[#FF0000]/20" : "bg-muted"
                }`}>
                  <Youtube className={`w-4 h-4 ${isActive ? "text-[#FF0000]" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${isActive ? "text-[#FF0000]" : ""}`}>{pl.name}</p>
                  <p className="text-[10px] text-muted-foreground">{pl.genre}</p>
                </div>
                {isActive && (
                  <div className="flex items-center gap-0.5">
                    <div className="w-0.5 h-2.5 bg-[#FF0000] rounded-full animate-pulse" />
                    <div className="w-0.5 h-3.5 bg-[#FF0000] rounded-full animate-pulse" style={{ animationDelay: "0.15s" }} />
                    <div className="w-0.5 h-2 bg-[#FF0000] rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
