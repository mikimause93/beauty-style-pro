import { useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const TAB_ROUTES = ["/", "/explore", "/shop", "/live", "/profile"];
const SWIPE_THRESHOLD = 80;
const SWIPE_MAX_Y = 60;

function isInsideScrollable(el: EventTarget | null): boolean {
  let node = el as HTMLElement | null;
  while (node) {
    if (node.scrollWidth > node.clientWidth + 2) return true;
    if (node.classList?.contains("no-scrollbar") || node.classList?.contains("overflow-x-auto")) return true;
    node = node.parentElement;
  }
  return false;
}

export function useSwipeNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const touchStart = useRef<{ x: number; y: number; scrollable: boolean } | null>(null);

  const currentIndex = TAB_ROUTES.indexOf(location.pathname);
  const isMainTab = currentIndex !== -1;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const scrollable = isInsideScrollable(e.target);
    touchStart.current = { x: touch.clientX, y: touch.clientY, scrollable };
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current || !isMainTab) return;

    // Don't swipe-navigate if started inside a horizontally scrollable element
    if (touchStart.current.scrollable) {
      touchStart.current = null;
      return;
    }

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
