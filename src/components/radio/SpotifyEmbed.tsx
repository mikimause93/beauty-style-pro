import { useState } from "react";
import { Search, Music2 } from "lucide-react";

const playlists = [
  { name: "Peaceful Piano", id: "37i9dQZF1DX4sWSpwq3LiO" },
  { name: "Spa & Relax", id: "37i9dQZF1DX3PIPIT6lEg5" },
  { name: "Chill Hits", id: "37i9dQZF1DX0SM0LYsmbMT" },
  { name: "Italian Hits", id: "37i9dQZF1DX2ENAPP1Tyed" },
  { name: "Pop Mix", id: "37i9dQZF1EQncLwOalG3K7" },
  { name: "Deep Focus", id: "37i9dQZF1DWZeKCadgRdKQ" },
  { name: "Acoustic Chill", id: "37i9dQZF1DX4E3UdUs7fUx" },
  { name: "R&B Mix", id: "37i9dQZF1EQoqCH7BwIYb7" },
  { name: "Top 50 Italia", id: "37i9dQZF1DXcRMFwBFVEzV" },
  { name: "Hot Hits Italia", id: "37i9dQZF1DWVMlt6M4HCR0" },
  { name: "Hits del Momento", id: "37i9dQZF1DX0FOF1IUWK1W" },
  { name: "Workout", id: "37i9dQZF1DX76Wlfdnj7AP" },
];

export default function SpotifyEmbed() {
  const [query, setQuery] = useState("");
  const [currentPlaylistId, setCurrentPlaylistId] = useState(playlists[0].id);
  const [embedType, setEmbedType] = useState<"playlist" | "track" | "artist">("playlist");
  const [customUri, setCustomUri] = useState("");

  const handleSearch = () => {
    if (!query.trim()) return;
    // Search by filtering playlists locally
    const match = playlists.find(p => 
      p.name.toLowerCase().includes(query.toLowerCase())
    );
    if (match) {
      setCurrentPlaylistId(match.id);
      setEmbedType("playlist");
      setCustomUri("");
    }
    // No external links — everything stays in-app
  };

  const embedUrl = customUri
    ? customUri
    : `https://open.spotify.com/embed/${embedType}/${currentPlaylistId}?utm_source=generator&theme=0`;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Cerca playlist..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB954]/50"
          />
        </div>
        <button onClick={handleSearch} className="h-10 px-4 rounded-xl bg-[#1DB954] text-white text-xs font-bold shrink-0">
          Cerca
        </button>
      </div>

      {/* Info banner */}
      {query && !playlists.find(p => p.name.toLowerCase().includes(query.toLowerCase())) && (
        <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-[#1DB954]/10 text-xs text-[#1DB954]">
          <Music2 className="w-3.5 h-3.5" />
          Seleziona una playlist dal catalogo qui sotto
        </div>
      )}

      {/* Spotify embed — full playback in-app */}
      <iframe
        key={embedUrl}
        src={embedUrl}
        width="100%"
        height="380"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="rounded-xl"
      />

      <div className="flex flex-wrap gap-1.5">
        {playlists.map(pl => (
          <button
            key={pl.id}
            onClick={() => {
              setCurrentPlaylistId(pl.id);
              setEmbedType("playlist");
              setCustomUri("");
              setQuery("");
            }}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
              currentPlaylistId === pl.id && !customUri
                ? "bg-[#1DB954] text-white"
                : "bg-[#1DB954]/10 text-[#1DB954]"
            }`}
          >
            {pl.name}
          </button>
        ))}
      </div>
    </div>
  );
}
