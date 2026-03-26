/**
 * StellaOverlay.tsx — Beauty Style Pro v2.0.0
 * Bolla flottante AI Stella — accessibile sopra tutte le viste.
 * In ambiente web usa un pannello overlay; su Android nativo usa
 * il Capacitor Foreground Service Plugin (SYSTEM_ALERT_WINDOW).
 */

import { useState, useRef } from "react";
import { Sparkles, X, Mic, MessageSquare } from "lucide-react";
import { motion, AnimatePresence, useDragControls, PanInfo } from "framer-motion";
import StellaChatAI from "./StellaChatAI";
import StellaVoiceV2 from "./StellaVoiceV2";

type Mode = "chat" | "voice";

export default function StellaOverlay() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mode, setMode] = useState<Mode>("chat");
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setPos(prev => ({ x: prev.x + info.offset.x, y: prev.y + info.offset.y }));
  };

  return (
    <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[200]">
      {/* Pannello espanso */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="pointer-events-auto fixed bottom-28 right-4 w-[320px] h-[480px] bg-background border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            style={{ zIndex: 200 }}
          >
            {/* Barra modalità */}
            <div className="flex items-center gap-2 p-3 border-b border-border bg-gradient-to-r from-purple-900/30 to-pink-900/20 shrink-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex gap-1 flex-1">
                <button
                  type="button"
                  onClick={() => setMode("chat")}
                  className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-1 text-xs font-medium transition-colors ${
                    mode === "chat" ? "bg-purple-600 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <MessageSquare className="w-3 h-3" />
                  Chat
                </button>
                <button
                  type="button"
                  onClick={() => setMode("voice")}
                  className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-1 text-xs font-medium transition-colors ${
                    mode === "voice" ? "bg-purple-600 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Mic className="w-3 h-3" />
                  Voce
                </button>
              </div>
              <button
                type="button"
                aria-label="Chiudi Stella"
                onClick={() => setIsExpanded(false)}
                className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Contenuto modalità */}
            <div className="flex-1 overflow-hidden">
              {mode === "chat" ? (
                <StellaChatAI />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <StellaVoiceV2 />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB bolla Stella */}
      {!isExpanded && (
        <motion.button
          type="button"
          aria-label="Apri Stella AI"
          drag
          dragControls={dragControls}
          dragConstraints={constraintsRef}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          initial={{ x: pos.x, y: pos.y }}
          className="pointer-events-auto absolute bottom-28 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg shadow-purple-500/40 flex items-center justify-center cursor-grab active:cursor-grabbing"
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsExpanded(true)}
        >
          <Sparkles className="w-6 h-6 text-white" />
          {/* Glow ring */}
          <span className="absolute -inset-1 rounded-full border border-purple-400/40 animate-ping" />
          {/* Badge v2 */}
          <span className="absolute -top-0.5 -right-0.5 bg-pink-500 text-white text-[8px] font-bold rounded-full px-1 leading-4">
            AI
          </span>
        </motion.button>
      )}
    </div>
  );
}
