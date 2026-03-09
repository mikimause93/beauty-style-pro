import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Minimize2, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useChatbot from "@/hooks/useChatbot";

interface Props {
  className?: string;
}

export default function ChatbotWidget({ className = "" }: Props) {
  const {
    suggestions,
    chatMessages, 
    isLoading,
    showChatbot,
    setShowChatbot,
    handleSuggestionClick,
    dismissSuggestion,
    sendChatMessage
  } = useChatbot();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [mode, setMode] = useState<"suggestions" | "chat">("suggestions");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  if (!showChatbot) return null;

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isLoading) return;
    await sendChatMessage(chatInput);
    setChatInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`fixed bottom-20 right-4 z-50 ${className}`}>
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`bg-card border border-border rounded-2xl shadow-2xl ${
              isExpanded ? "w-80 h-96" : "w-72 max-h-80"
            } transition-all duration-300`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Assistente Stayle</h4>
                  <p className="text-[10px] text-muted-foreground">Sono qui per aiutarti</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-6 h-6 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center"
                >
                  {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="w-6 h-6 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Mode tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setMode("suggestions")}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                  mode === "suggestions"
                    ? "bg-primary/10 text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Suggerimenti {suggestions.length > 0 && `(${suggestions.length})`}
              </button>
              <button
                onClick={() => setMode("chat")}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                  mode === "chat"
                    ? "bg-primary/10 text-primary border-b-2 border-primary" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Chat
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {mode === "suggestions" ? (
                <div className="p-3 space-y-2 h-full overflow-y-auto">
                  {suggestions.length === 0 ? (
                    <div className="text-center py-8">
                      <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Nessun suggerimento al momento</p>
                      <p className="text-xs text-muted-foreground mt-1">Continua a usare l'app per ricevere consigli!</p>
                    </div>
                  ) : (
                    suggestions.map((suggestion) => (
                      <motion.div
                        key={suggestion.suggestion_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-muted/50 rounded-lg p-3 border border-border/50"
                      >
                        <p className="text-sm mb-2">{suggestion.content}</p>
                        <div className="flex gap-2">
                          {suggestion.action_buttons.map((btn, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSuggestionClick(suggestion, btn)}
                              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                btn.action === "dismiss"
                                  ? "bg-muted text-muted-foreground hover:bg-muted/80"
                                  : "bg-primary text-primary-foreground hover:bg-primary/90"
                              }`}
                            >
                              {btn.text}
                            </button>
                          ))}
                          <button
                            onClick={() => dismissSuggestion(suggestion)}
                            className="ml-auto w-5 h-5 rounded text-muted-foreground hover:text-foreground flex items-center justify-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  {/* Chat messages */}
                  <div className="flex-1 p-3 overflow-y-auto space-y-2">
                    {chatMessages.length === 0 ? (
                      <div className="text-center py-4">
                        <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Chiedimi qualsiasi cosa sull'app!</p>
                      </div>
                    ) : (
                      chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${
                              msg.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))
                    )}
                    
                    {isLoading && mode === "chat" && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg px-3 py-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                            <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Chat input */}
                  <div className="border-t border-border p-3">
                    <div className="flex gap-2">
                      <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Chiedi qualcosa..."
                        className="flex-1 h-8 rounded-md bg-muted px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        disabled={isLoading}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim() || isLoading}
                        className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized state */}
      {isMinimized && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setIsMinimized(false)}
          className="w-12 h-12 rounded-full gradient-primary shadow-glow flex items-center justify-center relative"
        >
          <MessageCircle className="w-5 h-5 text-primary-foreground" />
          {suggestions.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {suggestions.length}
            </span>
          )}
        </motion.button>
      )}
    </div>
  );
}