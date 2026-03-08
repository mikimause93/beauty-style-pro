import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Eye, Heart, MessageCircle, Gift, Send, Coins, X, ThumbsUp, Flame, Star as StarIcon, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import beauty1 from "@/assets/beauty-1.jpg";
import beauty2 from "@/assets/beauty-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";
import { useState, useEffect } from "react";

const liveStreams = [
  {
    id: 1,
    title: "Earning QRCoins ✨",
    streamer: "Beauty Rossi",
    avatar: stylist1,
    thumbnail: beauty1,
    viewers: 1340,
    earnings: 358,
    tips: 88,
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
    tips: 42,
    isLive: true,
  },
  {
    id: 3,
    title: "Evening Glow Routine",
    streamer: "Salon Luxe",
    avatar: beauty3,
    thumbnail: beauty3,
    viewers: 456,
    earnings: 67,
    tips: 15,
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

const chatMessages = [
  { user: "Anna_Style", message: "Bellissimo! 😍", color: "text-primary" },
  { user: "Marco88", message: "Sent 10 QRCoins! 🎉", color: "text-gold" },
  { user: "LauraBeauty", message: "How do you do that?", color: "text-secondary" },
  { user: "GiuliaHair", message: "Amazing technique! 🔥", color: "text-primary" },
];

const tipAmounts = [5, 10, 25, 50, 100];

export default function LiveStreamPage() {
  const navigate = useNavigate();
  const [selectedStream, setSelectedStream] = useState<number | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const [showTipModal, setShowTipModal] = useState(false);
  const [liveChatMsgs, setLiveChatMsgs] = useState(chatMessages);
  const [viewerCounts, setViewerCounts] = useState<Record<number, number>>({});

  // Simulate viewer count changes
  useEffect(() => {
    if (selectedStream === null) return;
    const interval = setInterval(() => {
      setViewerCounts(prev => ({
        ...prev,
        [selectedStream]: (prev[selectedStream] || liveStreams.find(s => s.id === selectedStream)!.viewers) + Math.floor(Math.random() * 5 - 2),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedStream]);

  const sendReaction = (emoji: string) => {
    const id = Date.now() + Math.random();
    const x = 10 + Math.random() * 30;
    setFloatingReactions(prev => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== id));
    }, 2500);
  };

  const sendChat = () => {
    if (!chatMessage.trim()) return;
    setLiveChatMsgs(prev => [...prev, { user: "Tu", message: chatMessage, color: "text-success" }]);
    setChatMessage("");
  };

  // Stream viewer
  if (selectedStream !== null) {
    const stream = liveStreams.find(s => s.id === selectedStream)!;
    const currentViewers = viewerCounts[selectedStream] || stream.viewers;

    return (
      <MobileLayout>
        <div className="relative min-h-screen">
          <img src={stream.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background/90" />

          {/* Floating reactions */}
          <div className="absolute right-4 bottom-44 flex flex-col-reverse gap-2 pointer-events-none">
            {floatingReactions.map(r => (
              <span
                key={r.id}
                className="text-3xl opacity-90"
                style={{
                  animation: "float-up 2.5s ease-out forwards",
                  marginRight: `${r.x}px`,
                }}
              >
                {r.emoji}
              </span>
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
                <Eye className="w-3 h-3" /> {currentViewers.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Streamer info + QRCoin earned */}
          <div className="relative z-10 px-4 mt-2">
            <div className="flex items-center gap-3 glass rounded-2xl p-3">
              <img src={stream.avatar} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-primary" />
              <div className="flex-1">
                <p className="font-semibold">{stream.streamer}</p>
                <p className="text-xs text-muted-foreground">{stream.title}</p>
              </div>
              <button className="px-3 py-1.5 rounded-full gradient-primary text-primary-foreground text-xs font-bold">
                Follow
              </button>
            </div>

            {/* QRCoin Earned Banner */}
            <div className="flex items-center justify-between mt-3 glass rounded-xl p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center">
                  <Coins className="w-4 h-4 text-gold-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">QRCoin Earned</p>
                  <p className="text-sm font-bold text-gradient-gold">{stream.earnings}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-full gradient-gold text-gold-foreground text-xs font-bold">
                  Send Gift
                </button>
                <button className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-bold">
                  Tip €{stream.tips}
                </button>
              </div>
            </div>
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-20 left-0 right-0 z-10 px-4">
            {/* Chat messages */}
            <div className="mb-3 space-y-2 max-h-32 overflow-y-auto no-scrollbar">
              {liveChatMsgs.slice(-5).map((msg, i) => (
                <div key={i} className="glass rounded-xl px-3 py-2 max-w-[80%] fade-in">
                  <p className="text-xs">
                    <span className={`font-semibold ${msg.color}`}>{msg.user}:</span> {msg.message}
                  </p>
                </div>
              ))}
            </div>

            {/* Reactions */}
            <div className="flex items-center gap-2 mb-3">
              {reactions.map(r => (
                <button
                  key={r.label}
                  onClick={() => sendReaction(r.icon)}
                  className="w-10 h-10 rounded-full glass flex items-center justify-center text-lg hover:scale-125 transition-transform active:scale-90"
                >
                  {r.icon}
                </button>
              ))}
              <button
                onClick={() => setShowTipModal(true)}
                className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center"
              >
                <Gift className="w-5 h-5 text-gold-foreground" />
              </button>
            </div>

            {/* Chat input */}
            <div className="flex gap-2">
              <input
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendChat()}
                placeholder="Say something..."
                className="flex-1 h-10 rounded-full glass px-4 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground"
              />
              <button onClick={sendChat} className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                <Send className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
          </div>

          {/* Tip Modal */}
          {showTipModal && (
            <div className="absolute inset-0 z-30 flex items-end">
              <div className="absolute inset-0 bg-background/60" onClick={() => setShowTipModal(false)} />
              <div className="relative w-full glass rounded-t-3xl p-6 slide-up">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-lg">Send a Tip 💰</h3>
                  <button onClick={() => setShowTipModal(false)}>
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                <div className="flex gap-2 mb-4">
                  {tipAmounts.map(amt => (
                    <button key={amt} className="flex-1 py-3 rounded-xl bg-card border border-border text-center hover:border-primary/50 transition-all">
                      <p className="text-sm font-bold">€{amt}</p>
                    </button>
                  ))}
                </div>
                <button className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-bold shadow-glow">
                  Send Tip
                </button>
              </div>
            </div>
          )}
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
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Live Now · {liveStreams.length} streams
        </h2>

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
              <span className="text-xs font-medium">{stream.viewers.toLocaleString()}</span>
            </div>

            {/* Earnings badge */}
            <div className="absolute top-12 right-3 flex items-center gap-1 px-2 py-1 rounded-full gradient-gold">
              <Coins className="w-3 h-3 text-gold-foreground" />
              <span className="text-[10px] font-bold text-gold-foreground">€{stream.earnings}</span>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-3">
                <img src={stream.avatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-primary" />
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm">{stream.streamer}</p>
                  <p className="text-xs text-muted-foreground">{stream.title}</p>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </MobileLayout>
  );
}
