import MobileLayout from "@/components/layout/MobileLayout";
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, Share2, Radio as RadioIcon, Headphones, ChevronRight } from "lucide-react";
import { useState } from "react";
import beauty2 from "@/assets/beauty-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";

const stations = [
  { id: 1, name: "Beauty Hits FM", genre: "Pop & Beauty", listeners: 2450, cover: beauty2, active: true },
  { id: 2, name: "Salon Vibes", genre: "Chill & Lounge", listeners: 1200, cover: stylist1, active: false },
  { id: 3, name: "Style Radio", genre: "R&B & Soul", listeners: 890, cover: stylist2, active: false },
];

const tracks = [
  { id: 1, title: "Feel the Beat", artist: "STYLE Music", duration: "3:24", cover: stylist2 },
  { id: 2, title: "Beauty Hour", artist: "Frequency Cosmetics", duration: "4:12", cover: beauty3 },
  { id: 3, title: "Praduy Hossi", artist: "Set crutons Neoleeen", duration: "3:55", cover: stylist1 },
  { id: 4, title: "Salon Dreams", artist: "Beauty Waves", duration: "4:30", cover: beauty2 },
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
        {/* Now Playing - Full Card */}
        <div className="rounded-3xl overflow-hidden gradient-card shadow-card border border-border p-6">
          {/* Album Art with spinning disc */}
          <div className="relative mx-auto w-52 h-52 rounded-full overflow-hidden shadow-glow mb-6">
            <img
              src={tracks[currentTrack].cover}
              alt="Now Playing"
              className={`w-full h-full object-cover ${isPlaying ? "animate-[spin_8s_linear_infinite]" : ""}`}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-background border-4 border-muted flex items-center justify-center">
                <div className="w-3 h-3 rounded-full gradient-primary" />
              </div>
            </div>
          </div>

          {/* Track Info */}
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold">{tracks[currentTrack].title}</h2>
            <p className="text-sm text-muted-foreground">{tracks[currentTrack].artist}</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full gradient-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">1:12</span>
              <span className="text-[10px] text-muted-foreground">{tracks[currentTrack].duration}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-8">
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
          <div className="flex items-center justify-center gap-8 mt-4">
            <button onClick={() => setLiked(!liked)} className="flex flex-col items-center gap-1">
              <Heart className={`w-5 h-5 ${liked ? "text-primary fill-primary" : "text-muted-foreground"}`} />
              <span className="text-[10px] text-muted-foreground">Share</span>
            </button>
            <button className="flex flex-col items-center gap-1">
              <RadioIcon className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Top</span>
            </button>
            <button className="flex flex-col items-center gap-1">
              <Share2 className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Tip</span>
            </button>
          </div>
        </div>

        {/* Seat the Beat - Track List */}
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
                <img src={track.cover} alt="" className="w-10 h-10 rounded-lg object-cover" />
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
                  <span className="text-xs text-muted-foreground">{track.duration}</span>
                )}
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
