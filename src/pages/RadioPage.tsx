import MobileLayout from "@/components/layout/MobileLayout";
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, Share2, Radio as RadioIcon, Headphones } from "lucide-react";
import { useState } from "react";
import beauty2 from "@/assets/beauty-2.jpg";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";

const stations = [
  { id: 1, name: "Beauty Hits FM", genre: "Pop & Beauty", listeners: 2450, cover: beauty2 },
  { id: 2, name: "Salon Vibes", genre: "Chill & Lounge", listeners: 1200, cover: stylist1 },
  { id: 3, name: "Style Radio", genre: "R&B & Soul", listeners: 890, cover: stylist2 },
];

const tracks = [
  { id: 1, title: "Feel the Beat", artist: "Stayle Music", duration: "3:24" },
  { id: 2, title: "Beauty Hour", artist: "Frequency Cosmetics", duration: "4:12" },
  { id: 3, title: "Glow Up Mix", artist: "Praduy Hossi", duration: "3:55" },
  { id: 4, title: "Salon Dreams", artist: "Beauty Waves", duration: "4:30" },
];

export default function RadioPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [liked, setLiked] = useState(false);
  const [progress, setProgress] = useState(35);

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RadioIcon className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-display font-bold">Beauty Hits FM</h1>
          </div>
          <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <Headphones className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      <div className="px-4 py-6">
        {/* Now Playing Card */}
        <div className="rounded-3xl overflow-hidden gradient-card shadow-card border border-border p-6">
          {/* Album Art */}
          <div className="relative mx-auto w-48 h-48 rounded-full overflow-hidden shadow-glow mb-6">
            <img
              src={beauty2}
              alt="Now Playing"
              className={`w-full h-full object-cover ${isPlaying ? "animate-[spin_8s_linear_infinite]" : ""}`}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-background border-4 border-muted" />
            </div>
          </div>

          {/* Track Info */}
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold">{tracks[currentTrack].title}</h2>
            <p className="text-sm text-muted-foreground">{tracks[currentTrack].artist}</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full gradient-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">1:12</span>
              <span className="text-[10px] text-muted-foreground">{tracks[currentTrack].duration}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6">
            <button onClick={() => setCurrentTrack(t => Math.max(0, t - 1))}>
              <SkipBack className="w-6 h-6 text-muted-foreground" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-glow"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 text-primary-foreground" />
              ) : (
                <Play className="w-7 h-7 text-primary-foreground ml-1" />
              )}
            </button>
            <button onClick={() => setCurrentTrack(t => Math.min(tracks.length - 1, t + 1))}>
              <SkipForward className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <button onClick={() => setLiked(!liked)} className="flex items-center gap-1">
              <Heart className={`w-5 h-5 ${liked ? "text-primary fill-primary" : "text-muted-foreground"}`} />
              <span className="text-xs text-muted-foreground">Share</span>
            </button>
            <button className="flex items-center gap-1">
              <Volume2 className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Top</span>
            </button>
            <button className="flex items-center gap-1">
              <Share2 className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Tip</span>
            </button>
          </div>
        </div>

        {/* Track List */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Seat the Beat
          </h3>
          <div className="space-y-2">
            {tracks.map((track, idx) => (
              <button
                key={track.id}
                onClick={() => { setCurrentTrack(idx); setIsPlaying(true); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  currentTrack === idx ? "bg-primary/10 border border-primary/30" : "bg-card hover:bg-muted"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentTrack === idx ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {currentTrack === idx && isPlaying ? "♪" : idx + 1}
                </div>
                <div className="flex-1 text-left">
                  <p className={`text-sm font-medium ${currentTrack === idx ? "text-primary" : ""}`}>
                    {track.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{track.artist}</p>
                </div>
                <span className="text-xs text-muted-foreground">{track.duration}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stations */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Stazioni Radio
          </h3>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {stations.map(station => (
              <div key={station.id} className="min-w-[140px] rounded-xl bg-card p-3 shadow-card">
                <img src={station.cover} alt={station.name} className="w-full aspect-square rounded-lg object-cover mb-2" />
                <p className="text-xs font-semibold truncate">{station.name}</p>
                <p className="text-[10px] text-muted-foreground">{station.listeners} listeners</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
