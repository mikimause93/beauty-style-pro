import { Bot, User, Loader2 } from "lucide-react";
import { RefObject } from "react";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Props {
  messages: ChatMsg[];
  isLoading: boolean;
  suggestedQuestions: string[];
  onSuggestionClick: (q: string) => void;
  messagesEndRef: RefObject<HTMLDivElement>;
}

export default function AIChatMessages({ messages, isLoading, suggestedQuestions, onSuggestionClick, messagesEndRef }: Props) {
  return (
    <div className="flex-1 px-4 py-4 space-y-4 min-h-[50vh]">
      {messages.map(msg => (
        <div key={msg.id} className={`flex gap-2.5 fade-in ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            msg.role === "assistant" ? "gradient-primary" : "bg-muted"
          }`}>
            {msg.role === "assistant" ? (
              <Bot className="w-4 h-4 text-primary-foreground" />
            ) : (
              <User className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
            msg.role === "user"
              ? "gradient-primary text-primary-foreground rounded-br-md"
              : "bg-card border border-border rounded-bl-md"
          }`}>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
          </div>
        </div>
      ))}

      {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
        <div className="flex gap-2.5 fade-in">
          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Sto pensando...</span>
            </div>
          </div>
        </div>
      )}

      {messages.length <= 2 && !isLoading && (
        <div className="space-y-2 pt-2">
          <p className="text-xs text-muted-foreground font-medium">💡 Prova a chiedere:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map(q => (
              <button key={q} onClick={() => onSuggestionClick(q)}
                className="px-3 py-1.5 rounded-full bg-card border border-border text-xs hover:border-primary/50 transition-colors">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
