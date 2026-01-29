import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@spidy092/auth-client';
import Login from './pages/Login';
import Callback from './pages/Callback';
import Dashboard from './pages/Dashboard';
import ProtectedLayout from './components/ProtectedLayout';
import OrganizationOnboarding from './pages/OrganizationOnboarding';
import './App.css';

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/callback" element={<Callback />} />

      {/* Onboarding for org support */}
      <Route path="/onboarding" element={<OrganizationOnboarding />} />

      {/* Protected with header */}
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? (
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Default */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <AppRoutes />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;