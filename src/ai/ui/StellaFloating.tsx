// src/ai/ui/StellaFloating.tsx
import { useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { ListeningRing, SpeakingRing, ScaleInButton } from './StellaAnimations';

interface StellaFloatingProps {
  isOpen: boolean;
  isListening: boolean;
  isWakeWordListening: boolean;
  isSpeaking: boolean;
  onOpen: () => void;
}

export default function StellaFloating({
  isOpen,
  isListening,
  isWakeWordListening,
  isSpeaking,
  onOpen,
}: StellaFloatingProps) {
  const constraintsRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Drag constraint overlay */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[9998]" />

      <AnimatePresence>
        {!isOpen && (
          <ScaleInButton
            ariaLabel="Apri Stella AI V3"
            drag
            dragConstraints={constraintsRef}
            onClick={onOpen}
            className="fixed bottom-24 right-4 z-[9999] w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 shadow-lg shadow-purple-500/40 flex items-center justify-center pointer-events-auto"
          >
            <Sparkles className="w-6 h-6 text-white" />
            <ListeningRing active={isListening || isWakeWordListening} />
            <SpeakingRing active={isSpeaking} />
          </ScaleInButton>
        )}
      </AnimatePresence>
    </>
  );
}
