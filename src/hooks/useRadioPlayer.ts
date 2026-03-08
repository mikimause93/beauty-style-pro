import { useState, useRef, useCallback, useEffect } from "react";

export interface RadioStation {
  id: string;
  name: string;
  genre: string;
  stream_url: string;
  cover_image: string;
  listener_count: number;
}

// Free public radio streams (no API key needed)
export const defaultStations: RadioStation[] = [
  {
    id: "lofi",
    name: "Beauty Lofi",
    genre: "Lo-Fi & Chill",
    stream_url: "https://play.streamafrica.net/lofiradio",
    cover_image: "",
    listener_count: 2450,
  },
  {
    id: "chillout",
    name: "Salon Vibes",
    genre: "Chillout",
    stream_url: "https://icecast.radiofrance.fr/fip-lofi.mp3",
    cover_image: "",
    listener_count: 1200,
  },
  {
    id: "hits",
    name: "Style Hits FM",
    genre: "Pop Hits",
    stream_url: "https://stream.zeno.fm/fyn8eh3h5f8uv",
    cover_image: "",
    listener_count: 890,
  },
  {
    id: "jazz",
    name: "Glam Jazz",
    genre: "Smooth Jazz",
    stream_url: "https://streaming.radio.co/s774887f7b/listen",
    cover_image: "",
    listener_count: 670,
  },
];

export function useRadioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStation, setCurrentStation] = useState<RadioStation>(defaultStations[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.8);

  // Initialize audio element once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
      audioRef.current.preload = "none";
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const play = useCallback(async (station?: RadioStation) => {
    const target = station || currentStation;
    const audio = audioRef.current;
    if (!audio) return;

    setError(null);
    setLoading(true);

    try {
      // If switching station, change src
      if (station && station.id !== currentStation.id) {
        audio.pause();
        audio.src = station.stream_url;
        setCurrentStation(station);
      } else if (!audio.src || audio.src === "") {
        audio.src = target.stream_url;
      }

      audio.onerror = () => {
        setError("Stream non disponibile");
        setIsPlaying(false);
        setLoading(false);
      };

      audio.oncanplay = () => setLoading(false);
      audio.onplaying = () => { setLoading(false); setIsPlaying(true); };

      await audio.play();
      setIsPlaying(true);
    } catch (err: any) {
      console.error("Radio play error:", err);
      setError("Impossibile riprodurre lo stream");
      setIsPlaying(false);
    }
    setLoading(false);
  }, [currentStation]);

  const pause = useCallback(() => {
    try {
      audioRef.current?.pause();
    } catch {}
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const nextStation = useCallback(() => {
    const idx = defaultStations.findIndex(s => s.id === currentStation.id);
    const next = defaultStations[(idx + 1) % defaultStations.length];
    play(next);
  }, [currentStation, play]);

  const prevStation = useCallback(() => {
    const idx = defaultStations.findIndex(s => s.id === currentStation.id);
    const prev = defaultStations[(idx - 1 + defaultStations.length) % defaultStations.length];
    play(prev);
  }, [currentStation, play]);

  const changeVolume = useCallback((v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  return {
    isPlaying,
    loading,
    error,
    currentStation,
    volume,
    play,
    pause,
    toggle,
    nextStation,
    prevStation,
    changeVolume,
    stations: defaultStations,
  };
}
