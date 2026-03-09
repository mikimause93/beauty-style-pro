import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ChatbotSuggestion {
  suggestion_id: string;
  message_type: string;
  content: string;
  action_buttons: Array<{
    text: string;
    action: string;
    target?: string;
  }>;
  priority: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export function useChatbot() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<ChatbotSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showChatbot, setShowChatbot] = useState(false);

  // Track user action
  const trackAction = async (actionType: string, actionData: any = {}, pageContext?: string) => {
    if (!user) return;
    
    try {
      await supabase.functions.invoke("chatbot-assistant", {
        body: {
          action: "track_action",
          user_id: user.id,
          data: { action_type: actionType, action_data: actionData, page_context: pageContext }
        }
      });
    } catch (error) {
      console.error("Error tracking action:", error);
    }
  };

  // Load suggestions
  const loadSuggestions = async (force = false) => {
    if (!user || (isLoading && !force)) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("chatbot-assistant", {
        body: {
          action: "get_suggestions", 
          user_id: user.id
        }
      });

      if (error) throw error;
      
      if (data?.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        setShowChatbot(true);
      }
    } catch (error) {
      console.error("Error loading suggestions:", error);
      // Fallback suggestion
      setSuggestions([{
        suggestion_id: "fallback",
        message_type: "welcome",
        content: "Benvenuto su Stayle! 🌟 Esplora tutte le funzioni",
        action_buttons: [{ text: "Scopri", action: "dismiss" }],
        priority: 1
      }]);
      setShowChatbot(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle suggestion interaction
  const handleSuggestionClick = async (suggestion: ChatbotSuggestion, action: any) => {
    if (!user) return;

    try {
      // Log interaction
      await supabase.functions.invoke("chatbot-assistant", {
        body: {
          action: "log_interaction",
          user_id: user.id,
          data: {
            suggestion_id: suggestion.suggestion_id,
            interaction_type: "clicked",
            suggestion_content: suggestion.content
          }
        }
      });

      // Execute action
      if (action.action === "navigate" && action.target) {
        window.location.href = action.target;
      } else if (action.action === "dismiss") {
        dismissSuggestion(suggestion);
      }
    } catch (error) {
      console.error("Error handling suggestion click:", error);
    }
  };

  // Dismiss suggestion
  const dismissSuggestion = async (suggestion: ChatbotSuggestion) => {
    if (!user) return;

    try {
      await supabase.functions.invoke("chatbot-assistant", {
        body: {
          action: "log_interaction",
          user_id: user.id,
          data: {
            suggestion_id: suggestion.suggestion_id,
            interaction_type: "dismissed",
            suggestion_content: suggestion.content
          }
        }
      });

      // Remove suggestion from UI
      setSuggestions(prev => prev.filter(s => s.suggestion_id !== suggestion.suggestion_id));
      
      if (suggestions.length <= 1) {
        setShowChatbot(false);
      }
    } catch (error) {
      console.error("Error dismissing suggestion:", error);
    }
  };

  // Send chat message
  const sendChatMessage = async (message: string) => {
    if (!user || !message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user", 
      content: message.trim(),
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chatbot-assistant", {
        body: {
          action: "chat",
          user_id: user.id,
          data: { message: message.trim() }
        }
      });

      if (error) throw error;

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "Mi dispiace, non riesco a rispondere.",
        timestamp: new Date().toISOString()
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant", 
        content: "Mi dispiace, c'è stato un problema. Riprova! 🙏",
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-load suggestions when user logs in
  useEffect(() => {
    if (user && !showChatbot) {
      // Wait a bit before showing suggestions to avoid overwhelming
      const timer = setTimeout(() => {
        loadSuggestions();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user?.id]);

  return {
    suggestions,
    chatMessages,
    isLoading,
    showChatbot,
    setShowChatbot,
    trackAction,
    loadSuggestions,
    handleSuggestionClick,
    dismissSuggestion,
    sendChatMessage,
    clearChat: () => setChatMessages([])
  };
}

export default useChatbot;