import { Play, Pause, SkipForward, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRadioPlayer } from "@/hooks/useRadioPlayer";
import { forwardRef } from "react";
import beauty2 from "@/assets/beauty-2.jpg";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";

const coverImages = [beauty2, stylist1, stylist2, beauty3];

interface MiniRadioPlayerProps {
  visible: boolean;
  onClose: () => void;
}

const MiniRadioPlayer = forwardRef<HTMLDivElement, MiniRadioPlayerProps>(
  ({ visible, onClose }, ref) => {
    const navigate = useNavigate();
    const { isPlaying, loading, currentStation, toggle, nextStation, stations } = useRadioPlayer();

    if (!visible) return null;

    const idx = stations.findIndex(s => s.id === currentStation.id);
    const cover = coverImages[idx % coverImages.length];

    return (
      <div ref={ref} className="fixed bottom-[68px] left-0 right-0 z-40 px-3 pb-1 safe-area-bottom">
        <div className="max-w-lg mx-auto glass rounded-2xl border border-border/50 overflow-hidden shadow-card">
          <div className="flex items-center gap-3 p-3">
            <button onClick={() => navigate("/radio")} className="relative shrink-0">
              <img src={cover} alt=""
                className={`w-11 h-11 rounded-xl object-cover ${isPlaying ? "animate-[spin_8s_linear_infinite]" : ""}`} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-background/80 border border-muted" />
              </div>
            </button>

            <button onClick={() => navigate("/radio")} className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold truncate">{currentStation.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{currentStation.genre}</p>
            </button>

            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={toggle} disabled={loading}
                className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center shadow-glow disabled:opacity-50">
                {loading ? (
                  <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4 text-primary-foreground" />
                ) : (
                  <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
                )}
              </button>
              <button onClick={nextStation} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
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
);

MiniRadioPlayer.displayName = "MiniRadioPlayer";

export default MiniRadioPlayer;
