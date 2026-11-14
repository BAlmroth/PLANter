import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

// A gate holds back a page until everything on it has loaded, so nothing pops in one box at a time.
// Components on the page call useGateLoading(loading). While any of them is loading for the first
// time, the gate is pending and <LoadGate> shows one loader instead.

export type Gate = { hold: () => () => void };

export const GateContext = createContext<Gate | null>(null);

// Owns the count of components that are still loading. Used by <LoadGate>'s parent.
export function useLoadGate() {
  const [count, setCount] = useState(0);
  const gate = useMemo<Gate>(
    () => ({
      hold: () => {
        setCount((c) => c + 1);
        return () => setCount((c) => c - 1);
      },
    }),
    [],
  );
  return { pending: count > 0, gate };
}

// Call in any component that fetches. Only the FIRST load holds the gate: a later refetch
// ("Try again", after an edit) must not hide the page again.
// Pass a gate to use that one, otherwise the nearest <LoadGate> is used. No gate: does nothing.
export function useGateLoading(loading: boolean, gate?: Gate) {
  const context = useContext(GateContext);
  const target = gate ?? context;
  const [settled, setSettled] = useState(false);

  // Setting state while rendering is allowed in React when it only depends on the props
  if (!loading && !settled) setSettled(true);

  const holding = loading && !settled;
  // Layout effect, so the gate is pending before the browser paints and nothing flashes
  useLayoutEffect(() => {
    if (!holding || !target) return;
    return target.hold();
  }, [holding, target]);
}
