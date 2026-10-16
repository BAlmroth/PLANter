import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { ProjectsPage } from "./pages/ProjectsPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> */}

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<ProjectsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
