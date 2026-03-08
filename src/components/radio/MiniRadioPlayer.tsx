import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipForward, X, Radio, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import beauty2 from "@/assets/beauty-2.jpg";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";

const defaultTracks = [
  { title: "Feel the Beat", artist: "STYLE Music", cover: stylist2 },
  { title: "Beauty Hour", artist: "Frequency Cosmetics", cover: beauty3 },
  { title: "Salon Dreams", artist: "Beauty Waves", cover: stylist1 },
  { title: "Glow Up Mix", artist: "DJ Stylist", cover: beauty2 },
];

interface MiniRadioPlayerProps {
  visible: boolean;
  onClose: () => void;
}

export default function MiniRadioPlayer({ visible, onClose }: MiniRadioPlayerProps) {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        setProgress(p => (p >= 100 ? 0 : p + 0.5));
      }, 500);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying]);

  const nextTrack = () => {
    setCurrentTrack(i => (i + 1) % defaultTracks.length);
    setProgress(0);
  };

  if (!visible) return null;

  const track = defaultTracks[currentTrack];

  return (
    <div className="fixed bottom-[68px] left-0 right-0 z-40 px-3 pb-1 safe-area-bottom">
      <div className="max-w-lg mx-auto glass rounded-2xl border border-border/50 overflow-hidden shadow-card">
        {/* Progress bar */}
        <div className="h-0.5 bg-muted">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex items-center gap-3 p-3">
          {/* Album art */}
          <button onClick={() => navigate("/radio")} className="relative shrink-0">
            <img
              src={track.cover}
              alt=""
              className={`w-11 h-11 rounded-xl object-cover ${isPlaying ? "animate-[spin_8s_linear_infinite]" : ""}`}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-background/80 border border-muted" />
            </div>
          </button>

          {/* Track info */}
          <button onClick={() => navigate("/radio")} className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold truncate">{track.title}</p>
            <p className="text-[10px] text-muted-foreground truncate">{track.artist}</p>
          </button>

          {/* Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center shadow-glow"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-primary-foreground" />
              ) : (
                <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
              )}
            </button>
            <button onClick={nextTrack} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
              <SkipForward className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
