import { useCallback, useState } from "react";
import type { PageKey } from "../help/pageHelp";
import { markTourSeen, resetTours, shouldAutoStart, skipAllTours } from "./tourSteps";

// What the user has done with the tour on one page. index null = closed.
type TourState = { page: PageKey; index: number | null; direction: 1 | -1 };

// The tour for the page the user is on. Nothing is copied into state when the page changes:
// as long as the user has not touched this page's tour, it follows the flags (show once, unless skipped).
export function useTour(page: PageKey | null) {
  const [state, setState] = useState<TourState | null>(null);

  let index: number | null = null;
  let direction: 1 | -1 = 1;
  if (page !== null) {
    if (state?.page === page) {
      ({ index, direction } = state);
    } else if (shouldAutoStart(page)) {
      index = 0;
    }
  }

  // useCallback: the tour's effects depend on these, so they must not be new functions on every render
  const onStep = useCallback(
    (next: number, dir: 1 | -1) => page && setState({ page, index: next, direction: dir }),
    [page],
  );

  const close = useCallback(() => {
    if (!page) return;
    markTourSeen(page);
    setState({ page, index: null, direction: 1 });
  }, [page]);

  const skipAll = useCallback(() => {
    skipAllTours();
    close();
  }, [close]);

  // From the ? menu: this page's tour again, or every tour from the start
  const start = useCallback(() => page && setState({ page, index: 0, direction: 1 }), [page]);
  const restart = useCallback(() => {
    resetTours();
    start();
  }, [start]);

  return { index, direction, onStep, close, skipAll, start, restart };
}
