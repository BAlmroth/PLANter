import { useEffect } from "react";

// While a tour card is open, the app behind it can be seen but not used:
// no clicks, no Tab, no screen reader. The card itself is rendered outside #root (a portal),
// so it is not affected.
export function useInertRoot() {
  useEffect(() => {
    const root = document.getElementById("root");
    if (!root) return;
    root.inert = true;
    return () => {
      root.inert = false;
    };
  }, []);
}
