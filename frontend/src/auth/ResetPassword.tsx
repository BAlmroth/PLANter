import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "./authContext";
import { AuthLayout } from "./AuthLayout";
import styles from "./AuthForm.module.css";

// Step 2 of a password reset: the user arrives from the email link.
// Supabase reads the token in the link and logs the user in with a temporary
// "recovery" session, so `user` is set. That session is what lets updateUser work.
export function ResetPassword() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) setError(error.message);
      else navigate("/", { replace: true });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p>Loading…</p>;

  // Opened without a valid link, or the link has expired
  if (!user) {
    return (
      <AuthLayout title="Reset password">
        <p role="alert" className={styles.error}>
          This reset link is invalid or has expired.
        </p>
        <p className={styles.footer}>
          <Link to="/forgot-password">Request a new link</Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset password">
      <form className={styles.form} onSubmit={handleSubmit}>
        <label>
          New password
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <button type="submit" className={styles.submit} disabled={submitting}>
          {submitting ? "Please wait…" : "Set new password"}
        </button>
      </form>
    </AuthLayout>
  );
}
