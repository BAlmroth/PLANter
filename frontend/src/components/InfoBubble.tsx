import { useId, useRef } from "react";
import styles from "./InfoBubble.module.css";

type Props = {
  // The help text, shown as plain text (React escapes it)
  text: string;
  // Read by screen readers on the button, for example "About this page"
  label: string;
  // "small" for section headings, so the "i" does not compete with the heading
  size?: "normal" | "small";
};

// A small round "i". Hovering it (or focusing it with Tab, or tapping it on a phone) shows the text
// in a bubble under it. CSS shows and hides it (:hover and :focus-within).
export function InfoBubble({ text, label, size = "normal" }: Props) {
  // A unique id, so the button can point at its bubble with aria-describedby
  const id = useId();
  const bubbleRef = useRef<HTMLSpanElement>(null);

  // The bubble opens to the right of the "i". On a phone it can stick out past the right edge of the
  // screen, so measure it when it opens and move it left by the part that sticks out (plus a 16px margin).
  // Runs on mouseenter / focus, when CSS has just shown the bubble, so it has a size.
  function keepOnScreen() {
    const bubble = bubbleRef.current;
    if (!bubble) return;
    bubble.style.setProperty("--shift", "0px"); // measure from the normal place
    const overflow = bubble.getBoundingClientRect().right - (document.documentElement.clientWidth - 16);
    if (overflow > 0) bubble.style.setProperty("--shift", `${-overflow}px`);
  }

  return (
    <span className={styles.wrapper} onMouseEnter={keepOnScreen} onFocus={keepOnScreen}>
      <button type="button" className={size === "small" ? `${styles.button} ${styles.small}` : styles.button} aria-label={label} aria-describedby={id}>
        i
      </button>
      <span ref={bubbleRef} id={id} role="tooltip" className={styles.bubble}>
        {text}
      </span>
    </span>
  );
}
