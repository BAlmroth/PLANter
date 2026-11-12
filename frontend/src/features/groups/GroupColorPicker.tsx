import { useId } from "react";
import { groupColorVar } from "./groupColor";
import styles from "./GroupColorPicker.module.css";

type Props = {
  // The template's groupColors
  colors: string[];
  // The chosen color, or "" for none chosen yet (on create: the backend picks one)
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
};

// The group colors as round swatches. Each swatch is a real radio button (hidden, with a circle
// drawn next to it), so the keyboard (Tab, arrow keys) and screen readers work without extra code.
export function GroupColorPicker({ colors, value, onChange, disabled }: Props) {
  // Radio buttons belong together through their name. useId gives every picker its own name,
  // so the create form and an edit form on the same page do not share one set of radios.
  const name = useId();

  return (
    <fieldset className={styles.picker} disabled={disabled}>
      <legend className={styles.legend}>Color</legend>
      {colors.map((color, index) => (
        <label key={color} className={styles.swatch} title={`Color ${index + 1}`}>
          <input
            type="radio"
            name={name}
            value={color}
            checked={value === color}
            onChange={() => onChange(color)}
            aria-label={`Color ${index + 1}`}
          />
          <span className={styles.circle} style={groupColorVar(color)} />
        </label>
      ))}
    </fieldset>
  );
}
