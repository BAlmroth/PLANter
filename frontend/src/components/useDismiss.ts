import { useEffect, type RefObject } from "react";

// Closes a menu on Esc or on a click anywhere outside it (wrapperRef is the menu and its button).
// Used by Dropdown and ActionMenu.
export function useDismiss(open: boolean, close: () => void, wrapperRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    function onClick(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) close();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open, close, wrapperRef]);
}
