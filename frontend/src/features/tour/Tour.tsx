import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { placeCard } from "./placeCard";
import type { TourStep } from "./tourSteps";
import { useTargetRect } from "./useTargetRect";
import styles from "./Tour.module.css";

type Props = {
  steps: TourStep[];
  index: number;
  // Which way the user is going: a missing element is skipped in the same direction
  direction: 1 | -1;
  onStep: (index: number, direction: 1 | -1) => void;
  // ✕, Esc or Done: this page's tour is finished
  onClose: () => void;
  // "Skip tutorial": no tour starts by itself any more
  onSkipAll: () => void;
};

const SPOTLIGHT_PADDING = 6; // the highlight is a little bigger than the element
const CARD_WIDTH = 320;

// One step of a tour: the page dimmed, the element highlighted, and a card next to it
// (title, ✕, text, "2 of 6", Skip tutorial, Back, Next/Done). Steps with no element: card in the middle.
export function Tour({ steps, index, direction, onStep, onClose, onSkipAll }: Props) {
  const step = steps[index];
  const target = useTargetRect(step.target);
  const isLast = index === steps.length - 1;

  const next = () => (isLast ? onClose() : onStep(index + 1, 1));
  const back = () => index > 0 && onStep(index - 1, -1);

  // The element is not on the page: skip the step in the direction the user was going.
  // Going back from the first steps there is nowhere to go, so then forward.
  useEffect(() => {
    if (target.status !== "missing") return;
    if (direction === -1 && index > 0) onStep(index - 1, -1);
    else if (isLast) onClose();
    else onStep(index + 1, 1);
  }, [target.status, direction, index, isLast, onStep, onClose]);

  // The page behind the tour can be seen but not used: no clicks, no Tab, no screen reader.
  // The card is rendered outside #root (portal), so it is not affected.
  useEffect(() => {
    const root = document.getElementById("root");
    if (!root) return;
    root.inert = true;
    return () => {
      root.inert = false;
    };
  }, []);

  // Keyboard: Esc closes, the arrow keys go forward and back (Enter and Space work on the buttons)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") (isLast ? onClose : () => onStep(index + 1, 1))();
      else if (e.key === "ArrowLeft" && index > 0) onStep(index - 1, -1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, isLast, onStep, onClose]);

  // The card's real height is needed to place it. It changes with the text, so it is measured.
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState(180);
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const observer = new ResizeObserver(() => setCardHeight(card.offsetHeight));
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  // Hidden while looking for the element, so the card does not jump from the middle to its place
  const visible = step.target === null || target.status !== "searching";

  // Move focus to the card on every step, so a screen reader reads the new title and text.
  // Only once it is visible: a hidden element cannot take focus.
  useEffect(() => {
    if (visible) cardRef.current?.focus();
  }, [index, visible]);

  const found = target.status === "found" ? target.box : null;
  const cardWidth = Math.min(CARD_WIDTH, window.innerWidth - 24);

  let cardStyle: CSSProperties;
  let arrow: { placement: string; offset: number } | null = null;
  if (found) {
    const spot = {
      top: found.top - SPOTLIGHT_PADDING,
      left: found.left - SPOTLIGHT_PADDING,
      width: found.width + SPOTLIGHT_PADDING * 2,
      height: found.height + SPOTLIGHT_PADDING * 2,
    };
    const place = placeCard(spot, { width: cardWidth, height: cardHeight }, {
      width: window.innerWidth,
      height: window.innerHeight,
    }, step.placement);
    cardStyle = { top: place.top, left: place.left, width: cardWidth };
    arrow = { placement: place.placement, offset: place.arrowOffset };
  } else {
    // No element (or still looking for it): in the middle of the screen
    cardStyle = { top: "50%", left: "50%", width: cardWidth, transform: "translate(-50%, -50%)" };
  }

  const titleId = "tour-title";
  const bodyId = "tour-body";

  return createPortal(
    <div className={styles.layer}>
      {found ? (
        // The giant box-shadow dims everything around the element, so the element itself stays bright
        <div
          className={styles.spotlight}
          style={{
            top: found.top - SPOTLIGHT_PADDING,
            left: found.left - SPOTLIGHT_PADDING,
            width: found.width + SPOTLIGHT_PADDING * 2,
            height: found.height + SPOTLIGHT_PADDING * 2,
          }}
        />
      ) : (
        <div className={styles.dim} />
      )}

      <div
        ref={cardRef}
        className={styles.card}
        style={{ ...cardStyle, visibility: visible ? "visible" : "hidden" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
      >
        {arrow && (
          <span
            className={`${styles.arrow} ${styles[arrow.placement]}`}
            style={arrow.placement === "top" || arrow.placement === "bottom" ? { left: arrow.offset } : { top: arrow.offset }}
            aria-hidden="true"
          />
        )}

        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {step.title}
          </h2>
          <button type="button" className={styles.close} aria-label="Close the tour" onClick={onClose}>
            ✕
          </button>
        </div>

        <p id={bodyId} className={styles.body}>
          {step.body}
        </p>

        <div className={styles.footer}>
          <span className={styles.counter}>
            {index + 1} of {steps.length}
          </span>
          <button type="button" className={styles.skip} onClick={onSkipAll}>
            Skip tutorial
          </button>
          <div className={styles.buttons}>
            {index > 0 && (
              <button type="button" className={styles.secondary} onClick={back}>
                Back
              </button>
            )}
            <button type="button" onClick={next}>
              {isLast ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
