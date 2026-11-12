import styles from "./ViewToggle.module.css";

type Props<T extends string> = {
  label: string; // for screen readers, for example "Plan view"
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
};

// A switch between the views of a page, shown in the sub header. The page keeps the chosen view
// (in the URL), this component only shows the buttons. <T extends string>: the values are a fixed
// set of strings, like "list" | "map", so TypeScript checks that onChange only gets one of them.
export function ViewToggle<T extends string>({ label, options, value, onChange }: Props<T>) {
  return (
    <div className={styles.toggle} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={option.value === value ? `${styles.option} ${styles.active}` : styles.option}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
