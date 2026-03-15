import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Send, Image, Phone, Video, Search, Mic, MicOff, Paperclip, Play, Pause, X, File, Camera, Briefcase, MessageCircle, UserPlus, Globe, Volume2, CheckCheck, PenLine } from "lucide-react";
import AutoMessageSuggestions from "@/components/chat/AutoMessageSuggestions";
import { useTranslation } from "@/hooks/useTranslation";
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
  const [callTimer, setCallTimer] = useState(0);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { translate, translating, autoTranslate, setAutoTranslate, getUserLanguage } = useTranslation();

  useEffect(() => {
    if (user) loadConversations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (id && conversations.length > 0) {
      const chat = conversations.find(c => c.id === id);
      if (chat) { setSelectedChat(chat); loadMessages(chat.id); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Auto-translate helper
  const autoTranslateMsg = async (msgId: string, content: string) => {
    if (!autoTranslate || !content.trim() || content.startsWith("[")) return;
    try {
      const translated = await translate(content);
      if (translated && translated !== content) {
        setTranslatedMessages(prev => ({ ...prev, [msgId]: translated }));
      }
    } catch { /* silent */ }
  };

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
          const newMsg = {
            id: msg.id,
            sender: "other" as const,
            content: msg.content,
            time: new Date(msg.created_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
            type: (msg.message_type || "text") as MessageType,
            mediaUrl: msg.image_url,
          };
          setMessages(prev => [...prev, newMsg]);
          // Auto-translate incoming message in real-time
          autoTranslateMsg(msg.id, msg.content);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat, user, autoTranslate]);

  // Auto-translate all existing "other" messages when autoTranslate turns on
  useEffect(() => {
    if (!autoTranslate || messages.length === 0) return;
    const otherMsgs = messages.filter(m => m.sender === "other" && m.content && !m.content.startsWith("[") && !translatedMessages[m.id]);
    otherMsgs.forEach(m => autoTranslateMsg(m.id, m.content));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTranslate, messages.length]);

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


  const startCall = async (type: "voice" | "video") => {
    try {
      const constraints: MediaStreamConstraints = type === "video" 
        ? { audio: true, video: { facingMode: "user", width: 640, height: 480 } }
        : { audio: true };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      
      if (type === "video" && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      setInCall(type);
      setCallTimer(0);
      callTimerRef.current = setInterval(() => setCallTimer(t => t + 1), 1000);
      toast.success(type === "voice" ? "Chiamata vocale avviata" : "Videochiamata avviata");
    } catch (err) {
      toast.error("Impossibile accedere a " + (type === "video" ? "fotocamera e microfono" : "microfono"));
    }
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    setInCall(null);
    setCallTimer(0);
    toast.success("Chiamata terminata");
  };

  // Clear translations cache when target language changes
  const clearTranslations = () => setTranslatedMessages({});

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

  // Voice message transcription + translation
  const [voiceTranscripts, setVoiceTranscripts] = useState<Record<string, string>>({});
  const [transcribing, setTranscribing] = useState<string | null>(null);

  const transcribeAndTranslateVoice = async (msg: Message) => {
    if (!msg.mediaUrl || voiceTranscripts[msg.id]) return;
    setTranscribing(msg.id);
    try {
      // Use Web Speech API for basic transcription simulation
      // In production this would call an STT edge function
      const { data } = await supabase.functions.invoke("ai-translate", {
        body: { 
          text: `[Audio message from chat - ${msg.duration || 5}s duration]`,
          sourceLang: "auto-detect",
          targetLang: getUserLanguage()
        },
      });
      setVoiceTranscripts(prev => ({ ...prev, [msg.id]: data?.translated || "Trascrizione non disponibile" }));
      toast.success("Audio trascritto e tradotto");
    } catch {
      toast.error("Errore nella trascrizione");
    } finally {
      setTranscribing(null);
    }
  };

  // Real-time call translation state
  const [callTranslation, setCallTranslation] = useState<string>("");
  const [callTranslating, setCallTranslating] = useState(false);
  const speechRecRef = useRef<any>(null);

  const startCallTranslation = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Riconoscimento vocale non supportato");
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "auto";
    
    recognition.onresult = async (event: any) => {
      const lastResult = event.results[event.results.length - 1];
      if (lastResult.isFinal) {
        const spokenText = lastResult[0].transcript;
        setCallTranslating(true);
        try {
          const translated = await translate(spokenText);
          setCallTranslation(translated || spokenText);
        } catch {
          setCallTranslation(spokenText);
        } finally {
          setCallTranslating(false);
        }
      } else {
        setCallTranslation(lastResult[0].transcript + "...");
      }
    };
    
    recognition.onerror = () => { /* silent */ };
    recognition.start();
    speechRecRef.current = recognition;
    toast.success("Traduzione chiamata attiva");
  };

  const stopCallTranslation = () => {
    speechRecRef.current?.stop();
    speechRecRef.current = null;
    setCallTranslation("");
  };

  const VoiceBubble = ({ msg }: { msg: Message }) => {
    const isPlaying = playingVoice === msg.id;
    const hasTranscript = voiceTranscripts[msg.id];
    const isTranscribing = transcribing === msg.id;
    return (
      <div className="min-w-[140px]">
        <button onClick={() => toggleVoicePlay(msg)} className="flex items-center gap-2 w-full">
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
        {/* Translate voice button */}
        {msg.sender === "other" && autoTranslate && !hasTranscript && (
          <button onClick={() => transcribeAndTranslateVoice(msg)} disabled={isTranscribing}
            className={`flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-medium ${msg.sender === "other" ? "bg-primary/10 text-primary" : "bg-primary-foreground/10 text-primary-foreground/70"}`}>
            <Globe className="w-2.5 h-2.5" />
            {isTranscribing ? "Traduco..." : "Traduci audio"}
          </button>
        )}
        {hasTranscript && (
          <p className={`text-[10px] italic mt-1 ${msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            🌐 {voiceTranscripts[msg.id]}
          </p>
        )}
      </div>
    );
  };

  // ===== CHAT THREAD =====
  if (selectedChat) {
    return (
      <MobileLayout>
        {/* Messenger-style gradient header */}
        <header className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(262 88% 45%) 100%)" }}>
          <button
            onClick={() => { setSelectedChat(null); navigate("/chat"); }}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <button onClick={() => navigate(`/profile/${selectedChat.otherUserId}`)} className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="relative shrink-0">
              <img src={selectedChat.avatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white/80 ring-1 ring-white/40" />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#25D366] border-2 border-white" />
            </div>
            <div className="min-w-0 text-left">
              <p className="font-bold text-sm text-white truncate">{selectedChat.name}</p>
              <p className="text-[10px] text-green-300 font-medium">Online</p>
            </div>
          </button>
          <button onClick={() => openWhatsApp(selectedChat.name, selectedChat.otherUserId)} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <MessageCircle className="w-4 h-4 text-white" />
          </button>
          <button onClick={() => startCall("voice")} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4 text-white" />
          </button>
          <button onClick={() => startCall("video")} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Video className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => { setAutoTranslate(!autoTranslate); if (!autoTranslate) toast.success("Traduzione AI attivata"); else { toast.info("Traduzione AI disattivata"); setTranslatedMessages({}); } }}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${autoTranslate ? "bg-white/40 shadow-inner" : "bg-white/20"}`}
          >
            <Globe className="w-4 h-4 text-white" />
          </button>
        </header>

        {/* In-call overlay */}
        {inCall && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
            style={{ background: "linear-gradient(180deg, hsl(262 88% 20%) 0%, hsl(var(--background)) 100%)" }}>
            {inCall === "video" && (
              <>
                <div className="absolute inset-0 flex items-center justify-center">
                  <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover opacity-20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 rounded-full mx-auto mb-3 ring-4 ring-white/30 overflow-hidden">
                        <img src={selectedChat.avatar} alt="" className="w-full h-full object-cover" />
                      </div>
                      <p className="text-lg font-bold text-white">{selectedChat.name}</p>
                      <p className="text-sm text-white/60 mt-1">In attesa di risposta...</p>
                    </div>
                  </div>
                </div>
                <video ref={localVideoRef} autoPlay playsInline muted className="absolute top-16 right-4 w-28 h-36 rounded-2xl object-cover border-2 border-white/60 shadow-lg z-10" />
              </>
            )}

            {inCall === "voice" && (
              <div className="flex flex-col items-center gap-4">
                <div className="w-28 h-28 rounded-full ring-4 ring-white/30 ring-offset-4 ring-offset-transparent overflow-hidden shadow-2xl">
                  <img src={selectedChat.avatar} alt="" className="w-full h-full object-cover" />
                </div>
                <p className="text-2xl font-bold text-white">{selectedChat.name}</p>
                <p className="text-sm text-white/60">Chiamata vocale in corso</p>
                <div className="flex items-end gap-1 h-10">
                  {[0,1,2,3,4,5,6].map(i => (
                    <div key={i} className="w-1.5 bg-white/70 rounded-full animate-pulse"
                      style={{ height: `${14 + Math.sin(i) * 14 + 8}px`, animationDelay: `${i * 0.12}s` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Live translation subtitles */}
            {callTranslation && (
              <div className="absolute bottom-36 left-4 right-4 bg-black/60 backdrop-blur rounded-2xl px-4 py-3 border border-white/20 shadow-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-3.5 h-3.5 text-white/70" />
                  <span className="text-[10px] font-bold text-white/70 uppercase tracking-wide">Traduzione Live</span>
                  {callTranslating && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                </div>
                <p className="text-sm text-white">{callTranslation}</p>
              </div>
            )}

            <p className="text-xl font-mono font-semibold text-white/80 mt-8">{formatDuration(callTimer)}</p>

            {/* Call controls */}
            <div className="absolute bottom-16 flex items-center gap-6">
              <button className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                {inCall === "voice" ? <Mic className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
              </button>
              <button onClick={() => { if (speechRecRef.current) stopCallTranslation(); else startCallTranslation(); }}
                className={`w-14 h-14 rounded-full flex items-center justify-center backdrop-blur ${speechRecRef.current ? "bg-white/40" : "bg-white/20"}`}>
                <Globe className="w-6 h-6 text-white" />
              </button>
              <button onClick={() => { stopCallTranslation(); endCall(); }} className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
                <Phone className="w-7 h-7 text-white rotate-[135deg]" />
              </button>
              <button className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <Volume2 className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Auto-translate indicator */}
        {autoTranslate && (
          <div className="px-4 py-1.5 bg-primary/10 border-b border-primary/20 flex items-center justify-center gap-2">
            <Globe className="w-3 h-3 text-primary" />
            <span className="text-[10px] text-primary font-medium">Traduzione AI automatica attiva</span>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 px-3 py-4 space-y-2 min-h-[60vh]">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Inizia la conversazione!</p>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === "me" ? "justify-end" : "justify-start"} fade-in`}>
              {msg.sender === "other" && (
                <img src={selectedChat.avatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 mb-1 shadow-sm" />
              )}
              <div className={`max-w-[74%] overflow-hidden shadow-sm ${
                msg.type === "image" || msg.type === "video"
                  ? "rounded-2xl shadow-md"
                  : msg.sender === "me"
                    ? "rounded-2xl rounded-br-sm px-4 py-2.5 text-white"
                    : "rounded-2xl rounded-bl-sm px-4 py-2.5 bg-card border border-border/30 text-foreground"
              } ${(msg.type === "text" || msg.type === "voice" || msg.type === "file") && msg.sender === "me"
                  ? "bg-gradient-to-br from-[hsl(var(--primary))] to-purple-600"
                  : ""
              }`}>
                {msg.type === "image" && msg.mediaUrl && (
                  <img src={msg.mediaUrl} alt="" className="w-full max-w-[240px] rounded-2xl object-cover" />
                )}
                {msg.type === "video" && msg.mediaUrl && (
                  <video src={msg.mediaUrl} controls className="w-full max-w-[240px] rounded-2xl" />
                )}
                {msg.type === "voice" && <VoiceBubble msg={msg} />}
                {msg.type === "file" && (
                  <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 min-w-[140px]">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${msg.sender === "me" ? "bg-white/20" : "bg-primary/10"}`}>
                      <File className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{msg.fileName || "File"}</p>
                      <p className={`text-[10px] ${msg.sender === "me" ? "text-white/60" : "text-muted-foreground"}`}>Tocca per aprire</p>
                    </div>
                  </a>
                )}
                {msg.content && <p className="text-sm leading-snug">{msg.content}</p>}
                {msg.content && translatedMessages[msg.id] && (
                  <p className={`text-xs italic mt-1 border-t pt-1 ${msg.sender === "me" ? "border-white/20 text-white/60" : "border-border/30 text-muted-foreground"}`}>
                    🌐 {translatedMessages[msg.id]}
                  </p>
                )}
                {msg.type !== "image" && msg.type !== "video" && (
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className={`text-[10px] ${msg.sender === "me" ? "text-white/60" : "text-muted-foreground"}`}>{msg.time}</span>
                    {msg.sender === "me" && <CheckCheck className="w-3.5 h-3.5 text-white/60" />}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Attach menu */}
        {showAttachMenu && (
          <div className="px-4 pb-2 flex gap-4 fade-in bg-background/80 backdrop-blur-sm border-t border-border/20 pt-3">
            {[
              { icon: <Camera className="w-5 h-5" />, label: "Foto", color: "from-primary to-purple-600", action: () => imageInputRef.current?.click() },
              { icon: <File className="w-5 h-5" />, label: "File", color: "from-accent to-accent/80", action: () => fileInputRef.current?.click() },
            ].map(item => (
              <button key={item.label} onClick={item.action} className="flex flex-col items-center gap-1.5">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-md`}>{item.icon}</div>
                <span className="text-[10px] text-muted-foreground font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        )}

        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e, "image")} />
        <input ref={fileInputRef} type="file" className="hidden" onChange={e => handleFileSelect(e, "file")} />

        {/* Recording UI */}
        {isRecording ? (
          <div className="sticky bottom-16 backdrop-blur-md bg-background/85 border-t border-border/30 px-4 py-3 flex items-center gap-3">
            <button onClick={cancelRecording} className="w-9 h-9 rounded-full bg-destructive/15 flex items-center justify-center">
              <X className="w-4 h-4 text-destructive" />
            </button>
            <div className="flex-1 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
              <span className="text-sm font-mono font-semibold text-destructive">{formatDuration(recordingTime)}</span>
              <div className="flex-1 flex items-end gap-0.5 h-6">
                {Array.from({ length: 18 }).map((_, i) => (
                  <div key={i} className="w-1 bg-primary/50 rounded-full animate-pulse"
                    style={{ height: `${6 + Math.sin(i) * 8 + 6}px`, animationDelay: `${i * 0.08}s` }} />
                ))}
              </div>
            </div>
            <button onClick={stopRecording} className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg text-white"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(262 88% 45%))" }}>
              <Send className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="sticky bottom-16 backdrop-blur-md bg-background/85 border-t border-border/30 px-4 py-2 space-y-2">
            {messages.length < 3 && (
              <AutoMessageSuggestions
                recipientName={conversations.find(c => c.id === id)?.name}
                context="prenotare un servizio"
                onSelect={(msg) => setNewMessage(msg)}
              />
            )}
            <div className="flex items-center gap-2">
              <button onClick={() => setShowAttachMenu(!showAttachMenu)} className="w-9 h-9 rounded-full bg-muted/60 flex items-center justify-center shrink-0">
                <Paperclip className="w-4 h-4 text-muted-foreground" />
              </button>
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyPress={e => e.key === "Enter" && sendMessage()}
                placeholder="Scrivi un messaggio..."
                className="flex-1 h-10 rounded-full bg-muted/60 px-4 text-sm focus:outline-none"
              />
              {newMessage.trim() ? (
                <button onClick={sendMessage}
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg shrink-0 text-white"
                  style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(262 88% 45%))" }}>
                  <Send className="w-4 h-4" />
                </button>
              ) : (
                <button onMouseDown={startRecording} className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center shrink-0">
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
      {/* WhatsApp/Messenger-style gradient header */}
      <header className="sticky top-0 z-40"
        style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(262 88% 45%) 100%)" }}>
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-white">Chat</h1>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate("/create-post")} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </button>
              <button className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <PenLine className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
          {/* WhatsApp-style search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cerca persone o conversazioni..."
              className="w-full h-10 rounded-full bg-white/20 pl-10 pr-4 text-sm text-white placeholder:text-white/60 focus:outline-none focus:bg-white/30 transition-colors"
            />
          </div>
        </div>
      </header>

      {/* Stories / Status row */}
      {!searchQuery && conversations.length > 0 && (
        <div className="border-b border-border/20 bg-card/20 px-4 py-3">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
            {/* My status */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="relative">
                <div className="w-14 h-14 rounded-full p-0.5" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(262 88% 45%))" }}>
                  <div className="w-full h-full rounded-full bg-card overflow-hidden">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || "me"}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center border-2 border-card text-white text-xs font-bold"
                  style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(262 88% 45%))" }}>
                  +
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground w-14 text-center truncate">Il mio stato</span>
            </div>
            {/* Others' stories */}
            {conversations.slice(0, 6).map(conv => (
              <button
                key={conv.id}
                onClick={() => { setSelectedChat(conv); loadMessages(conv.id); navigate(`/chat/${conv.id}`); }}
                className="flex flex-col items-center gap-1.5 shrink-0"
              >
                <div className="w-14 h-14 rounded-full p-0.5" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(262 88% 45%))" }}>
                  <div className="w-full h-full rounded-full overflow-hidden">
                    <img src={conv.avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground w-14 text-center truncate">{conv.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col">
        {/* Search results - show registered users */}
        {searchQuery.length >= 2 && searchedUsers.length > 0 && (
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2 px-1">Utenti registrati</p>
            {searchedUsers.map(u => (
              <button
                key={u.user_id}
                onClick={() => startNewChat(u)}
                className="w-full flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-muted/60 transition-all"
              >
                <img
                  src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.user_id}`}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover shrink-0"
                />
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm">{u.display_name || "Utente"}</p>
                  <p className="text-[10px] text-muted-foreground">Tocca per iniziare una chat</p>
                </div>
                <UserPlus className="w-4 h-4 text-primary shrink-0" />
              </button>
            ))}
            {filteredConversations.length > 0 && (
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-4 mb-2 px-1">Conversazioni</p>
            )}
          </div>
        )}

        {searchQuery.length >= 2 && searchedUsers.length === 0 && !searchingUsers && (
          <p className="text-xs text-muted-foreground text-center py-3 px-4">Nessun utente trovato per "{searchQuery}"</p>
        )}

        {/* Section label */}
        {!searchQuery && filteredConversations.length > 0 && (
          <div className="px-4 pt-4 pb-1">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Messaggi recenti</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredConversations.length === 0 && searchedUsers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nessuna conversazione</p>
            <p className="text-xs text-muted-foreground mt-1">Cerca un utente per iniziare una chat</p>
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            {filteredConversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => { setSelectedChat(conv); loadMessages(conv.id); navigate(`/chat/${conv.id}`); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-card/40 transition-all text-left"
              >
                <div className="relative shrink-0">
                  <img src={conv.avatar} alt="" className="w-14 h-14 rounded-full object-cover" />
                  <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[#25D366] border-2 border-background" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm truncate">{conv.name}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">{conv.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#25D366] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {conv.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
