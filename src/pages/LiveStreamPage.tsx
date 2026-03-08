import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, Heart, MessageCircle, Gift, Send, Coins, X, Share2, Users, Crown, Sparkles, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQRCoinRewards } from "@/hooks/useQRCoinRewards";
import MobileLayout from "@/components/layout/MobileLayout";
import LiveShopPanel from "@/components/live/LiveShopPanel";
import { toast } from "sonner";

interface LiveStream {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  viewer_count: number;
  total_tips: number;
  total_earnings: number;
  status: string;
  professional?: {
    id: string;
    business_name: string;
    rating: number | null;
  };
}

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  type: 'chat' | 'tip' | 'join';
  amount?: number;
}

interface FloatingReaction {
  id: number;
  emoji: string;
  x: number;
}

const reactionEmojis = [
  { emoji: "❤️", label: "Amore" },
  { emoji: "🔥", label: "Fuoco" },
  { emoji: "👏", label: "Applauso" },
  { emoji: "😍", label: "Wow" },
  { emoji: "⭐", label: "Stella" },
];

const tipAmounts = [5, 10, 25, 50, 100, 500];

export default function LiveStreamPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [showTipModal, setShowTipModal] = useState(false);
  const [selectedTip, setSelectedTip] = useState<number>(10);
  const [loading, setLoading] = useState(true);
  const [showShop, setShowShop] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const watchTimerRef = useRef<number | null>(null);
  const { awardCoins } = useQRCoinRewards();

  useEffect(() => {
    fetchStreams();
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Auto-earn QRCoin every minute while watching
  useEffect(() => {
    if (selectedStream) {
      watchTimerRef.current = window.setInterval(() => {
        awardCoins("watch_live", true);
      }, 60_000);
      // Award on join
      awardCoins("watch_live");
    }
    return () => { if (watchTimerRef.current) clearInterval(watchTimerRef.current); };
  }, [selectedStream]);

  const fetchStreams = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('live_streams')
      .select(`
        *,
        professional:professionals(id, business_name, rating)
      `)
      .in('status', ['live', 'scheduled'])
      .order('viewer_count', { ascending: false });

    if (data) {
      setStreams(data.map(s => ({
        ...s,
        professional: Array.isArray(s.professional) ? s.professional[0] : s.professional
      })));
    }
    setLoading(false);
  };

  const sendReaction = (emoji: string) => {
    if (!selectedStream) return;
    
    const id = Date.now() + Math.random();
    const x = 20 + Math.random() * 60;
    setFloatingReactions(prev => [...prev, { id, emoji, x }]);
    
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== id));
    }, 2500);

    // Save reaction to database
    if (user) {
      supabase.from('stream_reactions').insert({
        stream_id: selectedStream.id,
        user_id: user.id,
        reaction_type: emoji
      });
    }
  };

  const sendChat = async () => {
    if (!chatMessage.trim() || !selectedStream || !user) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      user: profile?.display_name || 'You',
      message: chatMessage,
      type: 'chat'
    };

    setChatMessages(prev => [...prev, newMessage]);
    setChatMessage("");

    // Save to database
    await supabase.from('stream_comments').insert({
      stream_id: selectedStream.id,
      user_id: user.id,
      message: chatMessage
    });
  };

  const sendTip = async () => {
    if (!selectedStream || !user) {
      toast.error("Devi effettuare l'accesso per inviare regali");
      return;
    }

    const qrCoins = profile?.qr_coins || 0;
    if (qrCoins < selectedTip) {
      toast.error("QR Coins insufficienti");
      navigate("/qr-coins");
      return;
    }

    try {
      // Save tip
      await supabase.from('stream_tips').insert({
        stream_id: selectedStream.id,
        user_id: user.id,
        amount: selectedTip
      });

      // Deduct from wallet
      await supabase
        .from('profiles')
        .update({ qr_coins: qrCoins - selectedTip })
        .eq('user_id', user.id);

      const tipMessage: ChatMessage = {
        id: Date.now().toString(),
        user: profile?.display_name || 'You',
        message: `Ha inviato ${selectedTip} QRCoins! 🎉`,
        type: 'tip',
        amount: selectedTip
      };

      setChatMessages(prev => [...prev, tipMessage]);
      setShowTipModal(false);
      toast.success(`Inviati ${selectedTip} QRCoins!`);
    } catch (error) {
      toast.error("Errore nell'invio del regalo");
    }
  };

  // Watch Stream View
  if (selectedStream) {
    return (
      <MobileLayout>
        <div className="relative min-h-screen bg-background">
          {/* Video Background */}
          <div className="absolute inset-0">
            <img 
              src={selectedStream.thumbnail_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800'} 
              alt="" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-transparent to-background/95" />
          </div>

          {/* Floating Reactions */}
          <div className="absolute right-4 bottom-56 flex flex-col-reverse gap-1 pointer-events-none z-20">
            {floatingReactions.map(r => (
              <span
                key={r.id}
                className="text-3xl animate-float-up"
                style={{ marginLeft: `${r.x - 50}px` }}
              >
                {r.emoji}
              </span>
            ))}
          </div>

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between p-4">
            <button 
              onClick={() => setSelectedStream(null)} 
              className="w-10 h-10 rounded-full glass flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-live text-primary-foreground text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-primary-foreground live-pulse" />
                LIVE
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-sm">
                <Eye className="w-4 h-4" />
                {selectedStream.viewer_count.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Streamer Info */}
          <div className="relative z-10 px-4 mt-4">
            <div className="flex items-center gap-4 glass rounded-2xl p-4">
              <div className="relative">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedStream.professional?.id}`}
                  alt=""
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-live border-2 border-background flex items-center justify-center">
                  <Crown className="w-3 h-3 text-primary-foreground" />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg">{selectedStream.professional?.business_name || 'Beauty Streamer'}</p>
                <p className="text-sm text-muted-foreground">{selectedStream.title}</p>
              </div>
              <button className="px-4 py-2 rounded-full gradient-primary text-primary-foreground text-sm font-bold">
                Segui
              </button>
            </div>

            {/* QRCoin Earnings Banner */}
            <div className="flex items-center justify-between mt-3 glass rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center">
                  <Coins className="w-5 h-5 text-gold-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">QRCoin Guadagnati</p>
                  <p className="text-xl font-bold text-gradient-gold">
                    {selectedStream.total_earnings.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowTipModal(true)}
                  className="px-4 py-2 rounded-full gradient-gold text-gold-foreground text-sm font-bold flex items-center gap-1.5"
                >
                  <Gift className="w-4 h-4" />
                   Invia Regalo
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 z-10 p-4 pb-24">
            {/* Chat Messages */}
            <div 
              ref={chatRef}
              className="mb-4 space-y-2 max-h-40 overflow-y-auto no-scrollbar"
            >
              {chatMessages.slice(-8).map(msg => (
                <div 
                  key={msg.id} 
                  className={`glass rounded-xl px-3 py-2 max-w-[85%] fade-in ${
                    msg.type === 'tip' ? 'border border-gold/30' : ''
                  }`}
                >
                  <p className="text-sm">
                    <span className={`font-semibold ${
                      msg.type === 'tip' ? 'text-gold' : 'text-primary'
                    }`}>
                      {msg.user}:
                    </span>{' '}
                    {msg.message}
                  </p>
                </div>
              ))}
            </div>

            {/* Reactions */}
            <div className="flex items-center gap-2 mb-3">
              {reactionEmojis.map(r => (
                <button
                  key={r.label}
                  onClick={() => sendReaction(r.emoji)}
                  className="w-11 h-11 rounded-full glass flex items-center justify-center text-xl hover:scale-125 transition-transform active:scale-90"
                >
                  {r.emoji}
                </button>
              ))}
              <button
                onClick={() => setShowTipModal(true)}
                className="w-11 h-11 rounded-full gradient-gold flex items-center justify-center shadow-lg"
              >
                <Gift className="w-5 h-5 text-gold-foreground" />
              </button>
              <button className="w-11 h-11 rounded-full glass flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Input */}
            <div className="flex gap-2">
              <input
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendChat()}
                placeholder="Scrivi qualcosa..."
                className="flex-1 h-12 rounded-full glass px-5 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground"
              />
              <button 
                onClick={sendChat}
                className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center shadow-glow"
              >
                <Send className="w-5 h-5 text-primary-foreground" />
              </button>
            </div>
          </div>

          {/* Tip Modal */}
          {showTipModal && (
            <div className="absolute inset-0 z-40 flex items-end">
              <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setShowTipModal(false)} />
              <div className="relative w-full glass rounded-t-3xl p-6 slide-up">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center">
                      <Gift className="w-5 h-5 text-gold-foreground" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg">Invia un Regalo</h3>
                      <p className="text-xs text-muted-foreground">Supporta il tuo creator preferito</p>
                    </div>
                  </div>
                  <button onClick={() => setShowTipModal(false)}>
                    <X className="w-6 h-6 text-muted-foreground" />
                  </button>
                </div>

                <p className="text-sm text-muted-foreground mb-3">
                  Il tuo saldo: <span className="text-gold font-bold">{profile?.qr_coins?.toLocaleString() || 0} QRC</span>
                </p>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {tipAmounts.map(amt => (
                    <button 
                      key={amt} 
                      onClick={() => setSelectedTip(amt)}
                      className={`py-4 rounded-xl text-center transition-all ${
                        selectedTip === amt
                          ? "gradient-gold text-gold-foreground scale-105 shadow-lg"
                          : "bg-card border border-border hover:border-gold/50"
                      }`}
                    >
                      <p className="text-lg font-bold">{amt}</p>
                      <p className="text-[10px] opacity-70">QRC</p>
                    </button>
                  ))}
                </div>

                <button 
                  onClick={sendTip}
                  className="w-full py-4 rounded-xl gradient-primary text-primary-foreground font-bold text-lg shadow-glow flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                   Invia {selectedTip} QRCoins
                </button>
              </div>
            </div>
          )}
        </div>
      </MobileLayout>
    );
  }

  // Streams List View
  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Live Beauty</h1>
            <p className="text-sm text-muted-foreground">Guarda tutorial e guadagna QRCoins</p>
          </div>
          <button className="px-4 py-2.5 rounded-full gradient-live text-primary-foreground text-sm font-bold flex items-center gap-2 shadow-glow">
            📹 Go Live
          </button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-card animate-pulse" />
            ))}
          </div>
        ) : streams.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nessuna Diretta</h3>
            <p className="text-muted-foreground text-sm">Sii il primo a trasmettere in diretta!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {streams.map(stream => (
              <button
                key={stream.id}
                onClick={() => setSelectedStream(stream)}
                className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-card shadow-card group"
              >
                <img 
                  src={stream.thumbnail_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800'} 
                  alt="" 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/90" />

                {/* Live Badge */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-live text-primary-foreground text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-primary-foreground live-pulse" />
                    LIVE
                  </span>
                </div>

                {/* Viewer Count */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-sm font-medium">
                    <Eye className="w-4 h-4" />
                    {stream.viewer_count.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full gradient-gold text-gold-foreground text-xs font-bold">
                    <Coins className="w-3.5 h-3.5" />
                    €{stream.total_earnings}
                  </span>
                </div>

                {/* Streamer Info */}
                <div className="absolute bottom-0 inset-x-0 p-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${stream.professional?.id}`}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover border-2 border-primary"
                    />
                    <div className="flex-1 text-left">
                      <p className="font-bold">{stream.professional?.business_name || 'Beauty Streamer'}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{stream.title}</p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
