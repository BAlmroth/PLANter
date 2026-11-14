import { useRef, useState } from "react";
import styles from "./ActionMenu.module.css";
import { useDismiss } from "./useDismiss";

export type MenuAction = {
  label: string;
  onSelect: () => void;
  // Shown in the warning color on hover, for Delete
  danger?: boolean;
};

type Props = {
  // What the button does, read by screen readers ("Edit or delete Build form")
  label: string;
  actions: MenuAction[];
  disabled?: boolean;
};

// A small pencil button that opens a menu of actions under it (for example Edit and Delete).
// The menu looks like the one of Dropdown and the project switcher.
export function ActionMenu({ label, actions, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  useDismiss(open, () => setOpen(false), wrapperRef);

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <button
        type="button"
        className={styles.button}
        aria-label={label}
        title={label}
        aria-haspopup="true"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        {/* A pencil. It uses the text color (currentColor). */}
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path
            d="M11 2.5 13.5 5 5.5 13H3v-2.5L11 2.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div className={styles.menu} role="group" aria-label={label}>
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={`${styles.option} ${action.danger ? styles.danger : ""}`}
              onClick={() => {
                setOpen(false);
                action.onSelect();
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
