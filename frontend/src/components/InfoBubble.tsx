import { useId } from "react";
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
// in a bubble under it. Plain CSS (:hover and :focus-within), no state.
export function InfoBubble({ text, label, size = "normal" }: Props) {
  // A unique id, so the button can point at its bubble with aria-describedby
  const id = useId();

  return (
    <span className={styles.wrapper}>
      <button type="button" className={size === "small" ? `${styles.button} ${styles.small}` : styles.button} aria-label={label} aria-describedby={id}>
        i
      </button>
      <span id={id} role="tooltip" className={styles.bubble}>
        {text}
      </span>
    </span>
  );
}
