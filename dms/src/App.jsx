import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './auth/LoginPage';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { MyApprovalsPage } from './pages/MyApprovalsPage';
import { AdminDocumentTypesPage } from './pages/AdminDocumentTypesPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminWorkflowsPage } from './pages/AdminWorkflowsPage';
import { AdminHierarchiesPage } from './pages/AdminHierarchiesPage';
import { AdminDocumentSetsPage } from './pages/AdminDocumentSetsPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/approvals" element={<MyApprovalsPage />} />

          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin/document-types" element={<AdminDocumentTypesPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/workflows" element={<AdminWorkflowsPage />} />
            <Route path="/admin/hierarchies" element={<AdminHierarchiesPage />} />
            <Route path="/admin/document-sets" element={<AdminDocumentSetsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/projects" replace />} />
      <Route path="*" element={<Navigate to="/projects" replace />} />
    </Routes>
  );
}

export default App;
