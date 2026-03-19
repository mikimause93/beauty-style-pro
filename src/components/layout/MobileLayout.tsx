import { ReactNode, useState } from "react";
import BottomNav from "./BottomNav";
import MiniRadioPlayer from "@/components/radio/MiniRadioPlayer";
import FloatingAIButton from "@/components/FloatingAIButton";
import ChatbotWidget from "@/components/chatbot/ChatbotWidget";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";

interface MobileLayoutProps {
  children: ReactNode;
  hideRadio?: boolean;
}

export default function MobileLayout({ children, hideRadio }: MobileLayoutProps) {
  const [showRadio, setShowRadio] = useState(!hideRadio);
  const { onTouchStart, onTouchEnd } = useSwipeNavigation();

  return (
    <div
      className="min-h-screen bg-background max-w-lg mx-auto relative"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* v2.0.0 — subtle ambient radial gradient */}
      <div
        className="pointer-events-none fixed inset-0 max-w-lg mx-auto"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, hsl(262 80% 62% / 0.06) 0%, transparent 70%)," +
            "radial-gradient(ellipse 60% 40% at 80% 80%, hsl(320 80% 62% / 0.04) 0%, transparent 60%)",
          zIndex: 0,
        }}
      />
      <main className={`relative z-10 ${showRadio ? "pb-32" : "pb-20"}`}>
        {children}
      </main>
      <FloatingAIButton />
      <ChatbotWidget />
      <MiniRadioPlayer visible={showRadio} onClose={() => setShowRadio(false)} />
      <BottomNav />
    </div>
  );
}

