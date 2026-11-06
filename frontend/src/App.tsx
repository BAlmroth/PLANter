import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { ProjectsPage } from "./pages/ProjectsPage";
import { NewProjectPage } from "./pages/NewProjectPage";
import { ProjectPage } from "./pages/ProjectPage";
import { ItemPage } from "./pages/ItemPage";
import { DescriptionPage, FilesPage, InspirationPage, MapPage, ProgressPage, TasksPage } from "./pages/ProjectViews";
import { ProjectOverview } from "./features/projects/ProjectOverview";
import { Login } from "./auth/Login";
import { Register } from "./auth/Register";
import { ForgotPassword } from "./auth/ForgotPassword";
import { ResetPassword } from "./auth/ResetPassword";
import { AppLayout } from "./components/AppLayout";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* requires login  */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
          <Route path="/" element={<ProjectsPage />} />
          <Route path="/projects/new" element={<NewProjectPage />} />
          {/* ProjectPage is the frame (sub header and File view). The nested route fills its Outlet. */}
          <Route path="/projects/:projectId" element={<ProjectPage />}>
            <Route index element={<ProjectOverview />} />
            <Route path="description" element={<DescriptionPage />} />
            <Route path="inspiration" element={<InspirationPage />} />
            <Route path="files" element={<FilesPage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="items/:itemId" element={<ItemPage />} />
          </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
