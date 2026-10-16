import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./authContext";

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading…</p>;
  if (!user) return <Navigate to="/willbelogin" replace />;

  return <Outlet />;
}