import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './modules/auth/pages/LoginPage';
import OTPPage from './modules/auth/pages/OTPPage';
import ForgotPasswordPage from './modules/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from './modules/auth/pages/ResetPasswordPage';
import ProtectedRoute from './routes/ProtectedRoute';

// Lazy load modules
const DashboardPage = lazy(() => import('./modules/dashboard/pages/DashboardPage'));
const UsersPage = lazy(() => import('./modules/users/pages/UsersPage'));
const ProjectsPage = lazy(() => import('./modules/projects/pages/ProjectsPage'));
const ProjectWorkspacePage = lazy(() => import('./modules/projects/pages/ProjectWorkspacePage'));
const SprintDetailsPage = lazy(() => import('./modules/projects/pages/SprintDetailsPage'));
const StoryDetailsPage = lazy(() => import('./modules/projects/pages/StoryDetailsPage'));
const TasksPage = lazy(() => import('./modules/tasks/pages/TasksPage'));


const FinancePage = lazy(() => import('./modules/finance/pages/FinancePage'));
const HRPage = lazy(() => import('./modules/hr/pages/HRPage'));
const LeavesPage = lazy(() => import('./modules/hr/pages/LeavesPage'));
const AttendancePage = lazy(() => import('./modules/attendance/pages/AttendancePage'));
const ClientsPage = lazy(() => import('./modules/clients/pages/ClientsPage'));
const ResourcesPage = lazy(() => import('./modules/resources/pages/ResourcesPage'));
const SettingsPage = lazy(() => import('./modules/auth/pages/SettingsPage'));
const ProfilePage = lazy(() => import('./modules/auth/pages/ProfilePage'));
const AccessDenied = lazy(() => import('./pages/AccessDenied'));

import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const PageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-slate-50/50 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Loading Module...</p>
    </div>
  </div>
);


function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify-otp" element={<OTPPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          {/* Base Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              {/* Individual Module Guards */}
              <Route element={<ProtectedRoute permission="dashboard" />}>
                <Route path="/dashboard" element={<DashboardPage />} />
              </Route>

              <Route element={<ProtectedRoute permission="users" />}>
                <Route path="/users" element={<UsersPage />} />
              </Route>

              <Route element={<ProtectedRoute permission="projects" />}>
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:projectId" element={<ProjectWorkspacePage />} />
                <Route path="/projects/:projectId/sprints/:sprintId" element={<SprintDetailsPage />} />
                <Route path="/projects/:projectId/sprints/:sprintId/stories/:storyId" element={<StoryDetailsPage />} />
                <Route path="/projects/:projectId/stories/:storyId" element={<StoryDetailsPage />} />
              </Route>



              <Route element={<ProtectedRoute permission="tasks" />}>
                <Route path="/tasks" element={<TasksPage />} />
              </Route>

              <Route element={<ProtectedRoute permission="finance" />}>
                <Route path="/finance" element={<FinancePage />} />
              </Route>

              <Route element={<ProtectedRoute permission="hr" />}>
                <Route path="/hr" element={<HRPage />} />
              </Route>

              <Route element={<ProtectedRoute permission="attendance" />}>
                <Route path="/attendance" element={<AttendancePage />} />
              </Route>

              <Route element={<ProtectedRoute permission="clients" />}>
                <Route path="/clients" element={<ClientsPage />} />
              </Route>

              <Route element={<ProtectedRoute permission="resources" />}>
                <Route path="/resources" element={<ResourcesPage />} />
              </Route>

              {/* Universal Routes */}
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/leaves" element={<LeavesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/access-denied" element={<AccessDenied />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/leaves" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
