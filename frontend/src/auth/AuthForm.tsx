import { useState, type FormEvent, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { FormField } from "../components/FormField";
import { useAuth } from "./authContext";

type Props = {
  title: string;
  submitLabel: string;
  passwordAutoComplete: "current-password" | "new-password";
  // Does the actual Supabase call. Returns an error message, or null on success.
  onSubmit: (email: string, password: string) => Promise<string | null>;
  footer: ReactNode;
};

// Shared email + password form used by both Login and Register
export function AuthForm({
  title,
  submitLabel,
  passwordAutoComplete,
  onSubmit,
  footer,
}: Props) {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Once Supabase has logged the user in, AuthProvider updates `user`
  // and this redirect happens by itself.
  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); // stop the browser from reloading the page
    setError(null);
    const nextEmailError = email.trim() === "" ? "Email is required." : null;
    const nextPasswordError =
      password === "" ? "Password is required." : password.length < 6 ? "Password must be at least 6 characters." : null;
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) return;
    setSubmitting(true);
    try {
      setError(await onSubmit(email, password));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <h1>{title}</h1>
      <form onSubmit={handleSubmit} noValidate>
        <FormField label="Email" required error={emailError}>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormField>
        <FormField label="Password" required error={passwordError}>
          <input
            type="password"
            autoComplete={passwordAutoComplete}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormField>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Please wait…" : submitLabel}
        </button>
      </form>
      <p>{footer}</p>
    </main>
  );
}
