import { useCallback, useState } from "react";
import type { PageKey } from "../help/pageHelp";
import {
  markTourSeen,
  markWelcomeSeen,
  resetTours,
  shouldAutoStart,
  shouldShowWelcome,
  skipAllTours,
} from "./tourSteps";

// What the user has done with the tour on one page. index null = closed.
type TourState = { page: PageKey; index: number | null; direction: 1 | -1 };

// The welcome screen and the tour for the page the user is on. Nothing is copied into state when the
// page changes: as long as the user has not touched this page's tour, it follows the localStorage flags
// (welcome first, then each page's tour once, nothing after "Skip tutorial").
export function useTour(page: PageKey | null) {
  const [state, setState] = useState<TourState | null>(null);
  // The flags live in localStorage, which React does not watch. Bumping this renders again after a change.
  const [, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  const welcome = page !== null && shouldShowWelcome();

  let index: number | null = null;
  let direction: 1 | -1 = 1;
  // No tour card while the welcome is showing: it comes after "Start the tour"
  if (page !== null && !welcome) {
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

  // "Skip tutorial", on a tour card or on the welcome screen
  const skipAll = useCallback(() => {
    skipAllTours();
    markWelcomeSeen();
    close();
  }, [close]);

  // From the ? menu: this page's tour again
  const start = useCallback(() => page && setState({ page, index: 0, direction: 1 }), [page]);

  // Welcome: "Start the tour" goes straight into this page's tour
  const startFromWelcome = useCallback(() => {
    markWelcomeSeen();
    start();
  }, [start]);

  // Welcome: Esc closes only the welcome. The page's tour then starts by itself (if not seen).
  const dismissWelcome = useCallback(() => {
    markWelcomeSeen();
    refresh();
  }, []);

  // From the ? menu and the Help page: everything from the start, welcome included
  const restart = useCallback(() => {
    resetTours();
    setState(null);
    refresh();
  }, []);

  return { welcome, index, direction, onStep, close, skipAll, start, startFromWelcome, dismissWelcome, restart };
}
