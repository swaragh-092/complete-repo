/**
 * @fileoverview Login Page
 * @description Modern login page with MUI components
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '@spidy092/auth-client';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
  useTheme,
} from '@mui/material';
import { Login as LoginIcon, Warning as WarningIcon } from '@mui/icons-material';
import '../config/authConfig';

export default function Login() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const sessionExpired = searchParams.get('expired') === 'true';
  const expiredReason = searchParams.get('reason');

  useEffect(() => {
    if (sessionExpired) {
      auth.clearToken();
      auth.clearRefreshToken();
      return;
    }

    const token = auth.getToken();
    if (token && !auth.isTokenExpired(token)) {
      navigate('/');
      return;
    }

    setLoading(true);
    auth.login();
  }, [navigate, sessionExpired]);

  const handleLogin = () => {
    setLoading(true);
    auth.login();
  };

  const getReasonMessage = () => {
    switch (expiredReason) {
      case 'session_deleted': return 'Your session was terminated by an administrator.';
      case 'idle_timeout': return 'You were logged out due to inactivity.';
      case 'logout_from_other_tab': return 'You were logged out from another tab.';
      default: return 'Your session has expired. Please sign in again.';
    }
  };

  if (sessionExpired) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          p: 2,
        }}
      >
        <Card
          elevation={0}
          sx={{
            maxWidth: 420,
            width: '100%',
            borderRadius: 3,
            textAlign: 'center',
            p: { xs: 2, sm: 3 },
          }}
        >
          <CardContent>
            {/* Logo/Icon */}
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                bgcolor: 'warning.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <WarningIcon sx={{ fontSize: 40, color: 'warning.dark' }} />
            </Box>

            <Typography variant="h5" fontWeight={700} gutterBottom>
              Session Expired
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {getReasonMessage()}
            </Typography>

            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<LoginIcon />}
              onClick={handleLogin}
              disabled={loading}
              sx={{
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In Again'}
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
      }}
    >
      <Card
        elevation={0}
        sx={{
          maxWidth: 420,
          width: '100%',
          borderRadius: 3,
          textAlign: 'center',
          p: { xs: 2, sm: 3 },
        }}
      >
        <CardContent>
          {/* Logo */}
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <LoginIcon sx={{ fontSize: 36, color: 'white' }} />
          </Box>

          <Typography variant="h5" fontWeight={700} gutterBottom>
            token-test
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Redirecting to secure login...
          </Typography>

          <CircularProgress sx={{ color: 'primary.main' }} />
        </CardContent>
      </Card>
    </Box>
  );
}
