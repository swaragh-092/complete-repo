/**
 * @fileoverview Main App Component
 * @description Application entry with routing, MUI theme, and session security
 */
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@spidy092/auth-client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import Login from './pages/Login';
import Callback from './pages/Callback';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout.jsx';

import { OrganizationProvider } from './context/OrganizationContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import SelectOrganization from './pages/SelectOrganization';
import CreateOrganization from './pages/CreateOrganization';
import InviteMembers from './pages/InviteMembers';
import Settings from './pages/Settings';
import { ColorModeContext, useMode } from './theme';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});



function AppRoutes() {
  const { isAuthenticated, loading, sessionValid } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!sessionValid && isAuthenticated) {
    return <Navigate to="/login?expired=true" replace />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/callback" element={<Callback />} />

      
      {/* Organization Routes (no sidebar) */}
      <Route path="/select-organization" element={isAuthenticated ? <SelectOrganization /> : <Navigate to="/login" replace />} />
      <Route path="/create-organization" element={isAuthenticated ? <CreateOrganization /> : <Navigate to="/login" replace />} />
      

      {/* Protected Routes with Layout */}
      <Route element={isAuthenticated ? <Layout  /> : <Navigate to="/login" replace />}>
        <Route path="/dashboard" element={<Dashboard />} />
        
        <Route path="/settings" element={<Settings />} />
        <Route path="/invite-members" element={<InviteMembers />} />
        
      </Route>

      {/* Default Routes */}
      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function SessionHandler({ children }) {
  const navigate = useNavigate();

  const handleSessionExpired = (reason) => {
    console.log('🚨 Session expired:', reason);
    navigate('/login?expired=true&reason=' + encodeURIComponent(reason), { replace: true });
  };

  return <AuthProvider onSessionExpired={handleSessionExpired}>{children}</AuthProvider>;
}

function App() {
  const [theme, colorMode] = useMode();

  return (
    <QueryClientProvider client={queryClient}>
      <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider 
          maxSnack={3} 
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          autoHideDuration={4000}
        >
          <BrowserRouter>
            <SessionHandler>
              
              <OrganizationProvider>
                <WorkspaceProvider>
                  <AppRoutes />
                </WorkspaceProvider>
              </OrganizationProvider>
              
            </SessionHandler>
          </BrowserRouter>
        </SnackbarProvider>

      </ThemeProvider>
      </ColorModeContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
