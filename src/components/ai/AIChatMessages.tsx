import { User, Loader2, Sparkles, Copy, ThumbsUp, AlertCircle } from "lucide-react";
import { RefObject } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  error?: boolean;
}

interface Props {
  messages: ChatMsg[];
  isLoading: boolean;
  suggestedQuestions: string[];
  onSuggestionClick: (q: string) => void;
  messagesEndRef: RefObject<HTMLDivElement>;
}

export default function AIChatMessages({ messages, isLoading, suggestedQuestions, onSuggestionClick, messagesEndRef }: Props) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success("Messaggio copiato!"))
      .catch(() => toast.error("Impossibile copiare il messaggio"));
  };

  return (
    <div role="log" aria-live="polite" aria-label="Messaggi chat" className="flex-1 px-4 py-4 space-y-4 min-h-[50vh]">
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <div className="w-16 h-16 rounded-full gradient-primary shadow-glow flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-base font-semibold">Ciao! Sono Stella AI 👋</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Il tuo assistente STYLE. Chiedimi consigli beauty, come usare l&apos;app o qualsiasi altra cosa!
          </p>
        </div>
      )}

      {messages.map(msg => (
        <div
          key={msg.id}
          role="article"
          aria-label={`${msg.role === "user" ? "Tu" : "Assistente"}: ${msg.content}`}
          className={`group flex gap-2.5 fade-in ${msg.role === "user" ? "flex-row-reverse" : ""}`}
        >
          {/* Avatar */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            msg.role === "assistant" ? "gradient-primary shadow-glow" : "bg-muted border border-border"
          }`}>
            {msg.role === "assistant" ? (
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            ) : (
              <User className="w-4 h-4 text-foreground/70" />
            )}
          </div>

          {/* Bubble + actions */}
          <div className={`flex flex-col max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <div className={`rounded-2xl px-4 py-3 ${
              msg.role === "user"
                ? "gradient-primary text-primary-foreground rounded-br-md shadow-glow"
                : "bg-card border border-border/60 rounded-bl-md shadow-sm"
            }`}>
              {msg.role === "assistant" ? (
                <ReactMarkdown className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                  {msg.content}
                </ReactMarkdown>
              ) : (
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              )}
            </div>

            {/* Timestamp */}
            {msg.timestamp && (
              <span className="text-xs text-muted-foreground/60 mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}

            {/* Error indicator */}
            {msg.error && (
              <div className="flex items-center gap-1 text-destructive text-xs mt-1 px-1">
                <AlertCircle className="w-3 h-3" />
                <span>Errore nell&apos;invio</span>
              </div>
            )}

            {/* Message actions */}
            <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => copyToClipboard(msg.content)}
                className="p-1 hover:bg-muted rounded"
                aria-label="Copia messaggio"
              >
                <Copy className="w-3 h-3" />
              </button>
              {msg.role === "assistant" && (
                <button
                  onClick={() => toast.success("Grazie per il feedback!")}
                  className="p-1 hover:bg-muted rounded"
                  aria-label="Feedback positivo"
                >
                  <ThumbsUp className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
        <div className="flex gap-2.5 fade-in">
          <div className="w-8 h-8 rounded-full gradient-primary shadow-glow flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-primary-foreground animate-pulse" />
          </div>
          <div className="bg-card border border-border/60 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Sto pensando...</span>
            </div>
          </div>
        </div>
      )}

      {messages.length <= 2 && !isLoading && (
        <div className="space-y-2 pt-2">
          <p className="text-xs text-muted-foreground font-semibold">💡 Prova a chiedere:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map(q => (
              <button key={q} onClick={() => onSuggestionClick(q)}
                className="px-3 py-1.5 rounded-full bg-card border border-border/60 text-xs font-medium text-foreground/80 hover:border-primary/50 hover:text-primary active:scale-95 transition-all duration-200">
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

