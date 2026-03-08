import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Send, Image, Gift, Phone, Video, Search, Plus, Briefcase, Mic, MicOff, Paperclip, Play, Pause, X, File, Camera } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";
import beauty2 from "@/assets/beauty-2.jpg";

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  isJobChat?: boolean;
}

const fallbackConversations: Conversation[] = [
  { id: "1", name: "Martina Rossi", avatar: stylist2, lastMessage: "Perfetto, ci vediamo alle 15! 💇‍♀️", time: "14:30", unread: 2, online: true },
  { id: "2", name: "Beauty Rossi", avatar: stylist1, lastMessage: "Grazie per la recensione! ❤️", time: "12:15", unread: 0, online: true },
  { id: "3", name: "Salon Luxe", avatar: beauty2, lastMessage: "Il tuo appuntamento è confermato", time: "Ieri", unread: 1, online: false },
  { id: "4", name: "Anna Style", avatar: stylist1, lastMessage: "Hai visto il nuovo trattamento?", time: "Ieri", unread: 0, online: false },
  { id: "5", name: "Marco Barber", avatar: beauty2, lastMessage: "Ciao! Come posso aiutarti?", time: "2g fa", unread: 0, online: false },
];

type MessageType = "text" | "image" | "video" | "voice" | "file" | "job_application";

interface Message {
  id: string;
  sender: "me" | "other";
  content: string;
  time: string;
  type: MessageType;
  mediaUrl?: string;
  fileName?: string;
  duration?: number; // voice duration in seconds
}

export default function ChatPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [conversations] = useState(fallbackConversations);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "jobs">("all");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (id) {
      const chat = conversations.find(c => c.id === id);
      if (chat) { setSelectedChat(chat); loadMessages(chat.id); }
    }
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = (chatId: string) => {
    setMessages([
      { id: "1", sender: "other", content: "Ciao! Ho visto il tuo profilo 😊", time: "14:20", type: "text" },
      { id: "2", sender: "me", content: "Ciao! Certo, come posso aiutarti?", time: "14:22", type: "text" },
      { id: "3", sender: "other", content: "", time: "14:23", type: "image", mediaUrl: stylist1 },
      { id: "4", sender: "other", content: "Vorrei questo tipo di taglio!", time: "14:24", type: "text" },
      { id: "5", sender: "me", content: "", time: "14:26", type: "voice", duration: 8 },
      { id: "6", sender: "other", content: "Perfetto, ci vediamo alle 15! 💇‍♀️", time: "14:30", type: "text" },
    ]);
  };

  const now = () => new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const msg: Message = { id: Date.now().toString(), sender: "me", content: newMessage, time: now(), type: "text" };
    setMessages(prev => [...prev, msg]);
    setNewMessage("");
    simulateReply();
  };

  const simulateReply = () => {
    setTimeout(() => {
      const replies = ["Perfetto! 😊", "Fantastico! ✨", "Ok, grazie! 💕", "A presto! 🎉", "Ti invio i dettagli! 📋"];
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), sender: "other",
        content: replies[Math.floor(Math.random() * replies.length)],
        time: now(), type: "text",
      }]);
    }, 1500);
  };

  // ===== FILE UPLOAD =====
  const uploadFile = async (file: File, type: MessageType) => {
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) { toast.error("File troppo grande (max 20MB)"); return; }

    // Try uploading to storage
    const fileName = `${Date.now()}_${file.name}`;
    const bucket = type === "image" ? "posts" : "posts";
    const { data, error } = await supabase.storage.from(bucket).upload(`chat/${fileName}`, file);

    let mediaUrl: string;
    if (data) {
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(`chat/${fileName}`);
      mediaUrl = urlData.publicUrl;
    } else {
      // Fallback to local URL
      mediaUrl = URL.createObjectURL(file);
    }

    const msg: Message = {
      id: Date.now().toString(), sender: "me", content: "",
      time: now(), type, mediaUrl, fileName: file.name,
    };
    setMessages(prev => [...prev, msg]);
    setShowAttachMenu(false);
    toast.success(`${type === "image" ? "Immagine" : type === "video" ? "Video" : "File"} inviato!`);
    simulateReply();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: MessageType) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, type);
    e.target.value = "";
  };

  // ===== VOICE RECORDING =====
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const duration = recordingTime;

        // Upload voice
        const fileName = `voice_${Date.now()}.webm`;
        const { data } = await supabase.storage.from("posts").upload(`chat/${fileName}`, audioBlob);
        let mediaUrl: string;
        if (data) {
          const { data: urlData } = supabase.storage.from("posts").getPublicUrl(`chat/${fileName}`);
          mediaUrl = urlData.publicUrl;
        } else {
          mediaUrl = URL.createObjectURL(audioBlob);
        }

        const msg: Message = {
          id: Date.now().toString(), sender: "me", content: "",
          time: now(), type: "voice", mediaUrl, duration,
        };
        setMessages(prev => [...prev, msg]);
        simulateReply();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      toast.error("Impossibile accedere al microfono");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingTime(0);
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    audioChunksRef.current = [];
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const sendJobApplication = () => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(), sender: "me",
      content: "📋 Ho inviato la mia candidatura! Ecco il mio profilo e CV.",
      time: now(), type: "job_application",
    }]);
  };

  const openWhatsApp = (name: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Ciao ${name}! Ti contatto tramite Style App.`)}`, "_blank");
  };

  const filteredConversations = conversations.filter(c => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (activeTab === "jobs") return c.isJobChat;
    return true;
  });

  // ===== VOICE MESSAGE BUBBLE =====
  const VoiceBubble = ({ msg }: { msg: Message }) => {
    const isPlaying = playingVoice === msg.id;
    return (
      <button
        onClick={() => setPlayingVoice(isPlaying ? null : msg.id)}
        className="flex items-center gap-2 min-w-[140px]"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${msg.sender === "me" ? "bg-primary-foreground/20" : "bg-primary/20"}`}>
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </div>
        <div className="flex-1">
          <div className="flex gap-0.5">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className={`w-1 rounded-full ${msg.sender === "me" ? "bg-primary-foreground/40" : "bg-muted-foreground/40"}`}
                style={{ height: `${Math.random() * 16 + 4}px` }} />
            ))}
          </div>
        </div>
        <span className={`text-[10px] ${msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {formatDuration(msg.duration || 0)}
        </span>
      </button>
    );
  };

  // ===== CHAT THREAD =====
  if (selectedChat) {
    return (
      <MobileLayout>
        <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
          <button onClick={() => { setSelectedChat(null); navigate("/chat"); }} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button onClick={() => navigate(`/stylist/${selectedChat.id}`)} className="flex items-center gap-2 flex-1">
            <img src={selectedChat.avatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-primary" />
            <div>
              <p className="font-semibold text-sm">{selectedChat.name}</p>
              <p className={`text-[10px] ${selectedChat.online ? "text-green-500" : "text-muted-foreground"}`}>
                {selectedChat.online ? "● Online" : "Offline"}
              </p>
            </div>
          </button>
          <button onClick={() => openWhatsApp(selectedChat.name)} className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center">
            <span className="text-sm">💬</span>
          </button>
          <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <Phone className="w-4 h-4 text-muted-foreground" />
          </button>
          <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <Video className="w-4 h-4 text-muted-foreground" />
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 px-4 py-4 space-y-3 min-h-[60vh]">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"} fade-in`}>
              <div className={`max-w-[75%] rounded-2xl overflow-hidden ${
                msg.type === "job_application"
                  ? "bg-accent/10 border border-accent/30 rounded-br-md px-4 py-2.5"
                  : msg.type === "image" || msg.type === "video"
                    ? "shadow-card"
                    : msg.sender === "me"
                      ? "gradient-primary text-primary-foreground rounded-br-md px-4 py-2.5"
                      : "bg-card border border-border rounded-bl-md px-4 py-2.5"
              }`}>
                {/* Job application */}
                {msg.type === "job_application" && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <Briefcase className="w-3 h-3 text-accent" />
                    <span className="text-[10px] font-bold text-accent">Candidatura</span>
                  </div>
                )}

                {/* Image */}
                {msg.type === "image" && msg.mediaUrl && (
                  <button onClick={() => setPreviewMedia({ url: msg.mediaUrl!, type: "image" })} className="block">
                    <img src={msg.mediaUrl} alt="" className="w-full max-w-[240px] rounded-xl object-cover" />
                  </button>
                )}

                {/* Video */}
                {msg.type === "video" && msg.mediaUrl && (
                  <video src={msg.mediaUrl} controls className="w-full max-w-[240px] rounded-xl" />
                )}

                {/* Voice */}
                {msg.type === "voice" && <VoiceBubble msg={msg} />}

                {/* File */}
                {msg.type === "file" && (
                  <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 min-w-[140px]">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${msg.sender === "me" ? "bg-primary-foreground/20" : "bg-primary/10"}`}>
                      <File className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{msg.fileName || "File"}</p>
                      <p className={`text-[10px] ${msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>Tap per aprire</p>
                    </div>
                  </a>
                )}

                {/* Text */}
                {msg.content && <p className="text-sm">{msg.content}</p>}

                {/* Time (skip for media-only) */}
                {(msg.type !== "image" && msg.type !== "video") && (
                  <p className={`text-[10px] mt-1 ${msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {msg.time}
                  </p>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Attachment Menu */}
        {showAttachMenu && (
          <div className="px-4 pb-2 flex gap-3 fade-in">
            {[
              { icon: <Camera className="w-5 h-5" />, label: "Foto", color: "bg-primary", action: () => imageInputRef.current?.click() },
              { icon: <Video className="w-5 h-5" />, label: "Video", color: "bg-secondary", action: () => videoInputRef.current?.click() },
              { icon: <File className="w-5 h-5" />, label: "File", color: "bg-accent", action: () => fileInputRef.current?.click() },
            ].map(item => (
              <button key={item.label} onClick={item.action} className="flex flex-col items-center gap-1">
                <div className={`w-12 h-12 rounded-full ${item.color} flex items-center justify-center text-primary-foreground`}>
                  {item.icon}
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Hidden file inputs */}
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e, "image")} />
        <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={e => handleFileSelect(e, "video")} />
        <input ref={fileInputRef} type="file" className="hidden" onChange={e => handleFileSelect(e, "file")} />

        {/* Recording UI */}
        {isRecording ? (
          <div className="sticky bottom-16 glass px-4 py-3 flex items-center gap-3">
            <button onClick={cancelRecording} className="w-9 h-9 rounded-full bg-destructive/20 flex items-center justify-center">
              <X className="w-4 h-4 text-destructive" />
            </button>
            <div className="flex-1 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
              <span className="text-sm font-mono font-semibold text-destructive">{formatDuration(recordingTime)}</span>
              <div className="flex-1 flex items-center gap-0.5">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div key={i} className="w-1 bg-destructive/40 rounded-full animate-pulse"
                    style={{ height: `${Math.random() * 20 + 4}px`, animationDelay: `${i * 50}ms` }} />
                ))}
              </div>
            </div>
            <button onClick={stopRecording} className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center shadow-glow">
              <Send className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>
        ) : (
          /* Normal Input */
          <div className="sticky bottom-16 glass px-4 py-3 flex items-center gap-2">
            <button onClick={() => setShowAttachMenu(!showAttachMenu)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
              <Paperclip className={`w-4 h-4 ${showAttachMenu ? "text-primary" : "text-muted-foreground"}`} />
            </button>
            <button onClick={sendJobApplication} className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center" title="Candidatura">
              <Briefcase className="w-4 h-4 text-accent" />
            </button>
            <input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Scrivi un messaggio..."
              className="flex-1 h-10 rounded-full bg-card border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {newMessage.trim() ? (
              <button onClick={sendMessage} className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-glow">
                <Send className="w-4 h-4 text-primary-foreground" />
              </button>
            ) : (
              <button onClick={startRecording} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Mic className="w-5 h-5 text-primary" />
              </button>
            )}
          </div>
        )}

        {/* Fullscreen Media Preview */}
        {previewMedia && (
          <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center" onClick={() => setPreviewMedia(null)}>
            <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-muted flex items-center justify-center z-10">
              <X className="w-5 h-5" />
            </button>
            {previewMedia.type === "image" ? (
              <img src={previewMedia.url} alt="" className="max-w-full max-h-full object-contain" />
            ) : (
              <video src={previewMedia.url} controls autoPlay className="max-w-full max-h-full" />
            )}
          </div>
        )}
      </MobileLayout>
    );
  }

  // ===== CONVERSATIONS LIST =====
  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold flex-1">Chat</h1>
          <div className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
            {conversations.reduce((a, c) => a + c.unread, 0)}
          </div>
          <button onClick={() => navigate("/stylists")} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cerca conversazioni..." className="w-full h-10 rounded-xl bg-card border border-border pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <div className="flex gap-2">
          {(["all", "jobs"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeTab === tab ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {tab === "all" ? "Tutte" : "💼 Candidature"}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 space-y-2">
        {filteredConversations.map(conv => (
          <button key={conv.id} onClick={() => { setSelectedChat(conv); loadMessages(conv.id); }}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-muted transition-all text-left shadow-card">
            <div className="relative">
              <img src={conv.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
              {conv.online && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-sm truncate">{conv.name}</p>
                  {conv.isJobChat && <Briefcase className="w-3 h-3 text-accent" />}
                </div>
                <span className="text-[10px] text-muted-foreground">{conv.time}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
            </div>
            {conv.unread > 0 && (
              <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary-foreground">{conv.unread}</span>
              </div>
            )}
          </button>
        ))}
        {filteredConversations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">Nessuna conversazione</p>
            <button onClick={() => navigate("/stylists")} className="text-primary text-xs font-semibold mt-2">Inizia una nuova chat</button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
