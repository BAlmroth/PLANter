import { useState, type CSSProperties, type KeyboardEvent } from "react";
import styles from "./ChipInput.module.css";

type Props = {
  // Read by screen readers, for example "Add a page"
  label: string;
  values: string[];
  onAdd: (text: string) => void;
  onRemove: (index: number) => void;
  placeholder?: string;
  // Shown instead of the input when the list is full
  disabled?: boolean;
  // For example the item type's --type-color, so the chips have the category's color
  style?: CSSProperties;
};

// A list of names as chips, with a field to add more. Enter, the Add button or leaving the field adds
// what was typed, so a name is never lost because the user forgot to press Enter.
export function ChipInput({ label, values, onAdd, onRemove, placeholder, disabled = false, style }: Props) {
  const [text, setText] = useState("");

  function add() {
    if (text.trim() === "") return;
    onAdd(text);
    setText("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      // Enter adds a chip instead of submitting a form around it
      e.preventDefault();
      add();
    }
  }

  return (
    <div className={styles.wrapper} style={style}>
      {values.length > 0 && (
        <ul className={styles.chips}>
          {values.map((value, index) => (
            // Names are unique in a list (addEntry), so the name works as key
            <li key={value} className={styles.chip}>
              {value}
              <button
                type="button"
                className={styles.remove}
                aria-label={`Remove ${value}`}
                onClick={() => onRemove(index)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.row}>
        <input
          type="text"
          aria-label={label}
          maxLength={100}
          value={text}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={add}
        />
        <button type="button" onClick={add} disabled={disabled || text.trim() === ""}>
          Add
        </button>
      </div>
    </div>
  );
}
