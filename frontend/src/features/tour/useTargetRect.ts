import { useEffect, useState } from "react";
import { unionBox, type Box } from "./placeCard";

// What the hook knows about the current step's element
export type TargetState =
  | { status: "searching" }
  // animate: the box may slide to its place. False while the page scrolls: then it follows exactly.
  | { status: "found"; box: Box; animate: boolean }
  | { status: "missing" }; // not on the page after SEARCH_MS: the tour skips the step

const SEARCH_MS = 2000;
const RETRY_MS = 100;

type Result = { target: string; state: TargetState };

// Finds the element with data-tour="<target>" and keeps its position on screen up to date.
// A list of targets ("nav-items" and "nav-tasks") gives one box around all of them, and counts as
// found only when every one of them is there. target null = a card in the middle of the screen.
export function useTargetRect(target: string | string[] | null): TargetState {
  const [result, setResult] = useState<Result | null>(null);
  // One string for the list, so the effect below runs again only when the names really change
  const key = target === null ? null : [target].flat().join(" ");

  useEffect(() => {
    if (key === null) return;
    // The names are always our own constants from tourSteps.ts, never user text
    const selectors = key.split(" ").map((name) => `[data-tour="${name}"]`);
    const startedAt = Date.now();
    let elements: Element[] = [];
    let retry: number | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let animate = false;
    let scrollSeen = false;

    function measure() {
      if (elements.length === 0) return;
      const box = unionBox(
        elements.map((element) => {
          const { top, left, width, height } = element.getBoundingClientRect();
          return { top, left, width, height };
        }),
      );
      setResult({ target: key!, state: { status: "found", box, animate } });
    }

    // Scrolling (the page, or a box like the sidebar): follow the element exactly, no sliding
    function onScroll() {
      scrollSeen = true;
      animate = false;
      measure();
    }

    function find() {
      // An element with no size (an empty list, something hidden) counts as not there yet
      const candidates = selectors.map((selector) => document.querySelector(selector));
      const allThere = candidates.every((candidate) => {
        const rect = candidate?.getBoundingClientRect();
        return rect !== undefined && rect.width > 0 && rect.height > 0;
      });
      elements = allThere ? (candidates as Element[]) : [];
      const element = elements[0];
      if (element) {
        // Smooth scrolling, unless the user has asked the system for less motion
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        element.scrollIntoView({ block: "center", inline: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
        // Wait two frames to see if the page scrolls. If not, the box slides to its place with a
        // transition. If it does, the box follows the element every frame (a transition would lag).
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (elements.length === 0) return;
            animate = !scrollSeen;
            measure();
            // The elements can grow or shrink, for example when their data arrives
            resizeObserver = new ResizeObserver(measure);
            for (const observed of elements) resizeObserver.observe(observed);
          }),
        );
      } else if (Date.now() - startedAt > SEARCH_MS) {
        setResult({ target: key!, state: { status: "missing" } });
      } else {
        retry = window.setTimeout(find, RETRY_MS);
      }
    }

    retry = window.setTimeout(find, 0);
    // true = capture: also hears scrolling inside boxes (like the sidebar), not only the window
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", measure);

    return () => {
      window.clearTimeout(retry);
      resizeObserver?.disconnect();
      window.removeEventListener("scroll", onScroll, true);
      elements = []; // stops a pending frame callback from measuring after cleanup
      window.removeEventListener("resize", measure);
    };
  }, [key]);

  // An answer for an earlier step does not count: still searching for this one
  if (key === null || result?.target !== key) return { status: "searching" };
  return result.state;
}
