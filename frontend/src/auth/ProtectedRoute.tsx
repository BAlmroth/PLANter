import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./authContext";
import { Loader } from "../components/Loader";

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <Loader label="Loading…" size="page" />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}