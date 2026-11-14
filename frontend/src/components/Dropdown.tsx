import { useRef, useState } from "react";
import styles from "./Dropdown.module.css";
import { useDismiss } from "./useDismiss";

export type DropdownOption = { value: string; label: string };

type Props = {
  // What the dropdown is for, read by screen readers ("Show tasks of")
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  // For narrow places (a card): the button is as wide as its container and the list opens in the page
  // flow under it, so nothing is cut off. Long names wrap instead of getting "…".
  fullWidth?: boolean;
};

// Choose one of a few options. A button and a list of buttons instead of a <select>, because the list of a
// <select> is drawn by the browser and cannot be styled. Looks like the project switcher in the header.
export function Dropdown({ label, value, options, onChange, fullWidth = false }: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useDismiss(open, () => setOpen(false), wrapperRef);

  const current = options.find((option) => option.value === value);

  return (
    <div ref={wrapperRef} className={`${styles.wrapper} ${fullWidth ? styles.full : ""}`}>
      <button
        type="button"
        className={styles.button}
        aria-label={`${label}: ${current?.label ?? ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <span className={styles.name}>{current?.label}</span>
        <span aria-hidden="true">{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div className={styles.menu} role="group" aria-label={label}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={styles.option}
              aria-pressed={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
