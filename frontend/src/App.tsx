import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { ProjectsPage } from "./pages/ProjectsPage";
import { Login } from "./auth/Login";
import { Register } from "./auth/Register";
import { MapPrototypePage } from "./pages/MapPrototypePage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Temporary: React Flow prototype with mock data, remove after the sprint 1 decision */}
        <Route path="/map-prototype" element={<MapPrototypePage />} />

        {/* requires login  */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<ProjectsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
