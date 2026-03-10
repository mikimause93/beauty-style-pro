import { useState } from "react";
import { Music, Play, Pause, X, Volume2, VolumeX } from "lucide-react";
import { useRadio } from "@/contexts/RadioContext";
import beauty2 from "@/assets/beauty-2.jpg";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";

import beauty1 from "@/assets/beauty-1.jpg";

const coverImages = [beauty2, stylist1, stylist2, beauty3, beauty1, beauty2, stylist1];

interface LiveMusicSelectorProps {
  isStreamer: boolean;
  onClose: () => void;
}

export default function LiveMusicSelector({ isStreamer, onClose }: LiveMusicSelectorProps) {
  const { isPlaying, loading, currentStation, toggle, play, pause, nextStation, stations, volume, changeVolume } = useRadio();
  const [muted, setMuted] = useState(false);
  const prevVolume = useState(volume)[0];

  const handleMute = () => {
    if (muted) {
      changeVolume(prevVolume || 0.8);
    } else {
      changeVolume(0);
    }
    setMuted(!muted);
  };

  const currentIdx = stations.findIndex(s => s.id === currentStation.id);
  const cover = coverImages[currentIdx % coverImages.length];

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
        {isPlaying && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 mb-4">
            <img src={cover} alt="" className="w-10 h-10 rounded-lg object-cover animate-[spin_8s_linear_infinite]" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{currentStation.name}</p>
              <p className="text-[10px] text-muted-foreground">{currentStation.genre}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={handleMute} className="w-8 h-8 rounded-full bg-card flex items-center justify-center">
                {muted ? <VolumeX className="w-4 h-4 text-muted-foreground" /> : <Volume2 className="w-4 h-4 text-primary" />}
              </button>
              <button onClick={pause} className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                <Pause className="w-4 h-4 text-destructive" />
              </button>
            </div>
          </div>
        )}

        {/* Station List */}
        <div className="space-y-2">
          {stations.map((station, idx) => {
            const isActive = isPlaying && currentStation.id === station.id;
            return (
              <button
                key={station.id}
                onClick={() => play(station)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-primary/10 border border-primary/30"
                    : "bg-card border border-border/50 hover:border-primary/20"
                }`}
              >
                <img src={coverImages[idx % coverImages.length]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                <div className="flex-1 text-left">
                  <p className={`text-sm font-medium ${isActive ? "text-primary" : ""}`}>{station.name}</p>
                  <p className="text-[10px] text-muted-foreground">{station.genre}</p>
                </div>
                {isActive ? (
                  <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center">
                    <Pause className="w-4 h-4 text-primary-foreground" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                    <Play className="w-4 h-4 text-muted-foreground ml-0.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Volume slider */}
        <div className="mt-4 flex items-center gap-3 px-1">
          <VolumeX className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={e => { changeVolume(Number(e.target.value)); setMuted(false); }}
            className="flex-1 accent-primary"
          />
          <Volume2 className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>
      </div>
    </div>
  );
}
