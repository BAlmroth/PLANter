import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { AuthForm } from "./AuthForm";

export function Login() {
  return (
    <AuthForm
      title="Log in"
      submitLabel="Log in"
      passwordAutoComplete="current-password"
      onSubmit={async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return error?.message ?? null;
      }}
      footer={
        <>
          No account? <Link to="/register">Register</Link>
        </>
      }
    />
  );
}
