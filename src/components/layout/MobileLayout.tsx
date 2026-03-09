import { ReactNode, useState } from "react";
import BottomNav from "./BottomNav";
import MiniRadioPlayer from "@/components/radio/MiniRadioPlayer";
import FloatingAIButton from "@/components/FloatingAIButton";
import ChatbotWidget from "@/components/chatbot/ChatbotWidget";

interface MobileLayoutProps {
  children: ReactNode;
  hideRadio?: boolean;
}

export default function MobileLayout({ children, hideRadio }: MobileLayoutProps) {
  const [showRadio, setShowRadio] = useState(!hideRadio);

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      <main className={showRadio ? "pb-32" : "pb-20"}>
        {children}
      </main>
      <FloatingAIButton />
      <ChatbotWidget />
      <MiniRadioPlayer visible={showRadio} onClose={() => setShowRadio(false)} />
      <BottomNav />
    </div>
  );
}
