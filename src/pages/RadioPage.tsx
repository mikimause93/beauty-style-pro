import MobileLayout from "@/components/layout/MobileLayout";
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, Share2, Radio as RadioIcon, Headphones } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import beauty2 from "@/assets/beauty-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";

const fallbackStations = [
  { id: "1", name: "Beauty Hits FM", genre: "Pop & Beauty", listener_count: 2450, cover_image: beauty2 },
  { id: "2", name: "Salon Vibes", genre: "Chill & Lounge", listener_count: 1200, cover_image: stylist1 },
  { id: "3", name: "Style Radio", genre: "R&B & Soul", listener_count: 890, cover_image: stylist2 },
];

const fallbackTracks = [
  { id: "1", title: "Feel the Beat", artist: "STYLE Music", duration: 204, cover_image: stylist2 },
  { id: "2", title: "Beauty Hour", artist: "Frequency Cosmetics", duration: 252, cover_image: beauty3 },
  { id: "3", title: "Salon Dreams", artist: "Beauty Waves", duration: 235, cover_image: stylist1 },
  { id: "4", title: "Glow Up Mix", artist: "DJ Stylist", duration: 270, cover_image: beauty2 },
];

export default function RadioPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [liked, setLiked] = useState(false);
  const [progress, setProgress] = useState(35);
  const [stations, setStations] = useState(fallbackStations);
  const [tracks, setTracks] = useState(fallbackTracks);
  const [activeStation, setActiveStation] = useState<string | null>(null);

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    const { data: stationsData } = await supabase
      .from("radio_stations")
      .select("*")
      .eq("active", true)
      .order("featured", { ascending: false });

    if (stationsData && stationsData.length > 0) {
      setStations(stationsData.map((s, i) => ({
        ...s,
        cover_image: s.cover_image || fallbackStations[i % fallbackStations.length].cover_image,
      })));
      setActiveStation(stationsData[0].id);
      fetchTracks(stationsData[0].id);
    }
  };

  const fetchTracks = async (stationId: string) => {
    const { data: playlistData } = await supabase
      .from("playlists")
      .select("id")
      .eq("station_id", stationId)
      .limit(1)
      .single();

    if (playlistData) {
      const { data: tracksData } = await supabase
        .from("tracks")
        .select("*")
        .eq("playlist_id", playlistData.id)
        .order("created_at", { ascending: false });

      if (tracksData && tracksData.length > 0) {
        setTracks(tracksData.map((t, i) => ({
          ...t,
          cover_image: t.cover_image || fallbackTracks[i % fallbackTracks.length].cover_image,
        })));
        setCurrentTrack(0);
      }
    }
  };

  const selectStation = (stationId: string) => {
    setActiveStation(stationId);
    fetchTracks(stationId);
    setIsPlaying(true);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const currentTrackData = tracks[currentTrack] || fallbackTracks[0];

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
              <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold">Beauty Hits FM</h1>
              <p className="text-[10px] text-muted-foreground">Radio & Music Player</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
              <Headphones className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 py-6">
        {/* Now Playing */}
        <div className="rounded-3xl overflow-hidden gradient-card shadow-card border border-border p-6">
          <div className="relative mx-auto w-52 h-52 rounded-full overflow-hidden shadow-glow mb-6">
            <img
              src={currentTrackData.cover_image}
              alt="In riproduzione"
              className={`w-full h-full object-cover ${isPlaying ? "animate-[spin_8s_linear_infinite]" : ""}`}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-background border-4 border-muted flex items-center justify-center">
                <div className="w-3 h-3 rounded-full gradient-primary" />
              </div>
            </div>
          </div>

          <div className="text-center mb-4">
            <h2 className="text-lg font-bold">{currentTrackData.title}</h2>
            <p className="text-sm text-muted-foreground">{currentTrackData.artist}</p>
          </div>

          <div className="mb-4">
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full gradient-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">1:12</span>
              <span className="text-[10px] text-muted-foreground">{formatDuration(currentTrackData.duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-8">
            <button onClick={() => setCurrentTrack(t => Math.max(0, t - 1))}>
              <SkipBack className="w-6 h-6 text-muted-foreground" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-glow"
            >
              {isPlaying ? <Pause className="w-7 h-7 text-primary-foreground" /> : <Play className="w-7 h-7 text-primary-foreground ml-1" />}
            </button>
            <button onClick={() => setCurrentTrack(t => Math.min(tracks.length - 1, t + 1))}>
              <SkipForward className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-8 mt-4">
            <button onClick={() => setLiked(!liked)} className="flex flex-col items-center gap-1">
              <Heart className={`w-5 h-5 ${liked ? "text-primary fill-primary" : "text-muted-foreground"}`} />
              <span className="text-[10px] text-muted-foreground">Mi piace</span>
            </button>
            <button className="flex flex-col items-center gap-1">
              <RadioIcon className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Top</span>
            </button>
            <button className="flex flex-col items-center gap-1">
              <Share2 className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Condividi</span>
            </button>
          </div>
        </div>

        {/* Track List */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Playlist</h3>
          <div className="space-y-2">
            {tracks.map((track, idx) => (
              <button
                key={track.id}
                onClick={() => { setCurrentTrack(idx); setIsPlaying(true); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  currentTrack === idx ? "bg-primary/10 border border-primary/30" : "bg-card hover:bg-muted"
                }`}
              >
                <img src={track.cover_image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                <div className="flex-1 text-left">
                  <p className={`text-sm font-medium ${currentTrack === idx ? "text-primary" : ""}`}>{track.title}</p>
                  <p className="text-xs text-muted-foreground">{track.artist}</p>
                </div>
                {currentTrack === idx && isPlaying ? (
                  <div className="flex items-center gap-0.5">
                    <div className="w-0.5 h-3 bg-primary rounded-full animate-pulse" />
                    <div className="w-0.5 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.1s" }} />
                    <div className="w-0.5 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">{formatDuration(track.duration)}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Stations */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Stazioni Radio</h3>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {stations.map(station => (
              <button
                key={station.id}
                onClick={() => selectStation(station.id)}
                className={`min-w-[140px] rounded-xl p-3 shadow-card transition-all ${
                  activeStation === station.id ? "bg-primary/10 border border-primary/30" : "bg-card"
                }`}
              >
                <img src={station.cover_image} alt={station.name} className="w-full aspect-square rounded-lg object-cover mb-2" />
                <p className="text-xs font-semibold truncate">{station.name}</p>
                <p className="text-[10px] text-muted-foreground">{station.listener_count} ascoltatori</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
