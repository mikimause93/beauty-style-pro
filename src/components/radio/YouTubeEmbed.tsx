import { useState } from "react";
import { Search } from "lucide-react";

const defaultVideos = [
  { name: "Relaxing Music", videoId: "lFcSrYw-ARY" },
  { name: "Lofi Hip Hop", videoId: "jfKfPfyJRdk" },
  { name: "Piano Music", videoId: "BjFWk0ncr70" },
  { name: "Italian Hits", videoId: "kOkQ4T5WO9E" },
  { name: "Chill Beats", videoId: "rUxyKA_-grg" },
  { name: "Jazz Music", videoId: "Dx5qFachd3A" },
  { name: "Pop Hits", videoId: "kXYiU_JCYtU" },
  { name: "Acoustic", videoId: "5qap5aO4i9A" },
  { name: "R&B Soul", videoId: "1ZYbU82GVz4" },
  { name: "Dance Mix", videoId: "mMfxI3r_LyA" },
];

export default function YouTubeEmbed() {
  const [query, setQuery] = useState("");
  const [currentVideoId, setCurrentVideoId] = useState(defaultVideos[0].videoId);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchEmbedUrl, setSearchEmbedUrl] = useState("");

  const handleSearch = () => {
    if (!query.trim()) return;
    // YouTube embed supports listType=search — plays results IN-APP, no external links
    const q = encodeURIComponent(query.trim());
    setSearchEmbedUrl(`https://www.youtube.com/embed?listType=search&list=${q}`);
    setIsSearchMode(true);
  };

  const playVideo = (videoId: string) => {
    setCurrentVideoId(videoId);
    setIsSearchMode(false);
    setSearchEmbedUrl("");
    setQuery("");
  };

  const embedSrc = isSearchMode
    ? searchEmbedUrl
    : `https://www.youtube.com/embed/${currentVideoId}?autoplay=0&rel=0`;

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
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-live/50"
          />
        </div>
        <button onClick={handleSearch} className="h-10 px-4 rounded-xl bg-live text-white text-xs font-bold shrink-0">
          Cerca
        </button>
      </div>

      {/* Embedded player — everything plays in-app */}
      <div className="rounded-xl overflow-hidden aspect-video">
        <iframe
          key={embedSrc}
          src={embedSrc}
          width="100%"
          height="100%"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className="w-full h-full"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {defaultVideos.map(v => (
          <button
            key={v.videoId}
            onClick={() => playVideo(v.videoId)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
              !isSearchMode && currentVideoId === v.videoId
                ? "bg-live text-white"
                : "bg-live/10 text-live"
            }`}
          >
            {v.name}
          </button>
        ))}
      </div>
    </div>
  );
}
