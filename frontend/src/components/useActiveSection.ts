import { useEffect, useState } from "react";

// Which of the sections (by element id) is on screen now, for a toggle that jumps between them.
//
// IntersectionObserver is a browser API that calls us when an element enters or leaves an area of
// the screen, instead of us checking on every scroll event. rootMargin shrinks that area to a thin
// line 40% down the screen (-40% from the top, -60% from the bottom): the section that crosses
// that line is the active one.
export function useActiveSection<T extends string>(ids: readonly T[], initial: T) {
  const [active, setActive] = useState<T>(initial);

  // The ids as one string, so the effect does not run again when the parent passes a new array with the same ids
  const idKey = ids.join(",");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id as T);
        }
      },
      { rootMargin: "-40% 0px -60% 0px" },
    );

    for (const id of idKey.split(",")) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }

    // Stop watching when the page closes
    return () => observer.disconnect();
  }, [idKey]);

  return [active, setActive] as const;
}
