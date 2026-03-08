import { Sparkles } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const hiddenRoutes = ["/ai-assistant", "/auth", "/onboarding"];

export default function FloatingAIButton() {
  const navigate = useNavigate();
  const location = useLocation();

  if (hiddenRoutes.some(r => location.pathname.startsWith(r))) return null;

  return (
    <button
      onClick={() => navigate("/ai-assistant")}
      className="fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full gradient-primary shadow-glow flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
      aria-label="AI Assistant"
    >
      <Sparkles className="w-5 h-5 text-primary-foreground" />
    </button>
  );
}
