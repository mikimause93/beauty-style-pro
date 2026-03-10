import { useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const TAB_ROUTES = ["/", "/explore", "/shop", "/live", "/profile"];
const SWIPE_THRESHOLD = 60;
const SWIPE_MAX_Y = 80;

export function useSwipeNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const currentIndex = TAB_ROUTES.indexOf(location.pathname);
  const isMainTab = currentIndex !== -1;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current || !isMainTab) return;

    const touch = e.changedTouches[0];
    const dx = touchStart.current.x - touch.clientX;
    const dy = Math.abs(touchStart.current.y - touch.clientY);

    touchStart.current = null;

    if (dy > SWIPE_MAX_Y || Math.abs(dx) < SWIPE_THRESHOLD) return;

    if (dx > 0 && currentIndex < TAB_ROUTES.length - 1) {
      navigate(TAB_ROUTES[currentIndex + 1]);
    } else if (dx < 0 && currentIndex > 0) {
      navigate(TAB_ROUTES[currentIndex - 1]);
    }
  }, [isMainTab, currentIndex, navigate]);

  return { onTouchStart, onTouchEnd, isMainTab };
}
