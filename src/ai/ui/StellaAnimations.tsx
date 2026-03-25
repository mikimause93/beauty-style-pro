// src/ai/ui/StellaAnimations.tsx
import { motion, type Variants, type PanInfo } from 'framer-motion';
import type { ReactNode } from 'react';

// ── Pulse ring shown when Stella is listening ────────────────────────────────
export function ListeningRing({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <span className="absolute -inset-1 rounded-full border-2 border-purple-400/60 animate-ping pointer-events-none" />
  );
}

// ── Speaking pulse ring ──────────────────────────────────────────────────────
export function SpeakingRing({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <span className="absolute -inset-0.5 rounded-full border-2 border-pink-400/60 animate-pulse pointer-events-none" />
  );
}

// ── Slide-up panel ────────────────────────────────────────────────────────────
const slideUp: Variants = {
  hidden: { y: '100%', opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', damping: 26, stiffness: 320 } },
  exit: { y: '100%', opacity: 0, transition: { duration: 0.2 } },
};

export function SlideUpPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={slideUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Scale-in FAB ─────────────────────────────────────────────────────────────
const scaleIn: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 20 } },
  exit: { scale: 0, opacity: 0, transition: { duration: 0.15 } },
};

export function ScaleInButton({
  children,
  className = '',
  onClick,
  drag,
  dragConstraints,
  onDragEnd,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  drag?: boolean;
  dragConstraints?: React.RefObject<HTMLElement>;
  onDragEnd?: (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
  ariaLabel?: string;
}) {
  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileTap={{ scale: 0.9 }}
      drag={drag}
      dragConstraints={dragConstraints}
      dragElastic={0.1}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.button>
  );
}

// ── Fade-in message bubble ────────────────────────────────────────────────────
const fadeIn: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export function FadeInMessage({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className={className}>
      {children}
    </motion.div>
  );
}
