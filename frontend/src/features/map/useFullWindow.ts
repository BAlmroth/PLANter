import { useEffect, useState, type RefObject } from "react";
import type { Edge, ReactFlowInstance } from "@xyflow/react";
import type { ItemNodeType } from "./types";

// "Full window": the map is fixed over the page (styles.expanded in MapView.module.css).
// flowRef: the React Flow instance, to zoom the map to fit again when its size changes.
export function useFullWindow(flowRef: RefObject<ReactFlowInstance<ItemNodeType, Edge> | null>) {
  const [expanded, setExpanded] = useState(false);

  // While it is open the page behind cannot scroll, and Esc closes it,
  // unless a dialog or the tutorial is open (they use Esc themselves).
  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (document.querySelector("dialog[open]") || document.getElementById("root")?.hasAttribute("inert")) return;
      setExpanded(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [expanded]);

  // The map changes size when it expands or shrinks, so zoom to fit it again
  useEffect(() => {
    const timer = setTimeout(() => flowRef.current?.fitView({ duration: 200 }), 50);
    return () => clearTimeout(timer);
  }, [expanded, flowRef]);

  return { expanded, setExpanded };
}
