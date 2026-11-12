import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./HelpButton.module.css";

type Props = {
  // undefined on a page without a tour
  onShowTour?: () => void;
  onRestart: () => void;
};

// The round ? in the bottom-right corner of every project page, with a small menu:
// this page's tour, the whole tutorial from the start, and the Help page.
export function HelpButton({ onShowTour, onRestart }: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close the menu on Esc or on a click anywhere outside it
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  // Runs the action and closes the menu
  const choose = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <div ref={wrapperRef} className={styles.wrapper} data-tour="help-button">
      {open && (
        <div className={styles.menu} role="menu" aria-label="Help">
          {onShowTour && (
            <button type="button" role="menuitem" onClick={choose(onShowTour)}>
              Show the tour for this page
            </button>
          )}
          <button type="button" role="menuitem" onClick={choose(onRestart)}>
            Restart the tutorial
          </button>
          <Link to="/help" role="menuitem" onClick={() => setOpen(false)}>
            Help &amp; guides
          </Link>
        </div>
      )}
      <button
        type="button"
        className={styles.button}
        aria-label="Help"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        ?
      </button>
    </div>
  );
}
