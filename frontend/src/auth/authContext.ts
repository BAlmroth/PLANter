import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";

type AuthState = { user:User | null; loading: boolean };
export const AuthContext = createContext<AuthState | null>(null);

// Components call this instead of useContext(AuthContext) directly. useAuth used in components to see logged in user.
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}
