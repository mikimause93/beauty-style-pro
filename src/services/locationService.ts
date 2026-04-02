/**
 * locationService.ts — Beauty Style Pro v2.0.0
 * Servizio location: tracking realtime, geofencing e condivisione posizione.
 * Usa Capacitor Geolocation + Supabase Realtime.
 */

import { supabase } from "@/integrations/supabase/client";

export type PrecisionLevel = "EXACT" | "AREA" | "CITY";

export interface LocationPoint {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}

export interface LocationSession {
  id: string;
  userId: string;
  startedAt: string;
  endedAt?: string;
  precision: PrecisionLevel;
}

export interface Geofence {
  id: string;
  ownerId: string;
  name: string;
  lat: number;
  lng: number;
  radiusM: number;
  triggerType: "enter" | "exit" | "both";
  active: boolean;
}

export interface LocationShare {
  id: string;
  fromUserId: string;
  toUserId: string;
  expiresAt: string;
  precisionLevel: PrecisionLevel;
}

/** Approssima le coordinate al livello di precisione richiesto. */
function applyPrecision(point: LocationPoint, precision: PrecisionLevel): LocationPoint {
  if (precision === "EXACT") return point;
  if (precision === "AREA") {
    // arrotonda a ~500 m (2 decimali ≈ 1.1 km, 3 decimali ≈ 111 m)
    return { ...point, lat: Math.round(point.lat * 200) / 200, lng: Math.round(point.lng * 200) / 200 };
  }
  // CITY: arrotonda a ~10 km (1 decimale)
  return { ...point, lat: Math.round(point.lat * 10) / 10, lng: Math.round(point.lng * 10) / 10 };
}

/** Avvia una sessione di tracking e restituisce il session ID. */
export async function startLocationSession(
  userId: string,
  precision: PrecisionLevel = "EXACT",
): Promise<string> {
  const { data, error } = await supabase
    .from("location_sessions")
    .insert({ user_id: userId, precision })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

/** Termina una sessione di tracking. */
export async function stopLocationSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from("location_sessions")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) throw error;
}

/** Inserisce un punto di posizione nella sessione. */
export async function pushLocationPoint(
  sessionId: string,
  point: LocationPoint,
  precision: PrecisionLevel = "EXACT",
): Promise<void> {
  const p = applyPrecision(point, precision);
  const { error } = await supabase.from("location_points").insert({
    session_id: sessionId,
    lat: p.lat,
    lng: p.lng,
    accuracy: p.accuracy,
  });
  if (error) throw error;
}

/** Calcola distanza in metri tra due coordinate (formula Haversine). */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Verifica se un punto è dentro una geofence. */
export function isInsideGeofence(point: LocationPoint, fence: Geofence): boolean {
  return haversineDistance(point.lat, point.lng, fence.lat, fence.lng) <= fence.radiusM;
}

/** Crea una condivisione posizione con scadenza e livello di precisione. */
export async function createLocationShare(
  fromUserId: string,
  toUserId: string,
  expiresInMinutes: number,
  precisionLevel: PrecisionLevel = "AREA",
): Promise<LocationShare> {
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60_000).toISOString();
  const { data, error } = await supabase
    .from("location_shares")
    .insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      expires_at: expiresAt,
      precision_level: precisionLevel,
    })
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    fromUserId: data.from_user_id,
    toUserId: data.to_user_id,
    expiresAt: data.expires_at,
    precisionLevel: data.precision_level,
  };
}

/** Revoca una condivisione posizione attiva. */
export async function revokeLocationShare(shareId: string): Promise<void> {
  const { error } = await supabase
    .from("location_shares")
    .delete()
    .eq("id", shareId);
  if (error) throw error;
}
