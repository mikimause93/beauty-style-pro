/**
 * LocationShare.tsx — Beauty Style Pro v2.0.0
 * Condivisione posizione con scadenza e livelli privacy.
 * Permette di inviare la propria posizione ad un altro utente per N minuti.
 */

import { useState, useCallback } from "react";
import { Share2, Clock, X, Shield, Send } from "lucide-react";
import { createLocationShare, revokeLocationShare, PrecisionLevel } from "@/services/locationService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ActiveShare {
  id: string;
  toUserId: string;
  toUserName: string;
  expiresAt: string;
  precisionLevel: PrecisionLevel;
}

const PRECISION_LABELS: Record<PrecisionLevel, { label: string; desc: string; icon: string }> = {
  EXACT: { label: "Esatta", desc: "Lat/lng precisa", icon: "🎯" },
  AREA: { label: "Area", desc: "±500 metri", icon: "📍" },
  CITY: { label: "Città", desc: "Solo città", icon: "🏙️" },
};

const DURATION_OPTIONS = [
  { label: "15 min", value: 15 },
  { label: "1 ora", value: 60 },
  { label: "4 ore", value: 240 },
  { label: "24 ore", value: 1440 },
];

interface LocationShareProps {
  targetUserId: string;
  targetUserName: string;
  onShared?: (shareId: string) => void;
}

export default function LocationShare({ targetUserId, targetUserName, onShared }: LocationShareProps) {
  const { user } = useAuth();
  const [precision, setPrecision] = useState<PrecisionLevel>("AREA");
  const [duration, setDuration] = useState(60);
  const [isSharing, setIsSharing] = useState(false);
  const [activeShares, setActiveShares] = useState<ActiveShare[]>([]);

  const handleShare = useCallback(async () => {
    if (!user?.id) {
      toast.error("Accedi per condividere la posizione");
      return;
    }
    setIsSharing(true);
    try {
      const share = await createLocationShare(user.id, targetUserId, duration, precision);
      const newShare: ActiveShare = {
        id: share.id,
        toUserId: targetUserId,
        toUserName: targetUserName,
        expiresAt: share.expiresAt,
        precisionLevel: precision,
      };
      setActiveShares(prev => [...prev, newShare]);
      toast.success(`Posizione condivisa con ${targetUserName} per ${duration < 60 ? `${duration} min` : `${duration / 60} ore`}`);
      onShared?.(share.id);
    } catch {
      toast.error("Errore condivisione posizione");
    } finally {
      setIsSharing(false);
    }
  }, [user?.id, targetUserId, targetUserName, duration, precision, onShared]);

  const handleRevoke = useCallback(async (shareId: string, name: string) => {
    try {
      await revokeLocationShare(shareId);
      setActiveShares(prev => prev.filter(s => s.id !== shareId));
      toast.success(`Condivisione con ${name} revocata`);
    } catch {
      toast.error("Errore revoca condivisione");
    }
  }, []);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
          <Share2 className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold">Condividi Posizione</h3>
          <p className="text-xs text-muted-foreground">Con {targetUserName}</p>
        </div>
      </div>

      {/* Selettore precisione */}
      <div>
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
          <Shield className="w-3 h-3" />
          Livello privacy
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(["EXACT", "AREA", "CITY"] as PrecisionLevel[]).map(p => {
            const { label, desc, icon } = PRECISION_LABELS[p];
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPrecision(p)}
                className={`rounded-xl py-2.5 px-2 text-center transition-all border ${
                  precision === p
                    ? "border-blue-500 bg-blue-500/10 text-blue-300"
                    : "border-border bg-muted text-muted-foreground"
                }`}
              >
                <div className="text-base">{icon}</div>
                <div className="text-[10px] font-medium">{label}</div>
                <div className="text-[9px] opacity-70">{desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selettore durata */}
      <div>
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Durata condivisione
        </p>
        <div className="grid grid-cols-4 gap-2">
          {DURATION_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDuration(opt.value)}
              className={`rounded-xl py-2 text-xs font-medium border transition-all ${
                duration === opt.value
                  ? "border-blue-500 bg-blue-500/10 text-blue-300"
                  : "border-border bg-muted text-muted-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottone invia */}
      <button
        type="button"
        onClick={handleShare}
        disabled={isSharing}
        className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-blue-700 transition-colors"
      >
        <Send className="w-4 h-4" />
        {isSharing ? "Condivisione..." : "Condividi la posizione"}
      </button>

      {/* Condivisioni attive */}
      {activeShares.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Condivisioni attive</p>
          {activeShares.map(share => (
            <div
              key={share.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20"
            >
              <Share2 className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{share.toUserName}</p>
                <p className="text-[10px] text-muted-foreground">
                  {PRECISION_LABELS[share.precisionLevel].icon}{" "}
                  {PRECISION_LABELS[share.precisionLevel].label} · scade{" "}
                  {new Date(share.expiresAt).toLocaleTimeString("it-IT", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRevoke(share.id, share.toUserName)}
                className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
