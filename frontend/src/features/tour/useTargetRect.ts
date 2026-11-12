import { useEffect, useState } from "react";
import type { Box } from "./placeCard";

// What the hook knows about the current step's element
export type TargetState =
  | { status: "searching" }
  | { status: "found"; box: Box }
  | { status: "missing" }; // not on the page after SEARCH_MS: the tour skips the step

const SEARCH_MS = 2000;
const RETRY_MS = 100;

type Result = { target: string; state: TargetState };

// Finds the element with data-tour="<target>" and keeps its position on screen up to date.
// target null = a card in the middle of the screen, nothing to find.
export function useTargetRect(target: string | null): TargetState {
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (target === null) return;
    // target is always one of our own constants from tourSteps.ts, never user text
    const selector = `[data-tour="${target}"]`;
    const startedAt = Date.now();
    let element: Element | null = null;
    let retry: number | undefined;
    let resizeObserver: ResizeObserver | undefined;

    function measure() {
      if (!element) return;
      const { top, left, width, height } = element.getBoundingClientRect();
      setResult({ target: target!, state: { status: "found", box: { top, left, width, height } } });
    }

    function find() {
      const candidate = document.querySelector(selector);
      // An element with no size (an empty list, something hidden) counts as not there yet
      const rect = candidate?.getBoundingClientRect();
      element = rect && rect.width > 0 && rect.height > 0 ? candidate : null;
      if (element) {
        // Smooth scrolling, unless the user has asked the system for less motion
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        element.scrollIntoView({ block: "center", inline: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
        measure();
        // The element can grow or shrink, for example when its data arrives
        resizeObserver = new ResizeObserver(measure);
        resizeObserver.observe(element);
      } else if (Date.now() - startedAt > SEARCH_MS) {
        setResult({ target: target!, state: { status: "missing" } });
      } else {
        retry = window.setTimeout(find, RETRY_MS);
      }
    }

    retry = window.setTimeout(find, 0);
    // true = capture: also hears scrolling inside boxes (like the sidebar), not only the window
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);

    return () => {
      window.clearTimeout(retry);
      resizeObserver?.disconnect();
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [target]);

  // An answer for an earlier step does not count: still searching for this one
  if (target === null || result?.target !== target) return { status: "searching" };
  return result.state;
}
