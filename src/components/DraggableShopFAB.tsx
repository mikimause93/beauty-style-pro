import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShoppingBag, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Messenger-style draggable floating Shop button.
 * - Defaults to bottom-left corner (above BottomNav)
 * - Draggable anywhere on screen
 * - Snaps to nearest horizontal edge on release
 * - Tap opens /shop
 */
export default function DraggableShopFAB() {
  const navigate = useNavigate();
  const location = useLocation();
  const isShopActive = location.pathname.startsWith("/shop");

  // Position: null = use default CSS (bottom-right)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ x: 0, y: 0, posX: 0, posY: 0, moved: false });
  const btnRef = useRef<HTMLButtonElement>(null);

  // ── Touch drag ──────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { x: touch.clientX, y: touch.clientY, posX: rect.left, posY: rect.top, moved: false };
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragRef.current.x;
    const dy = touch.clientY - dragRef.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragRef.current.moved = true;
    const newX = Math.max(4, Math.min(window.innerWidth - 60, dragRef.current.posX + dx));
    const newY = Math.max(4, Math.min(window.innerHeight - 80, dragRef.current.posY + dy));
    setPos({ x: newX, y: newY });
  };

  const onTouchEnd = () => {
    setIsDragging(false);
    if (!dragRef.current.moved) {
      navigate("/shop");
      return;
    }
    // Snap to nearest horizontal edge
    if (pos) {
      const snapX = pos.x < window.innerWidth / 2 ? 8 : window.innerWidth - 60;
      setPos(prev => prev ? { ...prev, x: snapX } : prev);
    }
  };

  // ── Mouse drag (desktop) ────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { x: e.clientX, y: e.clientY, posX: rect.left, posY: rect.top, moved: false };
    setIsDragging(true);

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - dragRef.current.x;
      const dy = ev.clientY - dragRef.current.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragRef.current.moved = true;
      const newX = Math.max(4, Math.min(window.innerWidth - 60, dragRef.current.posX + dx));
      const newY = Math.max(4, Math.min(window.innerHeight - 80, dragRef.current.posY + dy));
      setPos({ x: newX, y: newY });
    };
    const onUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      if (!dragRef.current.moved) navigate("/shop");
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const posStyle: React.CSSProperties = pos
    ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" }
    : { right: 16, bottom: 90 };

  return (
    <button
      ref={btnRef}
      aria-label="Shop"
      className={cn(
        "fixed z-[9000] w-[52px] h-[52px] rounded-full flex items-center justify-center",
        "shadow-2xl touch-none select-none",
        "transition-transform duration-200",
        isDragging ? "scale-110" : "scale-100",
        isShopActive
          ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_0_20px_rgba(251,191,36,0.5)]"
          : "bg-gradient-to-br from-amber-400 to-yellow-500 shadow-[0_0_12px_rgba(251,191,36,0.3)]"
      )}
      style={{
        position: "fixed",
        ...posStyle,
        transition: isDragging ? "none" : "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
    >
      <ShoppingBag className="w-[22px] h-[22px] text-white drop-shadow" />
      {/* Star sparkle accent */}
      <Sparkles className="absolute top-0.5 right-0.5 w-3 h-3 text-white/80" />
      {/* Messenger-style glow ring */}
      <span className={cn(
        "absolute inset-0 rounded-full border-2 border-white/30",
        !isShopActive && "animate-pulse"
      )} />
    </button>
  );
}
