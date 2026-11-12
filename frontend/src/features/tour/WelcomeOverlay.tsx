import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { Box } from "./placeCard";
import { useInertRoot } from "./useInertRoot";
import { WELCOME_MARKS, isOnScreen, markGeometry } from "./welcomeMarks";
import styles from "./WelcomeOverlay.module.css";

type Props = {
  onStart: () => void;
  // Esc: close the welcome only (the page's tour follows)
  onDismiss: () => void;
  onSkipAll: () => void;
};

// The first thing a new user sees in a project: the page dimmed, labels with arrows pointing at the
// main areas (all at once), and a welcome in the middle with "Start the tour" and "Skip tutorial".
export function WelcomeOverlay({ onStart, onDismiss, onSkipAll }: Props) {
  useInertRoot();
  const boxes = useBoxes(WELCOME_MARKS.map((mark) => mark.target));

  // Focus the main button, so Enter starts the tour and a screen reader starts in the dialog
  const startRef = useRef<HTMLButtonElement>(null);
  useEffect(() => startRef.current?.focus(), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onDismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const marks = WELCOME_MARKS.filter((mark) => boxes[mark.target] && isOnScreen(boxes[mark.target], viewport)).map(
    (mark) => ({ mark, geometry: markGeometry(boxes[mark.target], mark) }),
  );

  return createPortal(
    <div className={styles.layer} role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      {/* The labels repeat what the tour explains, so screen readers skip them */}
      <div className={styles.marks} aria-hidden="true">
        <svg className={styles.arrows}>
          <defs>
            {/* The arrowhead, drawn at the end of every arrow */}
            <marker id="welcome-arrowhead" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 1 1 L 8 5 L 1 9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </marker>
          </defs>
          {marks.map(({ mark, geometry: { arrow } }) => (
            // Q = a curve from `from` to `to` that bends toward `control`
            <path
              key={mark.target}
              d={`M ${arrow.from.x} ${arrow.from.y} Q ${arrow.control.x} ${arrow.control.y} ${arrow.to.x} ${arrow.to.y}`}
              markerEnd="url(#welcome-arrowhead)"
            />
          ))}
        </svg>
        {marks.map(({ mark, geometry: { label } }) => (
          <span key={mark.target} className={`${styles.label} ${styles[label.align]}`} style={labelStyle(label)}>
            {mark.text}
          </span>
        ))}
      </div>

      <div className={styles.center}>
        <h2 id="welcome-title" className={styles.title}>
          Welcome to PLANter!
        </h2>
        <p className={styles.text}>
          Let's look around your project. The tour takes about a minute, and you can open it again any time
          with the ? button.
        </p>
        <button ref={startRef} type="button" className={styles.start} onClick={onStart}>
          Start the tour
        </button>
        <button type="button" className={styles.skip} onClick={onSkipAll}>
          Skip tutorial
        </button>
      </div>
    </div>,
    document.body,
  );
}

// The label's position. The CSS class for its align moves it so the right edge faces the element.
function labelStyle(label: { x: number; y: number }): CSSProperties {
  return { top: label.y, left: label.x };
}

// Where the elements are on screen, measured on every frame. They can move or appear late
// (the progress bar shows up when its data arrives), and a frame is cheap for a few elements.
// Only a real change causes a new render.
function useBoxes(targets: string[]): Record<string, Box> {
  const [boxes, setBoxes] = useState<Record<string, Box>>({});
  // Joined into one string, so a new array with the same names does not restart the effect
  const targetList = targets.join(",");

  useEffect(() => {
    let frame = 0;
    let last = "";
    function measure() {
      const next: Record<string, Box> = {};
      for (const target of targetList.split(",")) {
        const element = document.querySelector(`[data-tour="${target}"]`);
        if (element) {
          const { top, left, width, height } = element.getBoundingClientRect();
          next[target] = { top, left, width, height };
        }
      }
      const key = JSON.stringify(next);
      if (key !== last) {
        last = key;
        setBoxes(next);
      }
      frame = requestAnimationFrame(measure);
    }
    frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [targetList]);

  return boxes;
}
