import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { AuthForm } from "./AuthForm";

export function Register() {
  const [checkEmail, setCheckEmail] = useState(false);

  // If email confirmation is turned on in Supabase, signUp creates the account
  // but returns no session until the user clicks the link in their email.
  if (checkEmail) {
    return (
      <main>
        <h1>Check your email</h1>
        <p>We sent a confirmation link. Click it, then log in.</p>
        <Link to="/login">Go to log in</Link>
      </main>
    );
  }

  return (
    <AuthForm
      title="Register"
      submitLabel="Create account"
      passwordAutoComplete="new-password"
      onSubmit={async (email, password) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) return error.message;
        if (!data.session) setCheckEmail(true);
        return null;
      }}
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    />
  );
}
