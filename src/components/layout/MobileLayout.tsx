import { ReactNode, useState } from "react";
import BottomNav from "./BottomNav";
import MiniRadioPlayer from "@/components/radio/MiniRadioPlayer";
import ChatbotWidget from "@/components/chatbot/ChatbotWidget";
import StellaVoiceAgent from "@/components/stella/StellaVoiceAgent";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";

interface MobileLayoutProps {
  children: ReactNode;
  hideRadio?: boolean;
}

export default function MobileLayout({ children, hideRadio }: MobileLayoutProps) {
  const [showRadio, setShowRadio] = useState(!hideRadio);
  const { onTouchStart, onTouchEnd } = useSwipeNavigation();

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <main className={showRadio ? "pb-32" : "pb-20"}>
        {children}
      </main>
      <ChatbotWidget />
      <StellaVoiceAgent />
      <MiniRadioPlayer visible={showRadio} onClose={() => setShowRadio(false)} />
      <BottomNav />
    </div>
  );
}
