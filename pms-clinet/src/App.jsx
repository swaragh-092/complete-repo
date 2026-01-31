/**
 * @fileoverview Main App Component
 * @description Application entry with routing, MUI theme, and session security
 */

import { useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@spidy092/auth-client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import Login from './pages/Login';
import Callback from './pages/Callback';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';

import { OrganizationProvider } from './context/OrganizationContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import SelectOrganization from './pages/SelectOrganization';
import CreateOrganization from './pages/CreateOrganization';
import InviteMembers from './pages/InviteMembers';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

// Theme configuration  
const getTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: { main: '{{THEME_PRIMARY}}' },
    secondary: { main: '{{THEME_SECONDARY}}' },
    background: {
      default: mode === 'dark' ? '#121212' : '#f5f5f5',
      paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderRight: 'none' },
      },
    },
  },
});

function AppRoutes({ toggleColorMode, mode }) {
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
      <Route element={isAuthenticated ? <Layout toggleColorMode={toggleColorMode} mode={mode} /> : <Navigate to="/login" replace />}>
        <Route path="/dashboard" element={<Dashboard />} />
        
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
  const [mode, setMode] = useState(() => localStorage.getItem('themeMode') || 'light');
  const theme = useMemo(() => getTheme(mode), [mode]);

  const toggleColorMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  return (
    <QueryClientProvider client={queryClient}>
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
                  <AppRoutes toggleColorMode={toggleColorMode} mode={mode} />
                </WorkspaceProvider>
              </OrganizationProvider>
              
            </SessionHandler>
          </BrowserRouter>
        </SnackbarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
