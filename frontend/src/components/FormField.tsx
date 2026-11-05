import type { ReactNode } from "react";
import styles from "./FormField.module.css";

// The small red text under a field that says what is wrong.
// Also used on its own for fields that have no visible label.
export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className={styles.error}>
      {message}
    </p>
  );
}

type Props = {
  label: string;
  // Shows a * after the label while there is no error
  required?: boolean;
  error?: string | null;
  children: ReactNode;
};

// A label wrapped around an input, with a * when the field is required
// and the error text below it when something is wrong.
export function FormField({ label, required = false, error, children }: Props) {
  return (
    <>
      <label>
        {label}
        {required && !error && (
          <span className={styles.star} aria-hidden="true">
            {" "}
            *
          </span>
        )}
        {children}
      </label>
      <FieldError message={error} />
    </>
  );
}
