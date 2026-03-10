import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageCircle, X, Send, Sparkles, Minimize2, Maximize2,
  Calendar, MapPin, ShoppingBag, Video, Wallet, Briefcase,
  Star, Radio, Bot, User, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import useChatbot from "@/hooks/useChatbot";
import { streamChat } from "@/lib/streamChat";
import { toast } from "sonner";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const quickActions = [
  { icon: Calendar, label: "Prenota", desc: "Trova professionisti", path: "/booking", color: "text-pink-400" },
  { icon: MapPin, label: "Mappa", desc: "Cerca vicino a te", path: "/map-search", color: "text-blue-400" },
  { icon: ShoppingBag, label: "Shop", desc: "Prodotti beauty", path: "/shop", color: "text-amber-400" },
  { icon: Video, label: "Live", desc: "Streaming beauty", path: "/go-live", color: "text-red-400" },
  { icon: Wallet, label: "Wallet", desc: "Saldo e pagamenti", path: "/wallet", color: "text-green-400" },
  { icon: Briefcase, label: "Lavoro", desc: "Offerte beauty", path: "/hr", color: "text-purple-400" },
  { icon: Star, label: "Sfide", desc: "Missioni e premi", path: "/challenges", color: "text-yellow-400" },
  { icon: Radio, label: "Radio", desc: "Musica beauty", path: "/radio", color: "text-cyan-400" },
];

interface Props {
  className?: string;
}

export default function ChatbotWidget({ className = "" }: Props) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const {
    suggestions,
    showChatbot,
    setShowChatbot,
    handleSuggestionClick,
    dismissSuggestion,
  } = useChatbot();

  const [isMinimized, setIsMinimized] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "actions" | "tips">("chat");
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Ciao${profile?.display_name ? ` ${profile.display_name}` : ""}! 👋 Sono Stella & Keplero AI. Chiedimi qualsiasi cosa!`,
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isAILoading, setIsAILoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (profile?.display_name) {
      setChatMessages(prev => prev.map(m => 
        m.id === "welcome" 
          ? { ...m, content: `Ciao ${profile.display_name}! 👋 Sono Stella & Keplero AI. Chiedimi qualsiasi cosa!` }
          : m
      ));
    }
  }, [profile?.display_name]);

  const sendMessage = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || isAILoading || !user) return;

    const userMsg: ChatMsg = { id: Date.now().toString(), role: "user", content: text };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsAILoading(true);

    const history = [...chatMessages.filter(m => m.id !== "welcome"), userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    let assistantSoFar = "";

    const upsertAssistant = (nextChunk: string) => {
      assistantSoFar += nextChunk;
      const currentContent = assistantSoFar;
      setChatMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.id === "streaming") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: currentContent } : m);
        }
        return [...prev, { id: "streaming", role: "assistant" as const, content: currentContent }];
      });
    };

    try {
      await streamChat({
        userId: user.id,
        messages: history as any,
        onDelta: (chunk) => upsertAssistant(chunk),
        onDone: () => {
          setChatMessages(prev => prev.map(m => 
            m.id === "streaming" ? { ...m, id: (Date.now() + 1).toString() } : m
          ));
          setIsAILoading(false);
        },
        onError: (error) => {
          toast.error(error);
          setChatMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Mi dispiace, riprova tra poco! 🙏",
          }]);
          setIsAILoading(false);
        },
      });
    } catch (err: any) {
      console.error("AI stream error:", err);
      toast.error("Errore nella risposta AI");
      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Mi dispiace, riprova tra poco! 🙏",
      }]);
      setIsAILoading(false);
    }
  }, [chatInput, isAILoading, user, chatMessages]);

  const suggestedQuestions = [
    "Quale taglio va di moda?",
    "Come curare i capelli ricci?",
    "Come funziona il wallet?",
    "Trova un parrucchiere vicino",
    "Come prenotare un servizio?",
    "Come andare in live?",
  ];

  if (!showChatbot && !isMinimized) return null;

  const panelHeight = isFullscreen ? "h-[85vh]" : "h-[28rem]";

  return (
    <div className={`fixed bottom-20 right-4 z-50 ${className}`}>
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`bg-card/98 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl ${
              isFullscreen ? "w-[calc(100vw-2rem)] max-w-md" : "w-80"
            } ${panelHeight} flex flex-col overflow-hidden transition-all duration-300`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-gradient-to-r from-primary/10 to-accent/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center shadow-glow">
                  <Sparkles className="w-4.5 h-4.5 text-primary-foreground" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Stella & Keplero AI</h4>
                  <p className="text-[10px] text-muted-foreground">Assistente STYLE con streaming</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setIsFullscreen(!isFullscreen)}
                  className="w-7 h-7 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors">
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => setIsMinimized(true)}
                  className="w-7 h-7 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border/50">
              {[
                { key: "chat" as const, label: "💬 Chat AI" },
                { key: "actions" as const, label: "⚡ Azioni" },
                { key: "tips" as const, label: `💡 Tips${suggestions.length > 0 ? ` (${suggestions.length})` : ""}` },
              ].map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 px-2 py-2 text-[11px] font-semibold transition-colors ${
                    activeTab === tab.key
                      ? "bg-primary/10 text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {activeTab === "chat" && (
                <>
                  <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
                    {chatMessages.map(msg => (
                      <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          msg.role === "assistant" ? "gradient-primary" : "bg-muted"
                        }`}>
                          {msg.role === "assistant" ? (
                            <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                          ) : (
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </div>
                        <div className={`max-w-[78%] rounded-2xl px-3 py-2 ${
                          msg.role === "user"
                            ? "gradient-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted/60 border border-border/30 rounded-bl-sm"
                        }`}>
                          <p className="text-xs whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        </div>
                      </div>
                    ))}

                    {isAILoading && chatMessages[chatMessages.length - 1]?.id !== "streaming" && (
                      <div className="flex gap-2">
                        <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                          <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                        </div>
                        <div className="bg-muted/60 border border-border/30 rounded-2xl rounded-bl-sm px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <Loader2 className="w-3 h-3 animate-spin text-primary" />
                            <span className="text-[11px] text-muted-foreground">Sto pensando...</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {chatMessages.length <= 2 && !isAILoading && (
                      <div className="pt-1">
                        <p className="text-[10px] text-muted-foreground font-medium mb-1.5">Prova a chiedere:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {suggestedQuestions.map(q => (
                            <button key={q} onClick={() => setChatInput(q)}
                              className="px-2.5 py-1 rounded-full bg-muted/50 border border-border/30 text-[10px] hover:border-primary/40 transition-colors">
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  <div className="border-t border-border/50 px-3 py-2.5">
                    <div className="flex gap-2">
                      <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                        placeholder="Chiedi qualsiasi cosa..."
                        className="flex-1 h-9 rounded-full bg-muted/50 px-3.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                        disabled={isAILoading}
                      />
                      <button onClick={sendMessage} disabled={!chatInput.trim() || isAILoading}
                        className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center shadow-glow disabled:opacity-50 transition-opacity">
                        <Send className="w-4 h-4 text-primary-foreground" />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "actions" && (
                <div className="flex-1 overflow-y-auto p-3">
                  <p className="text-[10px] text-muted-foreground font-medium mb-3">Cosa vuoi fare?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.map(action => (
                      <motion.button key={action.path} whileTap={{ scale: 0.97 }}
                        onClick={() => { navigate(action.path); setIsMinimized(true); }}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/40 border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center">
                          <action.icon className={`w-5 h-5 ${action.color}`} />
                        </div>
                        <span className="text-xs font-semibold">{action.label}</span>
                        <span className="text-[9px] text-muted-foreground">{action.desc}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "tips" && (
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {suggestions.length === 0 ? (
                    <div className="text-center py-8">
                      <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-xs text-muted-foreground">Nessun suggerimento al momento</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Continua a usare l'app!</p>
                    </div>
                  ) : (
                    suggestions.map((suggestion) => (
                      <motion.div key={suggestion.suggestion_id}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        className="bg-muted/40 rounded-xl p-3 border border-border/30">
                        <p className="text-xs mb-2">{suggestion.content}</p>
                        <div className="flex gap-1.5 items-center">
                          {suggestion.action_buttons.map((btn, idx) => (
                            <button key={idx}
                              onClick={() => {
                                handleSuggestionClick(suggestion, btn);
                                if (btn.action === "navigate") setIsMinimized(true);
                              }}
                              className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                                btn.action === "dismiss"
                                  ? "bg-muted text-muted-foreground hover:bg-muted/80"
                                  : "bg-primary text-primary-foreground hover:bg-primary/90"
                              }`}>
                              {btn.text}
                            </button>
                          ))}
                          <button onClick={() => dismissSuggestion(suggestion)}
                            className="ml-auto w-5 h-5 rounded text-muted-foreground hover:text-foreground flex items-center justify-center">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      {isMinimized && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMinimized(false)}
          className="w-13 h-13 rounded-full gradient-primary shadow-glow flex items-center justify-center relative"
          style={{ width: 52, height: 52 }}
        >
          <Sparkles className="w-6 h-6 text-primary-foreground" />
          {suggestions.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {suggestions.length}
            </span>
          )}
        </motion.button>
      )}
    </div>
  );
}
