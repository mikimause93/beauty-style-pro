/**
 * useLocationLive.ts — Beauty Style Pro v2.0.0
 * Hook per il tracking GPS realtime con Supabase e Capacitor Geolocation.
 * Funziona in ambiente web tramite l'API Geolocation standard.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  startLocationSession,
  stopLocationSession,
  pushLocationPoint,
  PrecisionLevel,
  LocationPoint,
} from "@/services/locationService";
import { useAuth } from "@/hooks/useAuth";

export interface LiveLocationState {
  isTracking: boolean;
  currentPosition: LocationPoint | null;
  sessionId: string | null;
  error: string | null;
  start: (precision?: PrecisionLevel) => Promise<void>;
  stop: () => Promise<void>;
}

const WATCH_INTERVAL_MS = 10_000; // aggiorna ogni 10 secondi

export function useLocationLive(): LiveLocationState {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<LocationPoint | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const precisionRef = useRef<PrecisionLevel>("EXACT");

  const handlePosition = useCallback(
    async (pos: GeolocationPosition) => {
      const point: LocationPoint = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp,
      };
      setCurrentPosition(point);
      if (sessionIdRef.current) {
        await pushLocationPoint(sessionIdRef.current, point, precisionRef.current).catch(
          () => undefined,
        );
      }
    },
    [],
  );

  const start = useCallback(
    async (precision: PrecisionLevel = "EXACT") => {
      if (!user?.id) {
        setError("Utente non autenticato");
        return;
      }
      if (!navigator.geolocation) {
        setError("Geolocalizzazione non supportata");
        return;
      }
      setError(null);
      precisionRef.current = precision;
      try {
        const sid = await startLocationSession(user.id, precision);
        sessionIdRef.current = sid;
        setSessionId(sid);

        watchIdRef.current = navigator.geolocation.watchPosition(
          handlePosition,
          (err) => setError(err.message),
          { enableHighAccuracy: precision === "EXACT", maximumAge: WATCH_INTERVAL_MS },
        );
        setIsTracking(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore avvio tracking");
      }
    },
    [user?.id, handlePosition],
  );

  const stop = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (sessionIdRef.current) {
      await stopLocationSession(sessionIdRef.current).catch(() => undefined);
      sessionIdRef.current = null;
      setSessionId(null);
    }
    setIsTracking(false);
  }, []);

  // Sottoscrizione Supabase Realtime: aggiorna posizione se un altro dispositivo la pubblica
  useEffect(() => {
    if (!user?.id || !sessionId) return;
    const channel = supabase
      .channel(`location:${sessionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "location_points", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          setCurrentPosition({
            lat: row.lat as number,
            lng: row.lng as number,
            accuracy: row.accuracy as number | undefined,
            timestamp: Date.now(),
          });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, sessionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { isTracking, currentPosition, sessionId, error, start, stop };
}
