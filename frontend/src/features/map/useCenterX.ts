import { useEffect, useState } from "react";

// The horizontal middle of an element, in px from the left edge of the window.
// Used to center the pinned message box (position: fixed) over the map instead of over the window.
// null until the element is on the page.
export function useCenterX(element: HTMLElement | null): number | null {
  const [centerX, setCenterX] = useState<number | null>(null);

  useEffect(() => {
    if (!element) return;
    const el = element; // a const, so TypeScript knows it is not null inside measure()
    function measure() {
      const rect = el.getBoundingClientRect();
      setCenterX(rect.left + rect.width / 2);
    }
    measure();
    // ResizeObserver: the map itself changes width (full window, sidebar hidden on a small screen).
    // resize: the window changes, which can move the map without changing its width (the page is centered).
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [element]);

  return centerX;
}
