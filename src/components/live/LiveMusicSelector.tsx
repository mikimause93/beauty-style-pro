import { useState } from "react";
import { Music, Play, Pause, X, Volume2, VolumeX } from "lucide-react";
import beauty2 from "@/assets/beauty-2.jpg";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";

const bgTracks = [
  { id: "1", title: "Chill Salon Vibes", genre: "Lounge", cover: beauty2 },
  { id: "2", title: "Energetic Cuts", genre: "Pop", cover: stylist1 },
  { id: "3", title: "Relax & Beauty", genre: "Ambient", cover: stylist2 },
  { id: "4", title: "Trend Beats", genre: "R&B", cover: beauty2 },
];

interface LiveMusicSelectorProps {
  isStreamer: boolean;
  onClose: () => void;
}

export default function LiveMusicSelector({ isStreamer, onClose }: LiveMusicSelectorProps) {
  const [activeTrack, setActiveTrack] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);

  const toggleTrack = (id: string) => {
    setActiveTrack(prev => (prev === id ? null : id));
  };

  const current = bgTracks.find(t => t.id === activeTrack);

  return (
    <div className="absolute inset-0 z-40 flex items-end">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full glass rounded-t-3xl p-5 pb-28 slide-up">
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-5" />

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Music className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">Musica di Sottofondo</h3>
              <p className="text-xs text-muted-foreground">
                {isStreamer ? "Scegli il sottofondo per la tua live" : "Musica attiva nella live"}
              </p>
            </div>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        {/* Now playing */}
        {current && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 mb-4">
            <img src={current.cover} alt="" className="w-10 h-10 rounded-lg object-cover animate-[spin_8s_linear_infinite]" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{current.title}</p>
              <p className="text-[10px] text-muted-foreground">{current.genre}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setMuted(!muted)} className="w-8 h-8 rounded-full bg-card flex items-center justify-center">
                {muted ? <VolumeX className="w-4 h-4 text-muted-foreground" /> : <Volume2 className="w-4 h-4 text-primary" />}
              </button>
              <div className="flex items-center gap-0.5">
                <div className="w-0.5 h-3 bg-primary rounded-full animate-pulse" />
                <div className="w-0.5 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.1s" }} />
                <div className="w-0.5 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
          </div>
        )}

        {/* Track List */}
        <div className="space-y-2">
          {bgTracks.map(track => (
            <button
              key={track.id}
              onClick={() => isStreamer && toggleTrack(track.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                activeTrack === track.id
                  ? "bg-primary/10 border border-primary/30"
                  : "bg-card border border-border/50 hover:border-primary/20"
              } ${!isStreamer ? "opacity-70 cursor-default" : ""}`}
            >
              <img src={track.cover} alt="" className="w-10 h-10 rounded-lg object-cover" />
              <div className="flex-1 text-left">
                <p className={`text-sm font-medium ${activeTrack === track.id ? "text-primary" : ""}`}>{track.title}</p>
                <p className="text-[10px] text-muted-foreground">{track.genre}</p>
              </div>
              {activeTrack === track.id ? (
                <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center">
                  <Pause className="w-4 h-4 text-primary-foreground" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                  <Play className="w-4 h-4 text-muted-foreground ml-0.5" />
                </div>
              )}
            </button>
          ))}
        </div>

        {!isStreamer && (
          <p className="text-[10px] text-muted-foreground text-center mt-4">
            Solo il professionista può cambiare la musica
          </p>
        )}
      </div>
    </div>
  );
}