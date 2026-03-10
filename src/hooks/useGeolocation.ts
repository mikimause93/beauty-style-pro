import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

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
};

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
  return CITY_COORDS[key] || [45.4642, 9.19]; // Default: Milano
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

export function useGeolocation(defaultCity = "Milano") {
  const defaultCoords = getCoordsFromCity(defaultCity);
  const [position, setPosition] = useState<GeoPosition>({
    latitude: defaultCoords[0],
    longitude: defaultCoords[1],
    city: defaultCity,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectGPS = useCallback(async () => {
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
      const city = getCityFromCoords(latitude, longitude);

      setPosition({ latitude, longitude, city, accuracy: accuracy || undefined });
      toast.success(`📍 Posizione: ${city}`);
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
  "Padova", "Trieste", "Brescia", "Parma", "Modena", "Perugia", "Cagliari",
];

export default useGeolocation;
