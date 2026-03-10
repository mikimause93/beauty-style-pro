import { useState } from "react";
import { Search, ExternalLink } from "lucide-react";

// Popular music live streams & videos (stable IDs)
const defaultVideos = [
  { name: "Relaxing Music", videoId: "lFcSrYw-ARY" },
  { name: "Lofi Hip Hop", videoId: "jfKfPfyJRdk" },
  { name: "Piano Music", videoId: "BjFWk0ncr70" },
  { name: "Italian Hits", videoId: "kOkQ4T5WO9E" },
  { name: "Chill Beats", videoId: "rUxyKA_-grg" },
  { name: "Jazz Music", videoId: "Dx5qFachd3A" },
];

export default function YouTubeEmbed() {
  const [query, setQuery] = useState("");
  const [embedUrl, setEmbedUrl] = useState(
    `https://www.youtube.com/embed/${defaultVideos[0].videoId}?autoplay=0`
  );
  const [searchMode, setSearchMode] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;
    const encoded = encodeURIComponent(query.trim());
    // Show YouTube search results in full iframe
    setEmbedUrl(`https://www.youtube.com/results?search_query=${encoded}`);
    setSearchMode(true);
  };

  const playVideo = (videoId: string) => {
    setEmbedUrl(`https://www.youtube.com/embed/${videoId}?autoplay=0`);
    setSearchMode(false);
    setQuery("");
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
            placeholder="Cerca brano o artista..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-[#FF0000]/50"
          />
        </div>
        <button onClick={handleSearch} className="h-10 px-4 rounded-xl bg-[#FF0000] text-white text-xs font-bold shrink-0">
          Cerca
        </button>
      </div>

      {/* Search mode: show full YouTube page in iframe */}
      {searchMode ? (
        <div className="space-y-2">
          <div className="rounded-xl overflow-hidden" style={{ height: "400px" }}>
            <iframe
              key={embedUrl}
              src={embedUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              loading="lazy"
              className="w-full h-full"
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            Tocca un video su YouTube per ascoltarlo, oppure scegli dai suggerimenti sotto 👇
          </p>
          <button
            onClick={() => { setSearchMode(false); setEmbedUrl(`https://www.youtube.com/embed/${defaultVideos[0].videoId}?autoplay=0`); }}
            className="w-full py-2 rounded-xl bg-muted text-xs font-semibold text-muted-foreground"
          >
            ← Torna al player
          </button>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden aspect-video">
          <iframe
            key={embedUrl}
            src={embedUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="w-full h-full"
          />
        </div>
      )}

      {/* Open in YouTube link */}
      {query && (
        <a
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#FF0000]/10 text-xs font-semibold text-[#FF0000]"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Apri "{query}" su YouTube
        </a>
      )}

      <div className="flex flex-wrap gap-1.5">
        {defaultVideos.map(v => (
          <button
            key={v.videoId}
            onClick={() => playVideo(v.videoId)}
            className="px-3 py-1.5 rounded-lg bg-[#FF0000]/10 text-[11px] font-semibold text-[#FF0000] whitespace-nowrap"
          >
            {v.name}
          </button>
        ))}
      </div>
    </div>
  );
}
