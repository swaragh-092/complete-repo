import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Suspense, lazy } from 'react';
import ErrorBoundary from './components/system/ErrorBoundary';
import { ToastProvider } from './context/ToastContext';
import { ThemeModeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { queryClient } from './config/reactQueryConfig';
import './config/authConfig';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import SessionDebug from './components/SessionDebug'; // ⚠️ Debug panel - remove for production

const Login = lazy(() => import('./pages/Login'));
const Callback = lazy(() => import('./pages/Callback'));
const AppLayout = lazy(() => import('./layouts/AppLayout'));
const IdentityDashboard = lazy(() => import('./pages/IdentityDashboard'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SecurityCenter = lazy(() => import('./pages/SecuritySettings'));
const SessionsPage = lazy(() => import('./pages/Sessions'));
const TrustedDevicesPage = lazy(() => import('./pages/TrustedDevices'));
const ActivityDashboard = lazy(() => import('./pages/ActivityDashboard'));
const NotificationsPage = lazy(() => import('./pages/Notifications'));
const PreferencesPage = lazy(() => import('./pages/Preferences'));
const PrivacyPage = lazy(() => import('./pages/PrivacySettings'));
const ApplicationsPage = lazy(() => import('./pages/Applications'));

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeModeProvider>
        <ToastProvider>
          <AuthProvider>
            <ErrorBoundary>
              <BrowserRouter>
                <Suspense fallback={<LoadingSpinner message="Preparing console…" />}> 
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/callback" element={<Callback />} />
                    <Route
                      path="/"
                      element={(
                        <ProtectedRoute>
                          <AppLayout />
                        </ProtectedRoute>
                      )}
                    >
                      <Route index element={<Navigate to="/dashboard" replace />} />
                      <Route path="dashboard" element={<IdentityDashboard />} />
                      <Route path="profile" element={<ProfilePage />} />
                      <Route path="security" element={<SecurityCenter />} />
                      <Route path="sessions" element={<SessionsPage />} />
                      <Route path="trusted-devices" element={<TrustedDevicesPage />} />
                      <Route path="activity" element={<ActivityDashboard />} />
                      <Route path="applications" element={<ApplicationsPage />} />
                      <Route path="notifications" element={<NotificationsPage />} />
                      <Route path="privacy" element={<PrivacyPage />} />
                      <Route path="preferences" element={<PreferencesPage />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </ErrorBoundary>
              <SessionDebug /> {/* ⚠️ Debug panel - remove for production */}
          </AuthProvider>
        </ToastProvider>
      </ThemeModeProvider>
    </QueryClientProvider>
  );
}
