// admin-ui/src/App.jsx
import { Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { getTheme } from './theme';
import './config/authConfig';
import ProtectedRoute from './components/ProtectedRoute';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import WorkspaceDetail from './pages/workspaces/WorkspaceDetail';
import AcceptInvitation from './pages/workspaces/AcceptInvitation';

import Clients from './pages/Clients';
import Applications from './pages/Applications';
import Realms from './pages/Realms';
import AuditLogs from './pages/AuditLogs';

import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import ClientRequests from './pages/ClientRequests';
import RealmDetail from './pages/RealmDetail';
import IdentityProvidersList from './pages/identity-providers/IdentityProvidersList';
import IdentityProviderDetail from './pages/identity-providers/IdentityProviderDetail';
import SecurityConfig from './pages/security/SecurityConfig';
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard';
import UsersList from './pages/users/UsersList';
import UserDetail from './pages/users/UserDetail';
import ClientDetail from './pages/clients/ClientDetail';
import RealmRoles from './pages/roles/RealmRoles';

import Organizations from './pages/Organizations';
import OrganizationDetail from './pages/OrganizationDetail';
import DatabaseRoles from './pages/DatabaseRoles';
import Permissions from './pages/Permissions';
import OrganizationMemberships from './pages/OrganizationMemberships';
import AccountManagement from './pages/AccountManagement';
import OnboardMangement from  './components/onboarding/OrganizationOnboarding';
import Login from './pages/Login';

import Callback from './pages/auth/Callback';

import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const { loading } = useAuth();
  const [mode, setMode] = useState('light');
  
  const theme = getTheme(mode);

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };



  if (loading) return <LoadingSpinner />;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/callback" element={<Callback />} />
       
        <Route path="/" element={<ProtectedRoute />}>
          <Route element={<Layout toggleColorMode={toggleColorMode} mode={mode} />}>
            {/* Main Dashboard */}
            <Route index element={<Dashboard />} />
            <Route path="workspaces/:id" element={<WorkspaceDetail />} />
            <Route path="workspace-invite" element={<AcceptInvitation />} />
           
            {/* Keycloak Management */}
            <Route path="realms" element={<Realms />} />
            <Route path="realms/:realmName" element={<RealmDetail />} />
            <Route path="realms/:realmName/identity-providers" element={<IdentityProvidersList />} />
            <Route path="realms/:realmName/identity-providers/:alias" element={<IdentityProviderDetail />} />
            <Route path="realms/:realmName/security" element={<SecurityConfig />} />
            <Route path="realms/:realmName/analytics" element={<AnalyticsDashboard />} />
            <Route path="realms/:realmName/users" element={<UsersList />} />
            <Route path="realms/:realmName/users/:userId" element={<UserDetail />} />
            <Route path="realms/:realmName/clients" element={<Clients />} />
            <Route path="realms/:realmName/clients/:clientId" element={<ClientDetail />} />
            <Route path="realms/:realmName/clients/:clientId" element={<ClientDetail />} />
            <Route path="realms/:realmName/roles" element={<RealmRoles />} />
            <Route path="clients" element={<Clients />} />
            <Route path="applications" element={<Applications />} />
            <Route path="client-requests" element={<ClientRequests />} />
            <Route path="audit-logs" element={<AuditLogs />} />
           
            {/* Database Management */}
            <Route path="organizations" element={<Organizations />} />
            <Route path="organizations/:id" element={<OrganizationDetail />} />
            <Route path="database-roles" element={<DatabaseRoles />} />
            <Route path="permissions" element={<Permissions />} />
            <Route path="memberships" element={<OrganizationMemberships />} />
            <Route path="onboarding" element={<OnboardMangement />} />
            <Route path="/join" element={<OnboardMangement />} />
           
            {/* Account Management */}
            <Route path="account" element={<AccountManagement />} />
           
            {/* 404 Route */}
            <Route path="*" element={
              <div>
                <h2>Page Not Found</h2>
                <p>The page you are looking for does not exist.</p>
              </div>
            } />
          </Route>
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

