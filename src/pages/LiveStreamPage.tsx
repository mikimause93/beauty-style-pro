import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Eye, Heart, MessageCircle, Gift, Flame, Star, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import beauty1 from "@/assets/beauty-1.jpg";
import beauty2 from "@/assets/beauty-2.jpg";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";
import { useState } from "react";

const liveStreams = [
  {
    id: 1,
    title: "Earning QRCoins ✨",
    streamer: "Beauty Rossi",
    avatar: stylist1,
    thumbnail: beauty1,
    viewers: 1340,
    earnings: 358,
    isLive: true,
  },
  {
    id: 2,
    title: "Balayage Tutorial",
    streamer: "Martina Rossi",
    avatar: stylist2,
    thumbnail: beauty2,
    viewers: 890,
    earnings: 125,
    isLive: true,
  },
];

const reactions = [
  { icon: "❤️", label: "Love" },
  { icon: "🔥", label: "Fire" },
  { icon: "👏", label: "Applause" },
  { icon: "😍", label: "Wow" },
  { icon: "⭐", label: "Star" },
];

export default function LiveStreamPage() {
  const navigate = useNavigate();
  const [selectedStream, setSelectedStream] = useState<number | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; emoji: string }[]>([]);

  const sendReaction = (emoji: string) => {
    const id = Date.now();
    setFloatingReactions(prev => [...prev, { id, emoji }]);
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== id));
    }, 2000);
  };

  if (selectedStream !== null) {
    const stream = liveStreams.find(s => s.id === selectedStream)!;
    return (
      <MobileLayout>
        <div className="relative min-h-screen">
          {/* Full screen stream */}
          <img src={stream.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background/90" />

          {/* Floating reactions */}
          <div className="absolute right-4 bottom-40 flex flex-col-reverse gap-2">
            {floatingReactions.map(r => (
              <span key={r.id} className="text-3xl animate-float opacity-80">{r.emoji}</span>
            ))}
          </div>

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between p-4">
            <button onClick={() => setSelectedStream(null)} className="w-9 h-9 rounded-full glass flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-live text-primary-foreground text-xs font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground live-pulse" /> LIVE
              </span>
              <span className="flex items-center gap-1 px-2 py-1 rounded-full glass text-xs">
                <Eye className="w-3 h-3" /> {stream.viewers}
              </span>
            </div>
          </div>

          {/* Streamer info */}
          <div className="relative z-10 px-4 mt-2">
            <div className="flex items-center gap-3 glass rounded-2xl p-3">
              <img src={stream.avatar} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-primary" />
              <div className="flex-1">
                <p className="font-semibold">{stream.streamer}</p>
                <p className="text-xs text-muted-foreground">{stream.title}</p>
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full gradient-gold">
                <span className="text-xs font-bold text-gold-foreground">💰 €{stream.earnings}</span>
              </div>
            </div>
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-20 left-0 right-0 z-10 px-4">
            {/* Chat messages area */}
            <div className="mb-3 space-y-2">
              <div className="glass rounded-xl px-3 py-2 max-w-[80%]">
                <p className="text-xs"><span className="text-primary font-semibold">Anna_Style:</span> Bellissimo! 😍</p>
              </div>
              <div className="glass rounded-xl px-3 py-2 max-w-[80%]">
                <p className="text-xs"><span className="text-gold font-semibold">Marco88:</span> Sent 10 QRCoins! 🎉</p>
              </div>
            </div>

            {/* Reactions */}
            <div className="flex items-center gap-2 mb-3">
              {reactions.map(r => (
                <button
                  key={r.label}
                  onClick={() => sendReaction(r.icon)}
                  className="w-10 h-10 rounded-full glass flex items-center justify-center text-lg hover:scale-125 transition-transform"
                >
                  {r.icon}
                </button>
              ))}
              <button className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center">
                <Gift className="w-5 h-5 text-gold-foreground" />
              </button>
            </div>

            {/* Chat input */}
            <div className="flex gap-2">
              <input
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                placeholder="Say something..."
                className="flex-1 h-10 rounded-full glass px-4 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground"
              />
              <button className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                <Send className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-display font-bold">Live Beauty Stream</h1>
          <button className="px-4 py-2 rounded-full gradient-live text-primary-foreground text-sm font-bold flex items-center gap-1.5">
            📹 Go Live
          </button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Live Now</h2>
        
        {liveStreams.map(stream => (
          <button
            key={stream.id}
            onClick={() => setSelectedStream(stream.id)}
            className="w-full rounded-2xl overflow-hidden bg-card shadow-card relative aspect-[3/4] block"
          >
            <img src={stream.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 to-background/80" />
            
            <div className="absolute top-3 left-3 flex gap-2">
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-live text-primary-foreground text-xs font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground live-pulse" /> LIVE
              </span>
            </div>
            <div className="absolute top-3 right-3 flex items-center gap-1 glass px-2 py-1 rounded-full">
              <Eye className="w-3 h-3" />
              <span className="text-xs font-medium">{stream.viewers}</span>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-3">
                <img src={stream.avatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-primary" />
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm">{stream.streamer}</p>
                  <p className="text-xs text-muted-foreground">{stream.title}</p>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full gradient-gold">
                  <span className="text-xs font-bold text-gold-foreground">💰 €{stream.earnings}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </MobileLayout>
  );
}
