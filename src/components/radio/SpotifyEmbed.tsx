import { useState } from "react";
import { Search, Loader2, Music2 } from "lucide-react";

const defaultPlaylists = [
  { id: "37i9dQZF1DX4sWSpwq3LiO", name: "Peaceful Piano", genre: "Piano & Relax" },
  { id: "37i9dQZF1DWZd79rJ6a7lp", name: "Sleep", genre: "Ambient Sleep" },
  { id: "37i9dQZF1DX3rxVfibe1L0", name: "Mood Booster", genre: "Pop & Feel Good" },
  { id: "37i9dQZF1DWUvQoIOFMFje", name: "Spa & Relax", genre: "Spa Ambient" },
  { id: "37i9dQZF1DX0SM0LYsmbMT", name: "Jazz Vibes", genre: "Smooth Jazz" },
  { id: "37i9dQZF1DX4WYpdgoIcn6", name: "Chill Hits", genre: "Chill Pop" },
];

export default function SpotifyEmbed() {
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
          placeholder="Cerca playlist Spotify..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted/50 border border-border/50 text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary/30"
        />
      </div>

      {/* Embedded Player */}
      <div className="rounded-xl overflow-hidden bg-card border border-border/50 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-card z-10">
            <Loader2 className="w-5 h-5 text-[#1DB954] animate-spin" />
          </div>
        )}
        <iframe
          src={`https://open.spotify.com/embed/playlist/${activePlaylist.id}?utm_source=generator&theme=0`}
          width="100%"
          height="152"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          onLoad={() => setLoading(false)}
          className="block"
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
                    ? "bg-[#1DB954]/10 border border-[#1DB954]/30"
                    : "bg-muted/30 border border-transparent hover:border-border/50"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isActive ? "bg-[#1DB954]/20" : "bg-muted"
                }`}>
                  <Music2 className={`w-4 h-4 ${isActive ? "text-[#1DB954]" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${isActive ? "text-[#1DB954]" : ""}`}>{pl.name}</p>
                  <p className="text-[10px] text-muted-foreground">{pl.genre}</p>
                </div>
                {isActive && (
                  <div className="flex items-center gap-0.5">
                    <div className="w-0.5 h-2.5 bg-[#1DB954] rounded-full animate-pulse" />
                    <div className="w-0.5 h-3.5 bg-[#1DB954] rounded-full animate-pulse" style={{ animationDelay: "0.15s" }} />
                    <div className="w-0.5 h-2 bg-[#1DB954] rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
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
