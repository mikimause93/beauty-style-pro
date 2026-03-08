import { ReactNode } from "react";
import BottomNav from "./BottomNav";

interface MobileLayoutProps {
  children: ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      <main className="pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
