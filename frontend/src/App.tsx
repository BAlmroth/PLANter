import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { ProjectsPage } from "./pages/ProjectsPage";
import { NewProjectPage } from "./pages/NewProjectPage";
import { ProjectPage } from "./pages/ProjectPage";
import { ItemPage } from "./pages/ItemPage";
import { DescriptionPage, InspirationPage, PlanPage } from "./pages/ProjectViews";
import { TasksPage } from "./pages/TasksPage";
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
            <Route path="moodboard" element={<InspirationPage />} />
            <Route path="plan" element={<PlanPage />} />
            {/* Old addresses (bookmarks, links) now open the combined page */}
            <Route path="files" element={<Navigate to="../plan?view=list" replace />} />
            <Route path="map" element={<Navigate to="../plan?view=map" replace />} />
            <Route path="tasks" element={<TasksPage />} />
            {/* Progress is now on the Tasks & progress page */}
            <Route path="progress" element={<Navigate to="../tasks" replace />} />
            <Route path="items/:itemId" element={<ItemPage />} />
          </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
