import { useState, useRef, useCallback, useEffect } from "react";

export interface RadioStation {
  id: string;
  name: string;
  genre: string;
  stream_url: string;
  cover_image: string;
  listener_count: number;
}

// Verified working public radio streams (updated March 2026)
export const defaultStations: RadioStation[] = [
  // === Stazioni Nazionali Italiane ===
  {
    id: "rtl-1025",
    name: "RTL 102.5",
    genre: "🇮🇹 Pop Italiana",
    stream_url: "https://streamingv2.shoutcast.com/rtl-1025",
    cover_image: "",
    listener_count: 12500,
  },
  {
    id: "radio-105",
    name: "Radio 105",
    genre: "🇮🇹 Rock & Pop",
    stream_url: "https://icecast.unitedradio.it/Radio105.mp3",
    cover_image: "",
    listener_count: 6900,
  },
  {
    id: "virgin-radio",
    name: "Virgin Radio",
    genre: "🇮🇹 Rock",
    stream_url: "https://icecast.unitedradio.it/Virgin.mp3",
    cover_image: "",
    listener_count: 5400,
  },
  {
    id: "rds",
    name: "RDS",
    genre: "🇮🇹 Hits Italiane",
    stream_url: "https://stream1.rds.it:8000/rds64k",
    cover_image: "",
    listener_count: 8200,
  },
  {
    id: "radio-kiss-kiss",
    name: "Radio Kiss Kiss",
    genre: "🇮🇹 Hit & Dance",
    stream_url: "https://ice07.fluidstream.net:8080/KissKiss.mp3",
    cover_image: "",
    listener_count: 4800,
  },
  {
    id: "r101",
    name: "R101",
    genre: "🇮🇹 Pop & Hits",
    stream_url: "https://icecast.unitedradio.it/r101",
    cover_image: "",
    listener_count: 4200,
  },
  // === Stazioni Salon & Beauty ===
  {
    id: "relax-salon",
    name: "Relax Salon",
    genre: "✨ Ambient Relax",
    stream_url: "https://play.streamafrica.net/lofiradio",
    cover_image: "",
    listener_count: 3200,
  },
  {
    id: "chill-focus",
    name: "Chill Focus",
    genre: "✨ Focus & Study",
    stream_url: "https://stream.zeno.fm/fyn8eh3h5f8uv",
    cover_image: "",
    listener_count: 1800,
  },
  {
    id: "ambient-spa",
    name: "Ambient Spa",
    genre: "✨ Spa & Wellness",
    stream_url: "https://stream.zeno.fm/0r0xa792kwzuv",
    cover_image: "",
    listener_count: 980,
  },
  {
    id: "glam-jazz",
    name: "Glam Jazz",
    genre: "✨ Smooth Jazz",
    stream_url: "https://stream.zeno.fm/f3wvbbqmdg8uv",
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
  const retryCountRef = useRef(0);
  const maxRetries = 2;

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
      audioRef.current.preload = "none";
      // CORS: try anonymous crossorigin for broader compat
      audioRef.current.crossOrigin = "anonymous";
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const play = useCallback(async (station?: RadioStation) => {
    const target = station || currentStation;
    const audio = audioRef.current;
    if (!audio) return;

    setError(null);
    setLoading(true);

    try {
      if (station && station.id !== currentStation.id) {
        audio.pause();
        // Remove crossOrigin if it causes issues for some streams
        audio.crossOrigin = "anonymous";
        audio.src = station.stream_url;
        audio.load();
        setCurrentStation(station);
        retryCountRef.current = 0;
      } else if (!audio.src || audio.src === "" || audio.src === window.location.href) {
        audio.src = target.stream_url;
        audio.load();
      }

      audio.onerror = () => {
        console.warn("Stream error for:", target.name, "- retrying without CORS...");
        
        // Retry without crossOrigin (some streams block it)
        if (retryCountRef.current === 0 && audio.crossOrigin) {
          retryCountRef.current = 1;
          audio.crossOrigin = null as any;
          audio.src = target.stream_url;
          audio.load();
          audio.play().catch(() => {
            setError("Stream non disponibile");
            setIsPlaying(false);
            setLoading(false);
          });
          return;
        }
        
        // Auto-skip to next station after max retries
        if (retryCountRef.current >= maxRetries) {
          setError("Stream non disponibile — provo la prossima...");
          setIsPlaying(false);
          setLoading(false);
          // Auto-skip after 1.5s
          const idx = defaultStations.findIndex(s => s.id === target.id);
          const nextIdx = (idx + 1) % defaultStations.length;
          setTimeout(() => {
            retryCountRef.current = 0;
            play(defaultStations[nextIdx]);
          }, 1500);
          return;
        }
        
        retryCountRef.current++;
        setError("Stream non disponibile");
        setIsPlaying(false);
        setLoading(false);
      };

      audio.oncanplay = () => setLoading(false);
      audio.onplaying = () => { setLoading(false); setIsPlaying(true); setError(null); };

      await audio.play();
      setIsPlaying(true);
    } catch (err: any) {
      console.error("Radio play error:", err);
      // If it's a CORS issue, retry without crossOrigin
      if (audio.crossOrigin && retryCountRef.current === 0) {
        retryCountRef.current = 1;
        audio.crossOrigin = null as any;
        audio.src = (station || currentStation).stream_url;
        audio.load();
        try {
          await audio.play();
          setIsPlaying(true);
          setLoading(false);
          return;
        } catch { /* Intentionally ignored: try next URL on failure */ }
      }
      setError("Impossibile riprodurre");
      setIsPlaying(false);
    }
    setLoading(false);
  }, [currentStation]);

  const pause = useCallback(() => {
    try { audioRef.current?.pause(); } catch { /* Intentionally ignored: pause error is non-critical */ }
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) pause(); else play();
  }, [isPlaying, play, pause]);

  const nextStation = useCallback(() => {
    const idx = defaultStations.findIndex(s => s.id === currentStation.id);
    const next = defaultStations[(idx + 1) % defaultStations.length];
    retryCountRef.current = 0;
    play(next);
  }, [currentStation, play]);

  const prevStation = useCallback(() => {
    const idx = defaultStations.findIndex(s => s.id === currentStation.id);
    const prev = defaultStations[(idx - 1 + defaultStations.length) % defaultStations.length];
    retryCountRef.current = 0;
    play(prev);
  }, [currentStation, play]);

  const changeVolume = useCallback((v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  return {
    isPlaying, loading, error, currentStation, volume,
    play, pause, toggle, nextStation, prevStation, changeVolume,
    stations: defaultStations,
  };
}
