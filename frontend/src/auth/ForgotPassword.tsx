import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

// Step 1 of a password reset: the user enters their email and Supabase sends a link.
export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // The link in the email sends the user to /reset-password. This URL must be
      // listed under Redirect URLs in the Supabase dashboard (Auth > URL Configuration).
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) setError(error.message);
      else setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <h1>Forgot password</h1>
      {sent ? (
        // Same message whether or not the email has an account, so the page
        // cannot be used to find out who is registered.
        <p role="status">
          If an account exists for {email}, a reset link has been sent. Check your inbox.
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {error && <p role="alert">{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? "Please wait…" : "Send reset link"}
          </button>
        </form>
      )}
      <p>
        <Link to="/login">Back to log in</Link>
      </p>
    </main>
  );
}
