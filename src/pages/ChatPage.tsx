import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Send, Image, Gift, Smile, Phone, Video, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  type: "text" | "image" | "gift";
}

const sampleMessages: Message[] = [
  { id: "1", sender: "other", content: "Ciao! Ho visto il tuo profilo, mi piacerebbe prenotare un appuntamento 😊", time: "14:20", type: "text" },
  { id: "2", sender: "me", content: "Ciao! Certo, sono disponibile questa settimana. Che servizio ti interessa?", time: "14:22", type: "text" },
  { id: "3", sender: "other", content: "Vorrei un balayage! Hai disponibilità giovedì?", time: "14:25", type: "text" },
  { id: "4", sender: "me", content: "Sì! Giovedì pomeriggio va bene. Alle 15 ti andrebbe?", time: "14:28", type: "text" },
  { id: "5", sender: "other", content: "Perfetto, ci vediamo alle 15! 💇‍♀️", time: "14:30", type: "text" },
];

export default function ChatPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [conversations] = useState(fallbackConversations);
  const [messages, setMessages] = useState(sampleMessages);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      const replies = ["Perfetto! 😊", "Fantastico! ✨", "Ok, grazie! 💕", "A presto! 🎉"];
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: "other",
        content: replies[Math.floor(Math.random() * replies.length)],
        time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
        type: "text",
      }]);
    }, 1500);
  };

  // Chat thread view
  if (selectedChat) {
    return (
      <MobileLayout>
        {/* Chat header */}
        <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSelectedChat(null)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img src={selectedChat.avatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-primary" />
          <div className="flex-1">
            <p className="font-semibold text-sm">{selectedChat.name}</p>
            <p className="text-[10px] text-success">
              {selectedChat.online ? "● Online" : "Offline"}
            </p>
          </div>
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
            <div
              key={msg.id}
              className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"} fade-in`}
            >
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                msg.sender === "me"
                  ? "gradient-primary text-primary-foreground rounded-br-md"
                  : "bg-card border border-border rounded-bl-md"
              }`}>
                <p className="text-sm">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${
                  msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}>
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
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-display font-bold flex-1">Chat</h1>
        <div className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
          {conversations.reduce((a, c) => a + c.unread, 0)}
        </div>
      </header>

      <div className="p-4 space-y-2">
        {conversations.map(conv => (
          <button
            key={conv.id}
            onClick={() => setSelectedChat(conv)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-muted transition-all text-left shadow-card"
          >
            <div className="relative">
              <img src={conv.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
              {conv.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-background" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm truncate">{conv.name}</p>
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
      </div>
    </MobileLayout>
  );
}
