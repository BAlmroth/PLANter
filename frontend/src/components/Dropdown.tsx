import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import styles from "./Dropdown.module.css";
import { useDismiss } from "./useDismiss";

export type DropdownOption = { value: string; label: string };

type Props = {
  // What the dropdown is for, read by screen readers ("Show tasks of")
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  // Shown on the button when the value is not one of the options (nothing is chosen yet)
  placeholder?: string;
  disabled?: boolean;
  // The button is as wide as its container (a field in a form). The list floats under it.
  block?: boolean;
  // For narrow places (a card): like block, but the list opens in the page flow under the button,
  // so nothing is cut off. Long names wrap instead of getting "…".
  fullWidth?: boolean;
  // Sits inside a line of text, small, like a word with an arrow
  inline?: boolean;
  // The list opens above the button, for a place near the bottom of a box that cuts off what sticks out
  openUp?: boolean;
  // For the place the dropdown is put in (spacing, a flex size)
  className?: string;
};

// Choose one of a few options. A button and a list of buttons instead of a <select>, because the list of a
// <select> is drawn by the browser and cannot be styled. Looks like the project switcher in the header.
// Keyboard: arrow up/down on the button opens the list, arrow up/down/Home/End move in it, Enter picks, Esc closes.
export function Dropdown({
  label,
  value,
  options,
  onChange,
  placeholder = "Choose…",
  disabled,
  block,
  fullWidth,
  inline,
  openUp,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // true when the list was opened with the keyboard: then the focus moves into it
  const focusList = useRef(false);

  useDismiss(open, () => setOpen(false), wrapperRef);

  // After a keyboard open: focus the chosen option (or the first one)
  useEffect(() => {
    if (!open || !focusList.current) return;
    focusList.current = false;
    const buttons = menuRef.current?.querySelectorAll<HTMLButtonElement>("button");
    const chosen = menuRef.current?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]');
    (chosen ?? buttons?.[0])?.focus();
  }, [open]);

  const current = options.find((option) => option.value === value);

  function onButtonKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      focusList.current = true;
      setOpen(true);
    }
  }

  // Arrow keys move between the options. Esc closes and puts the focus back on the button.
  function onMenuKeyDown(event: KeyboardEvent) {
    const buttons = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    let next: number | null = null;
    if (event.key === "ArrowDown") next = Math.min(index + 1, buttons.length - 1);
    if (event.key === "ArrowUp") next = Math.max(index - 1, 0);
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = buttons.length - 1;
    if (next !== null) {
      event.preventDefault();
      buttons[next]?.focus();
    }
    if (event.key === "Escape") {
      setOpen(false);
      buttonRef.current?.focus();
    }
  }

  const wrapperClass = [
    styles.wrapper,
    fullWidth ? styles.full : "",
    block ? styles.block : "",
    inline ? styles.inline : "",
    openUp ? styles.up : "",
    className ?? "",
  ].join(" ");

  return (
    <div ref={wrapperRef} className={wrapperClass}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.button}
        aria-label={`${label}: ${current?.label ?? placeholder}`}
        aria-haspopup="true"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((isOpen) => !isOpen)}
        onKeyDown={onButtonKeyDown}
      >
        <span className={styles.name}>{current?.label ?? placeholder}</span>
        <span aria-hidden="true">{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div ref={menuRef} className={styles.menu} role="group" aria-label={label} onKeyDown={onMenuKeyDown}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={styles.option}
              aria-pressed={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
                buttonRef.current?.focus();
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
