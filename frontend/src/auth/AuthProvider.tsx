import { useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { AuthContext } from "./authContext";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

 useEffect(() => {
    //fires as startup with stored session, then on each login/logut/refresh
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
    });
    //stop listening when provider unmounts
    return () => data.subscription.unsubscribe();
 }, []);

 return <AuthContext value={{ user, loading }}>{children}</AuthContext>;

}