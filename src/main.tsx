import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorBoundary, Loading, Empty } from './components/Shared';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import AppLayout from './layouts/AppLayout';
import { resources } from './features/resources';
import './styles.css';
import './site-theme.css';
import './smart-assistance.css';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ResourcePage = lazy(() => import('./pages/ResourcePage'));
const AssignmentDetail = lazy(() => import('./pages/AssignmentDetail'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Timetable = lazy(() => import('./pages/Timetable'));
const Profile = lazy(() => import('./pages/Profile'));
const Notifications = lazy(() => import('./pages/Notifications'));
const CampusAI = lazy(() => import('./pages/CampusAI'));
const Files = lazy(() => import('./pages/Files'));
function ResourceRoute({ name }: { name: string }) {
  const { profile } = useAuth();
  const adminOnly = [
    'departments',
    'courses',
    'semesters',
    'classrooms',
    'settings',
    'documents',
    'audit',
  ];
  if (
    (adminOnly.includes(name) && profile?.role !== 'admin') ||
    (['people', 'grading'].includes(name) && profile?.role === 'student')
  )
    return (
      <Empty
        title="Administrator access required"
        text="This area is managed by your college team."
      />
    );
  return <ResourcePage key={name} name={name} />;
}
function FileRoute() {
  const { profile } = useAuth();
  return profile?.role === 'admin' ? <Files /> : <Navigate to="/app" replace />;
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth/:mode" element={<Auth />} />
              <Route path="/auth/login/:loginRole" element={<Auth />} />
              <Route path="/app" element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="timetable" element={<Timetable />} />
                <Route path="profile" element={<Profile />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="ai" element={<CampusAI />} />
                <Route path="files" element={<FileRoute />} />
                <Route path="assignments/:id" element={<AssignmentDetail />} />
                {Object.keys(resources)
                  .filter((k) => k !== 'timetable')
                  .map((name) => (
                    <Route key={name} path={name} element={<ResourceRoute name={name} />} />
                  ))}
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
