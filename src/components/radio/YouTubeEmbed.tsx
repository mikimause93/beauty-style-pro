import { useState } from "react";
import { Search } from "lucide-react";

const playlists = [
  { name: "Salon Relax", id: "PLMWjhejkSIMpGNUfMIBGbrkiRMIJSn1cD" },
  { name: "Lofi Beats", id: "PLofht4PTcKYnaH8w5olJCI-wUVxuoMHqM" },
  { name: "Piano Music", id: "PL8F6B0753B2CCA128" },
  { name: "Italian Pop", id: "PLgzTt0k8mXzEk586SfWBhQlrhxIGkpMl" },
  { name: "Chill Mix", id: "PLRqcegS1mb4Isgh6YDcw-a_gQuSmQxCBj" },
  { name: "Ambient", id: "PLMC9KNkIncKtPzgY-5rmhvj7fax8fdxoj" },
];

export default function YouTubeEmbed() {
  const [query, setQuery] = useState("");
  const [embedUrl, setEmbedUrl] = useState(
    `https://www.youtube.com/embed/videoseries?list=${playlists[0].id}&autoplay=0`
  );

  const handleSearch = () => {
    if (!query.trim()) return;
    setEmbedUrl(`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query.trim())}&autoplay=0`);
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
            placeholder="Cerca video musicali..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-[#FF0000]/50"
          />
        </div>
        <button onClick={handleSearch} className="h-10 px-4 rounded-xl bg-[#FF0000] text-white text-xs font-bold shrink-0">
          Cerca
        </button>
      </div>

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

      <div className="flex flex-wrap gap-1.5">
        {playlists.map(pl => (
          <button
            key={pl.id}
            onClick={() => {
              setEmbedUrl(`https://www.youtube.com/embed/videoseries?list=${pl.id}&autoplay=0`);
              setQuery("");
            }}
            className="px-3 py-1.5 rounded-lg bg-[#FF0000]/10 text-[11px] font-semibold text-[#FF0000] whitespace-nowrap"
          >
            {pl.name}
          </button>
        ))}
      </div>
    </div>
  );
}
