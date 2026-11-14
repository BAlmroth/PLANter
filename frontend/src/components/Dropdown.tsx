import { useEffect, useRef, useState } from "react";
import styles from "./Dropdown.module.css";

export type DropdownOption = { value: string; label: string };

type Props = {
  // What the dropdown is for, read by screen readers ("Show tasks of")
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
};

// Choose one of a few options. A button and a list of buttons instead of a <select>, because the list of a
// <select> is drawn by the browser and cannot be styled. Looks like the project switcher in the header.
export function Dropdown({ label, value, options, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close the menu on Esc or on a click anywhere outside it
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onClick(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const current = options.find((option) => option.value === value);

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
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
