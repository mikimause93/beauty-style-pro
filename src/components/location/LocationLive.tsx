/**
 * LocationLive.tsx — Beauty Style Pro v2.0.0
 * Componente per il tracking GPS realtime con controlli start/stop.
 * Mostra posizione attuale, precisione e stato della sessione.
 */

import { MapPin, Navigation, Square, Shield } from "lucide-react";
import { useLocationLive } from "@/hooks/useLocationLive";
import { PrecisionLevel } from "@/services/locationService";
import { useState } from "react";

const PRECISION_LABELS: Record<PrecisionLevel, string> = {
  EXACT: "Posizione esatta",
  AREA: "Area (±500m)",
  CITY: "Solo città",
};

const PRECISION_COLORS: Record<PrecisionLevel, string> = {
  EXACT: "text-green-400",
  AREA: "text-yellow-400",
  CITY: "text-blue-400",
};

export default function LocationLive() {
  const { isTracking, currentPosition, error, start, stop } = useLocationLive();
  const [precision, setPrecision] = useState<PrecisionLevel>("AREA");

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isTracking ? "bg-green-500/20" : "bg-muted"}`}>
          <Navigation className={`w-5 h-5 ${isTracking ? "text-green-400 animate-pulse" : "text-muted-foreground"}`} />
        </div>
        <div>
          <h3 className="text-sm font-bold">Posizione Live</h3>
          <p className="text-xs text-muted-foreground">
            {isTracking ? "Tracking attivo" : "Tracking inattivo"}
          </p>
        </div>
        {isTracking && (
          <span className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        )}
      </div>

      {/* Selettore precisione */}
      {!isTracking && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Livello privacy
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(["EXACT", "AREA", "CITY"] as PrecisionLevel[]).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPrecision(p)}
                className={`rounded-xl py-2 px-2 text-xs font-medium border transition-all ${
                  precision === p
                    ? "border-purple-500 bg-purple-500/10 text-purple-300"
                    : "border-border bg-muted text-muted-foreground"
                }`}
              >
                {PRECISION_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Posizione corrente */}
      {currentPosition && (
        <div className="bg-muted rounded-xl p-3 space-y-1">
          <div className="flex items-center gap-2">
            <MapPin className={`w-4 h-4 ${PRECISION_COLORS[precision]}`} />
            <span className="text-xs font-medium">Posizione attuale</span>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            {currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}
          </p>
          {currentPosition.accuracy && (
            <p className="text-[10px] text-muted-foreground">
              Precisione: ±{Math.round(currentPosition.accuracy)}m
            </p>
          )}
        </div>
      )}

      {/* Errore */}
      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 rounded-xl px-3 py-2">{error}</p>
      )}

      {/* Bottone start/stop */}
      <button
        type="button"
        onClick={() => (isTracking ? stop() : start(precision))}
        className={`w-full rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
          isTracking
            ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
            : "bg-purple-600 text-white hover:bg-purple-700"
        }`}
      >
        {isTracking ? (
          <>
            <Square className="w-4 h-4" />
            Ferma tracking
          </>
        ) : (
          <>
            <Navigation className="w-4 h-4" />
            Avvia tracking
          </>
        )}
      </button>
    </div>
  );
}
