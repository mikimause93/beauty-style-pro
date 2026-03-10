import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface GeoPosition {
  latitude: number;
  longitude: number;
  city: string;
  accuracy?: number;
}

const CITY_COORDS: Record<string, [number, number]> = {
  milano: [45.4642, 9.19], roma: [41.9028, 12.4964], napoli: [40.8518, 14.2681],
  torino: [45.0703, 7.6869], firenze: [43.7696, 11.2558], bologna: [44.4949, 11.3426],
  palermo: [38.1157, 13.3615], genova: [44.4056, 8.9463], bari: [41.1171, 16.8719],
  catania: [37.5079, 15.09], venezia: [45.4408, 12.3155], verona: [45.4384, 10.9916],
  padova: [45.4064, 11.8768], trieste: [45.6495, 13.7768], brescia: [45.5416, 10.2118],
  parma: [44.8015, 10.3279], modena: [44.6471, 10.9252], reggio_emilia: [44.6989, 10.6297],
  perugia: [43.1107, 12.3908], cagliari: [39.2238, 9.1217],
  bergamo: [45.6983, 9.6773], lecce: [40.3516, 18.1718], ancona: [43.6158, 13.5189],
  pescara: [42.4618, 14.2141], salerno: [40.6824, 14.7681], sassari: [40.7259, 8.5556],
  monza: [45.5845, 9.2744], rimini: [44.0594, 12.5681], pisa: [43.7228, 10.4017],
  como: [45.808, 9.0852], taranto: [40.4644, 17.247], foggia: [41.4621, 15.5444],
};

/** Reverse geocoding via Nominatim (free, no API key) */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=it`,
      { headers: { "User-Agent": "StyleApp/1.0" } }
    );
    if (!res.ok) throw new Error("Nominatim error");
    const data = await res.json();
    return data.address?.city || data.address?.town || data.address?.village ||
           data.address?.municipality || getCityFromCoords(lat, lng);
  } catch {
    return getCityFromCoords(lat, lng);
  }
}

export function getCityFromCoords(lat: number, lng: number): string {
  let closest = "Milano";
  let minDist = Infinity;
  for (const [name, [clat, clng]] of Object.entries(CITY_COORDS)) {
    const d = Math.sqrt((lat - clat) ** 2 + (lng - clng) ** 2);
    if (d < minDist) {
      minDist = d;
      closest = name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, " ");
    }
  }
  return closest;
}

export function getCoordsFromCity(city: string): [number, number] {
  const key = city.toLowerCase().replace(/\s+/g, "_");
  return CITY_COORDS[key] || [45.4642, 9.19];
}

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Save user position to profiles table */
async function savePositionToDB(userId: string, lat: number, lng: number, city: string) {
  try {
    await supabase.from("profiles").update({
      latitude: lat,
      longitude: lng,
      city,
    }).eq("user_id", userId);
  } catch (e) {
    console.warn("Failed to save position:", e);
  }
}

export function useGeolocation(defaultCity = "Milano") {
  const defaultCoords = getCoordsFromCity(defaultCity);
  const [position, setPosition] = useState<GeoPosition>({
    latitude: defaultCoords[0],
    longitude: defaultCoords[1],
    city: defaultCity,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectGPS = useCallback(async (userId?: string) => {
    if (!navigator.geolocation) {
      setError("Geolocalizzazione non supportata");
      toast.error("GPS non supportato dal browser");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
      });

      const { latitude, longitude, accuracy } = pos.coords;
      
      // Real reverse geocoding via Nominatim
      const city = await reverseGeocode(latitude, longitude);

      setPosition({ latitude, longitude, city, accuracy: accuracy || undefined });
      toast.success(`📍 Posizione: ${city}`);

      // Save to DB if user is logged in
      if (userId) {
        savePositionToDB(userId, latitude, longitude, city);
      }
    } catch (err: any) {
      const msg = err.code === 1 ? "Permesso GPS negato" :
                  err.code === 2 ? "Posizione non disponibile" :
                  err.code === 3 ? "Timeout GPS" : "Errore GPS";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const setCity = useCallback((city: string) => {
    const coords = getCoordsFromCity(city);
    setPosition({ latitude: coords[0], longitude: coords[1], city });
  }, []);

  return {
    position,
    loading,
    error,
    detectGPS,
    setCity,
    coords: [position.latitude, position.longitude] as [number, number],
  };
}

export const ITALIAN_CITIES = [
  "Milano", "Roma", "Napoli", "Torino", "Firenze", "Bologna",
  "Palermo", "Genova", "Bari", "Catania", "Venezia", "Verona",
  "Padova", "Trieste", "Brescia", "Parma", "Modena", "Perugia",
  "Cagliari", "Bergamo", "Lecce", "Ancona", "Pescara", "Salerno",
  "Sassari", "Monza", "Rimini", "Pisa", "Como", "Taranto", "Foggia",
];

export default useGeolocation;
