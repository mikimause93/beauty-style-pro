import { useState } from "react";
import { Search } from "lucide-react";

const playlists = [
  { name: "Peaceful Piano", id: "37i9dQZF1DX4sWSpwq3LiO" },
  { name: "Spa & Relax", id: "37i9dQZF1DX3PIPIT6lEg5" },
  { name: "Chill Hits", id: "37i9dQZF1DX0SM0LYsmbMT" },
  { name: "Italian Hits", id: "37i9dQZF1DX2ENAPP1Tyed" },
  { name: "Pop Mix", id: "37i9dQZF1EQncLwOalG3K7" },
  { name: "Deep Focus", id: "37i9dQZF1DWZeKCadgRdKQ" },
  { name: "Acoustic Chill", id: "37i9dQZF1DX4E3UdUs7fUx" },
  { name: "R&B Mix", id: "37i9dQZF1EQoqCH7BwIYb7" },
];

export default function SpotifyEmbed() {
  const [query, setQuery] = useState("");
  const [embedUrl, setEmbedUrl] = useState(
    `https://open.spotify.com/embed/playlist/${playlists[0].id}?utm_source=generator&theme=0`
  );

  const handleSearch = () => {
    if (!query.trim()) return;
    setEmbedUrl(`https://open.spotify.com/embed/search/${encodeURIComponent(query.trim())}?utm_source=generator&theme=0`);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Cerca artisti, brani, album..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB954]/50"
          />
        </div>
        <button onClick={handleSearch} className="h-10 px-4 rounded-xl bg-[#1DB954] text-white text-xs font-bold shrink-0">
          Cerca
        </button>
      </div>

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
              setEmbedUrl(`https://open.spotify.com/embed/playlist/${pl.id}?utm_source=generator&theme=0`);
              setQuery("");
            }}
            className="px-3 py-1.5 rounded-lg bg-[#1DB954]/10 text-[11px] font-semibold text-[#1DB954] whitespace-nowrap"
          >
            {pl.name}
          </button>
        ))}
      </div>
    </div>
  );
}
