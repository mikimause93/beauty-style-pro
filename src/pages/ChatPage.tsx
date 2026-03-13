import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Send, Image, Phone, Video, Search, Mic, MicOff, Paperclip, Play, Pause, X, File, Camera, Briefcase, MessageCircle, UserPlus, Globe, Languages } from "lucide-react";
import AutoMessageSuggestions from "@/components/chat/AutoMessageSuggestions";
import { useTranslation } from "@/hooks/useTranslation";
import AutoMessageSuggestions from "@/components/chat/AutoMessageSuggestions";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
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
  otherUserId: string;
}

type MessageType = "text" | "image" | "video" | "voice" | "file" | "job_application";

interface Message {
  id: string;
  sender: "me" | "other";
  content: string;
  time: string;
  type: MessageType;
  mediaUrl?: string;
  fileName?: string;
  duration?: number;
}

interface SearchedUser {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

const fallbackAvatars = [stylist2, stylist1, beauty2];

export default function ChatPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchedUsers, setSearchedUsers] = useState<SearchedUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayRef = useRef<HTMLAudioElement | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [inCall, setInCall] = useState<"voice" | "video" | null>(null);
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});
  const { translate, translating, targetLang, setTargetLang, LANGUAGES } = useTranslation();
  const [showLangPicker, setShowLangPicker] = useState(false);

  useEffect(() => {
    if (user) loadConversations();
  }, [user]);

  useEffect(() => {
    if (id && conversations.length > 0) {
      const chat = conversations.find(c => c.id === id);
      if (chat) { setSelectedChat(chat); loadMessages(chat.id); }
    }
  }, [id, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Search registered users when typing
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchedUsers([]);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      setSearchingUsers(true);
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .ilike("display_name", `%${searchQuery}%`)
        .neq("user_id", user?.id || "")
        .limit(10);
      setSearchedUsers(data || []);
      setSearchingUsers(false);
    }, 300);
  }, [searchQuery, user]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!selectedChat) return;
    const channel = supabase
      .channel(`messages-${selectedChat.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedChat.id}`,
      }, (payload) => {
        const msg = payload.new as any;
        if (msg.sender_id !== user?.id) {
          setMessages(prev => [...prev, {
            id: msg.id,
            sender: "other",
            content: msg.content,
            time: new Date(msg.created_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
            type: msg.message_type || "text",
            mediaUrl: msg.image_url,
          }]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedChat, user]);

  const loadConversations = async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order("last_message_at", { ascending: false });

    if (data && data.length > 0) {
      const otherUserIds = data.map(c => c.participant_1 === user.id ? c.participant_2 : c.participant_1);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", otherUserIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      setConversations(data.map((c, i) => {
        const otherId = c.participant_1 === user.id ? c.participant_2 : c.participant_1;
        const profile = profileMap.get(otherId);
        return {
          id: c.id,
          name: profile?.display_name || "Utente",
          avatar: profile?.avatar_url || fallbackAvatars[i % fallbackAvatars.length],
          lastMessage: c.last_message || "Nessun messaggio",
          time: c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : "",
          unread: 0,
          online: false,
          otherUserId: otherId,
        };
      }));
    }
    setLoading(false);
  };

  const loadMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (data) {
      setMessages(data.map(m => ({
        id: m.id,
        sender: m.sender_id === user?.id ? "me" : "other",
        content: m.content,
        time: new Date(m.created_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
        type: (m.message_type || "text") as MessageType,
        mediaUrl: m.image_url || undefined,
      })));
      await supabase.from("messages").update({ read: true }).eq("conversation_id", conversationId).neq("sender_id", user?.id || "");
    }
  };

  const startNewChat = async (otherUser: SearchedUser) => {
    if (!user) return;
    // Check if conversation already exists
    const existing = conversations.find(c => c.otherUserId === otherUser.user_id);
    if (existing) {
      setSelectedChat(existing);
      loadMessages(existing.id);
      navigate(`/chat/${existing.id}`);
      setSearchQuery("");
      setSearchedUsers([]);
      return;
    }

    // Create new conversation
    const { data, error } = await supabase.from("conversations").insert({
      participant_1: user.id,
      participant_2: otherUser.user_id,
    }).select().single();

    if (data && !error) {
      const newConv: Conversation = {
        id: data.id,
        name: otherUser.display_name || "Utente",
        avatar: otherUser.avatar_url || fallbackAvatars[0],
        lastMessage: "Nessun messaggio",
        time: "",
        unread: 0,
        online: false,
        otherUserId: otherUser.user_id,
      };
      setConversations(prev => [newConv, ...prev]);
      setSelectedChat(newConv);
      setMessages([]);
      navigate(`/chat/${data.id}`);
      setSearchQuery("");
      setSearchedUsers([]);
    }
  };

  const now = () => new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user) return;
    const content = newMessage;
    setNewMessage("");
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: "me", content, time: now(), type: "text" }]);
    await supabase.from("messages").insert({
      conversation_id: selectedChat.id,
      sender_id: user.id,
      content,
      message_type: "text",
    });
  };

  const uploadFile = async (file: File, type: MessageType) => {
    if (!selectedChat || !user) return;
    if (file.size > 20 * 1024 * 1024) { toast.error("File troppo grande (max 20MB)"); return; }
    const fileName = `${Date.now()}_${file.name}`;
    const { data } = await supabase.storage.from("posts").upload(`chat/${fileName}`, file);
    let mediaUrl: string;
    if (data) {
      const { data: urlData } = supabase.storage.from("posts").getPublicUrl(`chat/${fileName}`);
      mediaUrl = urlData.publicUrl;
    } else {
      mediaUrl = URL.createObjectURL(file);
    }
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: "me", content: "", time: now(), type, mediaUrl, fileName: file.name }]);
    await supabase.from("messages").insert({
      conversation_id: selectedChat.id,
      sender_id: user.id,
      content: `[${type}] ${file.name}`,
      message_type: type,
      image_url: mediaUrl,
    });
    setShowAttachMenu(false);
    toast.success(`${type === "image" ? "Immagine" : type === "video" ? "Video" : "File"} inviato!`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: MessageType) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, type);
    e.target.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const duration = recordingTime;
        const fName = `voice_${Date.now()}.webm`;
        const { data } = await supabase.storage.from("posts").upload(`chat/${fName}`, audioBlob);
        let mediaUrl: string;
        if (data) {
          const { data: urlData } = supabase.storage.from("posts").getPublicUrl(`chat/${fName}`);
          mediaUrl = urlData.publicUrl;
        } else {
          mediaUrl = URL.createObjectURL(audioBlob);
        }
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: "me", content: "", time: now(), type: "voice", mediaUrl, duration }]);
        if (selectedChat && user) {
          await supabase.from("messages").insert({
            conversation_id: selectedChat.id,
            sender_id: user.id,
            content: `[voice] ${duration}s`,
            message_type: "voice",
            image_url: mediaUrl,
          });
        }
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

  const openWhatsApp = (name: string, otherUserId: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Ciao ${name}! Ti contatto tramite STYLE App.`)}`, "_blank");
  };

  const startCall = (type: "voice" | "video") => {
    setInCall(type);
    toast.info(type === "voice" ? "Chiamata vocale avviata..." : "Videochiamata avviata...");
    // WebRTC placeholder - in production use Agora/Twilio
  };

  const endCall = () => {
    setInCall(null);
    toast.success("Chiamata terminata");
  };

  const translateMessage = async (msgId: string, text: string) => {
    if (translatedMessages[msgId]) {
      setTranslatedMessages(prev => { const n = { ...prev }; delete n[msgId]; return n; });
      return;
    }
    const translated = await translate(text);
    setTranslatedMessages(prev => ({ ...prev, [msgId]: translated }));
  };

  const filteredConversations = conversations.filter(c =>
    !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleVoicePlay = (msg: Message) => {
    if (playingVoice === msg.id) {
      audioPlayRef.current?.pause();
      setPlayingVoice(null);
    } else {
      if (audioPlayRef.current) audioPlayRef.current.pause();
      const audio = new Audio(msg.mediaUrl);
      audio.onended = () => setPlayingVoice(null);
      audio.play().catch(() => toast.error("Impossibile riprodurre audio"));
      audioPlayRef.current = audio;
      setPlayingVoice(msg.id);
    }
  };

  const VoiceBubble = ({ msg }: { msg: Message }) => {
    const isPlaying = playingVoice === msg.id;
    return (
      <button onClick={() => toggleVoicePlay(msg)} className="flex items-center gap-2 min-w-[140px]">
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
          <button onClick={() => navigate(`/profile/${selectedChat.otherUserId}`)} className="flex items-center gap-2 flex-1">
            <img src={selectedChat.avatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-primary" />
            <div>
              <p className="font-semibold text-sm">{selectedChat.name}</p>
              <p className="text-[10px] text-muted-foreground">Chat</p>
            </div>
          </button>
          <button onClick={() => openWhatsApp(selectedChat.name, selectedChat.otherUserId)} className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-primary-foreground" />
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
          {messages.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Inizia la conversazione!</p>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"} fade-in`}>
              <div className={`max-w-[75%] rounded-2xl overflow-hidden ${
                msg.type === "image" || msg.type === "video"
                  ? "shadow-card"
                  : msg.sender === "me"
                    ? "gradient-primary text-primary-foreground rounded-br-md px-4 py-2.5"
                    : "bg-card border border-border rounded-bl-md px-4 py-2.5"
              }`}>
                {msg.type === "image" && msg.mediaUrl && (
                  <img src={msg.mediaUrl} alt="" className="w-full max-w-[240px] rounded-xl object-cover" />
                )}
                {msg.type === "video" && msg.mediaUrl && (
                  <video src={msg.mediaUrl} controls className="w-full max-w-[240px] rounded-xl" />
                )}
                {msg.type === "voice" && <VoiceBubble msg={msg} />}
                {msg.type === "file" && (
                  <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 min-w-[140px]">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${msg.sender === "me" ? "bg-primary-foreground/20" : "bg-primary/10"}`}>
                      <File className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{msg.fileName || "File"}</p>
                      <p className={`text-[10px] ${msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>Tocca per aprire</p>
                    </div>
                  </a>
                )}
                {msg.content && <p className="text-sm">{msg.content}</p>}
                {msg.type !== "image" && msg.type !== "video" && (
                  <p className={`text-[10px] mt-1 ${msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{msg.time}</p>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Attach menu */}
        {showAttachMenu && (
          <div className="px-4 pb-2 flex gap-3 fade-in">
            {[
              { icon: <Camera className="w-5 h-5" />, label: "Foto", color: "bg-primary", action: () => imageInputRef.current?.click() },
              { icon: <File className="w-5 h-5" />, label: "File", color: "bg-accent", action: () => fileInputRef.current?.click() },
            ].map(item => (
              <button key={item.label} onClick={item.action} className="flex flex-col items-center gap-1">
                <div className={`w-12 h-12 rounded-full ${item.color} flex items-center justify-center text-primary-foreground`}>{item.icon}</div>
                <span className="text-[10px] text-muted-foreground font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        )}

        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e, "image")} />
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
            </div>
            <button onClick={stopRecording} className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center shadow-glow">
              <Send className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>
        ) : (
          <div className="sticky bottom-16 glass px-4 py-2 space-y-2">
            {messages.length < 3 && (
              <AutoMessageSuggestions
                recipientName={conversations.find(c => c.id === id)?.name}
                context="prenotare un servizio"
                onSelect={(msg) => setNewMessage(msg)}
              />
            )}
            <div className="flex items-center gap-2">
              <button onClick={() => setShowAttachMenu(!showAttachMenu)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                <Paperclip className="w-4 h-4 text-muted-foreground" />
              </button>
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyPress={e => e.key === "Enter" && sendMessage()}
                placeholder="Scrivi un messaggio..."
                className="flex-1 h-10 rounded-full bg-muted px-4 text-sm focus:outline-none"
              />
              {newMessage.trim() ? (
                <button onClick={sendMessage} className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-glow">
                  <Send className="w-4 h-4 text-primary-foreground" />
                </button>
              ) : (
                <button onMouseDown={startRecording} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Mic className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        )}
      </MobileLayout>
    );
  }

  // ===== CONVERSATION LIST =====
  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-display font-bold">Chat</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cerca persone o conversazioni..."
            className="w-full h-10 rounded-full bg-muted pl-10 pr-4 text-sm focus:outline-none"
          />
        </div>
      </header>

      <div className="p-4 space-y-2">
        {/* Search results - show registered users */}
        {searchQuery.length >= 2 && searchedUsers.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2 px-1">Utenti registrati</p>
            {searchedUsers.map(u => (
              <button
                key={u.user_id}
                onClick={() => startNewChat(u)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-all"
              >
                <img
                  src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.user_id}`}
                  alt=""
                  className="w-11 h-11 rounded-full object-cover"
                />
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm">{u.display_name || "Utente"}</p>
                  <p className="text-[10px] text-muted-foreground">Tocca per iniziare una chat</p>
                </div>
                <UserPlus className="w-4 h-4 text-primary" />
              </button>
            ))}
            {filteredConversations.length > 0 && (
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-4 mb-2 px-1">Conversazioni</p>
            )}
          </div>
        )}

        {searchQuery.length >= 2 && searchedUsers.length === 0 && !searchingUsers && (
          <p className="text-xs text-muted-foreground text-center py-2">Nessun utente trovato per "{searchQuery}"</p>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredConversations.length === 0 && searchedUsers.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nessuna conversazione</p>
            <p className="text-xs text-muted-foreground mt-1">Cerca un utente per iniziare una chat</p>
          </div>
        ) : (
          filteredConversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => { setSelectedChat(conv); loadMessages(conv.id); navigate(`/chat/${conv.id}`); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-all"
            >
              <div className="relative">
                <img src={conv.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{conv.name}</p>
                  <span className="text-[10px] text-muted-foreground">{conv.time}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <span className="w-5 h-5 rounded-full gradient-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {conv.unread}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </MobileLayout>
  );
}
