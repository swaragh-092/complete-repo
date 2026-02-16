import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, Button, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth } from '@spidy092/auth-client';
import LoadingSpinner from '../components/LoadingSpinner';

// Get callback URL from env or derive from current origin
const CALLBACK_URL = import.meta.env.VITE_CALLBACK_URL || `${window.location.origin}/callback`;

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const hasNavigated = useRef(false); // Prevent multiple navigate calls
  
  // Check if redirected due to session expiration
  const searchParams = new URLSearchParams(window.location.search);
  const sessionExpired = searchParams.get('expired') === 'true';
  const expiredReason = searchParams.get('reason');

  useEffect(() => {
    // Prevent double-navigation (fixes infinite loop)
    if (hasNavigated.current) return;

    // If session expired, clear any stale tokens first
    if (sessionExpired) {
      auth.clearToken();
      auth.clearRefreshToken();
      // Don't auto-redirect, let user see the message
      return;
    }

    const token = auth.getToken();
    if (token && !auth.isTokenExpired(token)) {
      hasNavigated.current = true;
      navigate('/', { replace: true });
      return;
    }
  }, [navigate, sessionExpired]);


  // Show session expired message
  if (sessionExpired) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh',
        padding: '20px',
        backgroundColor: '#f5f5f5'
      }}>
        {/* Session Expired Alert */}
        <div style={{
          backgroundColor: '#FEF3C7',
          border: '1px solid #F59E0B',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>⚠️</span>
          <h2 style={{ color: '#92400E', margin: '0 0 8px' }}>Session Expired</h2>
          <p style={{ color: '#B45309', margin: 0 }}>
            {expiredReason === 'session_deleted' 
              ? 'Your session was terminated by an administrator.'
              : 'Your session has expired due to inactivity.'}
          </p>
        </div>
        
        {/* Login Button */}
        <Button
          variant="contained"
          onClick={() => {
            setLoading(true);
            auth.login('admin-ui', CALLBACK_URL);
          }}
          sx={{
            px: 4,
            py: 1.5,
            fontWeight: 600
          }}
        >
          Sign In Again
        </Button>
      </div>
    );
  }

  if (loading) return <LoadingSpinner message="Redirecting to login..." />;

  // ✅ Auto-redirect to Keycloak if not expired
  // This ensures "Centralized Login" is the only login page user sees
  useEffect(() => {
    if (!sessionExpired) {
      setLoading(true);
      auth.login('admin-ui', CALLBACK_URL);
    }
  }, [sessionExpired]);

  // Default View (should rarely be seen due to auto-redirect)
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <LoadingSpinner message="Redirecting to centralized login..." />
    </div>
  );
}

export default Login;