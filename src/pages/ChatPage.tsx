import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Send, Image, Gift, Phone, Video, Search, Plus, Briefcase } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
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

interface Message {
  id: string;
  sender: "me" | "other";
  content: string;
  time: string;
  type: "text" | "image" | "job_application";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If navigated with an id, open that chat
    if (id) {
      const chat = conversations.find(c => c.id === id);
      if (chat) {
        setSelectedChat(chat);
        loadMessages(chat.id);
      }
    }
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = (chatId: string) => {
    // Fallback sample messages
    setMessages([
      { id: "1", sender: "other", content: "Ciao! Ho visto il tuo profilo 😊", time: "14:20", type: "text" },
      { id: "2", sender: "me", content: "Ciao! Certo, come posso aiutarti?", time: "14:22", type: "text" },
      { id: "3", sender: "other", content: "Vorrei prenotare un appuntamento!", time: "14:25", type: "text" },
      { id: "4", sender: "me", content: "Perfetto! Che servizio ti interessa?", time: "14:28", type: "text" },
      { id: "5", sender: "other", content: "Perfetto, ci vediamo alle 15! 💇‍♀️", time: "14:30", type: "text" },
    ]);
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const msg: Message = {
      id: Date.now().toString(),
      sender: "me",
      content: newMessage,
      time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
      type: "text",
    };
    setMessages(prev => [...prev, msg]);
    setNewMessage("");

    // Simulate reply
    setTimeout(() => {
      const replies = ["Perfetto! 😊", "Fantastico! ✨", "Ok, grazie! 💕", "A presto! 🎉", "Ti invio i dettagli! 📋"];
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: "other",
        content: replies[Math.floor(Math.random() * replies.length)],
        time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
        type: "text",
      }]);
    }, 1500);
  };

  const sendJobApplication = () => {
    const msg: Message = {
      id: Date.now().toString(),
      sender: "me",
      content: "📋 Ho inviato la mia candidatura per la posizione! Ecco il mio profilo e CV. Resto disponibile per un colloquio.",
      time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
      type: "job_application",
    };
    setMessages(prev => [...prev, msg]);
  };

  const openWhatsApp = (name: string) => {
    const text = encodeURIComponent(`Ciao ${name}! Ti contatto tramite Style App.`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const filteredConversations = conversations.filter(c => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (activeTab === "jobs") return c.isJobChat;
    return true;
  });

  // Chat thread view
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
          <button onClick={() => openWhatsApp(selectedChat.name)} className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center" title="WhatsApp">
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
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                msg.type === "job_application"
                  ? "bg-accent/10 border border-accent/30 rounded-br-md"
                  : msg.sender === "me"
                    ? "gradient-primary text-primary-foreground rounded-br-md"
                    : "bg-card border border-border rounded-bl-md"
              }`}>
                {msg.type === "job_application" && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <Briefcase className="w-3 h-3 text-accent" />
                    <span className="text-[10px] font-bold text-accent">Candidatura</span>
                  </div>
                )}
                <p className="text-sm">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="sticky bottom-16 glass px-4 py-3 flex items-center gap-2">
          <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <Image className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={sendJobApplication} className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center" title="Invia candidatura">
            <Briefcase className="w-4 h-4 text-accent" />
          </button>
          <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <Gift className="w-4 h-4 text-gold" />
          </button>
          <input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Scrivi un messaggio..."
            className="flex-1 h-10 rounded-full bg-card border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button onClick={sendMessage} className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-glow">
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
      </MobileLayout>
    );
  }

  // Conversations list
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

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cerca conversazioni..."
            className="w-full h-10 rounded-xl bg-card border border-border pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(["all", "jobs"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === tab ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {tab === "all" ? "Tutte" : "💼 Candidature"}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 space-y-2">
        {filteredConversations.map(conv => (
          <button
            key={conv.id}
            onClick={() => { setSelectedChat(conv); loadMessages(conv.id); }}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-muted transition-all text-left shadow-card"
          >
            <div className="relative">
              <img src={conv.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
              {conv.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
              )}
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
            <button onClick={() => navigate("/stylists")} className="text-primary text-xs font-semibold mt-2">
              Inizia una nuova chat
            </button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
