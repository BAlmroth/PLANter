import { useEffect, useRef, useState } from "react";
import styles from "./WarningBadge.module.css";

// A small "!" button for an item with warnings. Click it to see what might be missing.
// Takes plain messages (not Warning objects) so the map node can carry them in its data.
// Renders nothing when there is nothing to warn about.
export function WarningBadge({ messages }: { messages: string[] }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  // While the popover is open, a click anywhere else closes it
  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  if (messages.length === 0) return null;

  return (
    // "nodrag nopan" are React Flow classes: without them, pressing the button on the map
    // would start dragging the node (or panning the map) instead of clicking.
    <span
      ref={wrapperRef}
      className={`${styles.wrapper} nodrag nopan`}
      onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
    >
      <button
        type="button"
        className={styles.button}
        aria-label={messages.length === 1 ? "1 warning" : `${messages.length} warnings`}
        aria-expanded={open}
        onClick={(event) => {
          // On the map a click on a node opens the item. This click is only for the badge.
          event.stopPropagation();
          setOpen((current) => !current);
        }}
      >
        !
      </button>
      {open && (
        <ul className={styles.popover} role="status">
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
    </span>
  );
}
