import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Clap {
  id: number;
  x: number;
  emoji: string;
}

const CLAP_EMOJIS = ["👏", "👏🏻", "👏🏽", "🔥", "💖", "⭐", "✨"];

export function useApplause() {
  const [claps, setClaps] = useState<Clap[]>([]);

  const triggerApplause = useCallback((count = 8) => {
    const newClaps: Clap[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i + Math.random(),
      x: 10 + Math.random() * 80,
      emoji: CLAP_EMOJIS[Math.floor(Math.random() * CLAP_EMOJIS.length)],
    }));
    setClaps(prev => [...prev, ...newClaps]);

    // Play clap sound
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {}

    setTimeout(() => {
      setClaps(prev => prev.filter(c => !newClaps.find(n => n.id === c.id)));
    }, 2000);
  }, []);

  return { claps, triggerApplause };
}

export default function ApplauseAnimation({ claps }: { claps: Clap[] }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {claps.map(clap => (
          <motion.div
            key={clap.id}
            initial={{ opacity: 1, y: 0, scale: 0.5 }}
            animate={{ opacity: 0, y: -300, scale: 1.5, rotate: Math.random() * 40 - 20 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
            className="absolute bottom-32 text-3xl"
            style={{ left: `${clap.x}%` }}
          >
            {clap.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
