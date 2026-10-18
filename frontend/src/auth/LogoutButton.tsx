import { supabase } from "../lib/supabaseClient";

export function LogoutButton() {
  // After signOut, AuthProvider sets user to null and ProtectedRoute redirects to login
  return (
    <button type="button" onClick={() => supabase.auth.signOut()}>
      Log out
    </button>
  );
}
