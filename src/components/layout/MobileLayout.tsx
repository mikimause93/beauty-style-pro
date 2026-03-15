import { ReactNode, useState } from "react";
import BottomNav from "./BottomNav";
import MiniRadioPlayer from "@/components/radio/MiniRadioPlayer";
import FloatingAIButton from "@/components/FloatingAIButton";
import ChatbotWidget from "@/components/chatbot/ChatbotWidget";
import DraggableShopFAB from "@/components/DraggableShopFAB";
import NotificationToast from "@/components/notifications/NotificationToast";
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
      <NotificationToast />
      <main className={showRadio ? "pb-32" : "pb-20"}>
        {children}
      </main>
      <FloatingAIButton />
      <ChatbotWidget />
      <DraggableShopFAB />
      <MiniRadioPlayer visible={showRadio} onClose={() => setShowRadio(false)} />
      <BottomNav />
    </div>
  );
}
