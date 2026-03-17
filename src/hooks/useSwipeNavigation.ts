import { useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const TAB_ROUTES = ["/home", "/explore", "/shop", "/live", "/profile"];
const SWIPE_THRESHOLD = 120;
const SWIPE_MAX_Y_RATIO = 0.5; // dy must be < dx * ratio

function isInsideScrollable(el: EventTarget | null): boolean {
  let node = el as HTMLElement | null;
  while (node) {
    // Check CSS classes commonly used for horizontal scroll
    const cls = node.classList;
    if (
      cls?.contains("no-scrollbar") ||
      cls?.contains("overflow-x-auto") ||
      cls?.contains("scrollbar-hide") ||
      cls?.contains("overflow-x-scroll")
    ) return true;

    // Check computed overflow-x or if element actually scrolls horizontally
    if (node.scrollWidth > node.clientWidth + 4) {
      const style = window.getComputedStyle(node);
      const overflowX = style.overflowX;
      if (overflowX === "auto" || overflowX === "scroll") return true;
    }

    // Stop at main layout container
    if (node.tagName === "MAIN" || node.id === "root") break;
    node = node.parentElement;
  }
  return false;
}

export function useSwipeNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const touchStart = useRef<{ x: number; y: number; scrollable: boolean; time: number } | null>(null);

  const currentIndex = TAB_ROUTES.indexOf(location.pathname);
  const isMainTab = currentIndex !== -1;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const scrollable = isInsideScrollable(e.target);
    touchStart.current = { x: touch.clientX, y: touch.clientY, scrollable, time: Date.now() };
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current || !isMainTab) return;

    // Never interfere with scrollable containers
    if (touchStart.current.scrollable) {
      touchStart.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    const dx = touchStart.current.x - touch.clientX;
    const dy = Math.abs(touchStart.current.y - touch.clientY);
    const elapsed = Date.now() - touchStart.current.time;

    touchStart.current = null;

    // Must be a clear horizontal swipe: fast, long, and mostly horizontal
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (dy > Math.abs(dx) * SWIPE_MAX_Y_RATIO) return;
    if (elapsed > 600) return; // too slow = scroll, not swipe

    if (dx > 0 && currentIndex < TAB_ROUTES.length - 1) {
      navigate(TAB_ROUTES[currentIndex + 1]);
    } else if (dx < 0 && currentIndex > 0) {
      navigate(TAB_ROUTES[currentIndex - 1]);
    }
  }, [isMainTab, currentIndex, navigate]);

  return { onTouchStart, onTouchEnd, isMainTab };
}
