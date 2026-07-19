import { lazy } from "react";
import { Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
const HomePage = lazy(() => import("./pages/HomePage/HomePage"));
const MaterialsPage = lazy(() => import("./pages/MaterialsPage/MaterialsPage"));
const MaterialDetailPage = lazy(
  () => import("./pages/MaterialDetailPage/MaterialDetailPage"),
);
const MaterialUploadPage = lazy(
  () => import("./pages/MaterialUploadPage/MaterialUploadPage"),
);
const AccountMaterialsPage = lazy(
  () => import("./pages/AccountMaterialsPage/AccountMaterialsPage"),
);
const ScriptsPage = lazy(() => import("./pages/ScriptsPage/ScriptsPage"));
const ScriptEditorPage = lazy(
  () => import("./pages/ScriptEditorPage/ScriptEditorPage"),
);
const ScriptExportPage = lazy(
  () => import("./pages/ScriptExportPage/ScriptExportPage"),
);
const FavoritesPage = lazy(() => import("./pages/FavoritesPage/FavoritesPage"));
const UserProfilePage = lazy(
  () => import("./pages/UserProfilePage/UserProfilePage"),
);
const ProfilePage = lazy(() => import("./pages/Profile"));
const LoginPage = lazy(() => import("./pages/Auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/Auth/RegisterPage"));
const NotFound = lazy(() => import("./pages/NotFound/NotFound"));
const NotificationsPage = lazy(
  () => import("./pages/NotificationsPage/NotificationsPage"),
);
const ChatPage = lazy(() => import("./pages/ChatPage/ChatPage"));
const TeamsPage = lazy(() => import("./pages/TeamsPage/TeamsPage"));
const TeamDetailPage = lazy(() => import("./pages/TeamsPage/TeamDetailPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage/ProjectsPage"));
const ProjectDetailPage = lazy(
  () => import("./pages/ProjectsPage/ProjectDetailPage"),
);
const TemplatesPage = lazy(() => import("./pages/TemplatesPage/TemplatesPage"));
const RequirementsPage = lazy(
  () => import("./pages/RequirementsPage/RequirementsPage"),
);
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage/AnalyticsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage/SettingsPage"));
const FileManagerPage = lazy(() => import("./pages/FileManagerPage/FileManagerPage"));

const RoutesComponent = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="materials" element={<MaterialsPage />} />
        <Route path="materials/upload" element={<MaterialUploadPage />} />
        <Route path="materials/:id" element={<MaterialDetailPage />} />
        <Route path="account/materials" element={<AccountMaterialsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="files" element={<FileManagerPage />} />
        <Route path="scripts" element={<ScriptsPage />} />
        <Route path="scripts/:id" element={<ScriptEditorPage />} />
        <Route path="scripts/:id/export" element={<ScriptExportPage />} />
        <Route path="account/favorites" element={<FavoritesPage />} />
        <Route path="user/:userId" element={<UserProfilePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="chat/:conversationId" element={<ChatPage />} />
        <Route path="teams" element={<TeamsPage />} />
        <Route path="teams/:teamId" element={<TeamDetailPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="requirements" element={<RequirementsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default RoutesComponent;
