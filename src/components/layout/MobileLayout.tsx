import { ReactNode, useState } from "react";
import BottomNav from "./BottomNav";
import MiniRadioPlayer from "@/components/radio/MiniRadioPlayer";

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
      <MiniRadioPlayer visible={showRadio} onClose={() => setShowRadio(false)} />
      <BottomNav />
    </div>
  );
}
