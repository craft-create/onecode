import React from "react";
import { Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import HomePage from "./pages/HomePage/HomePage";
import MaterialsPage from "./pages/MaterialsPage/MaterialsPage";
import MaterialDetailPage from "./pages/MaterialDetailPage/MaterialDetailPage";
import MaterialUploadPage from "./pages/MaterialUploadPage/MaterialUploadPage";
import AccountMaterialsPage from "./pages/AccountMaterialsPage/AccountMaterialsPage";
import ScriptsPage from "./pages/ScriptsPage/ScriptsPage";
import ScriptEditorPage from "./pages/ScriptEditorPage/ScriptEditorPage";
import ScriptExportPage from "./pages/ScriptExportPage/ScriptExportPage";
import FavoritesPage from "./pages/FavoritesPage/FavoritesPage";
import UserProfilePage from "./pages/UserProfilePage/UserProfilePage";
import ProfilePage from "./pages/Profile";
import { LoginPage, RegisterPage } from "./pages/Auth";
import NotFound from "./pages/NotFound/NotFound";
import NotificationsPage from "./pages/NotificationsPage/NotificationsPage";
import ChatPage from "./pages/ChatPage/ChatPage";
import TeamsPage from "./pages/TeamsPage/TeamsPage";
import TeamDetailPage from "./pages/TeamsPage/TeamDetailPage";
import ProjectsPage from "./pages/ProjectsPage/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectsPage/ProjectDetailPage";
import TemplatesPage from "./pages/TemplatesPage/TemplatesPage";
import RequirementsPage from "./pages/RequirementsPage/RequirementsPage";
import AnalyticsPage from "./pages/AnalyticsPage/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage/SettingsPage";
import FileManagerPage from "./pages/FileManagerPage/FileManagerPage";

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
