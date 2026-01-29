import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { auth } from '@spidy092/auth-client';
import { Box, Toolbar, CircularProgress, useTheme } from '@mui/material';

import Sidebar from './layout/Sidebar';
import Header from './layout/Header';
import { useUser } from '../hooks/useUser';

const drawerWidth = 280;

export default function Layout({ toggleColorMode, mode }) {
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [error, setError] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleAuthError = () => {
    auth.clearToken();
    navigate('/login');
  };

  const handleLogout = () => {
    auth.logout();
    handleAuthError();
  };

  const { data: user, isLoading } = useUser({
    onError: (err) => {
      // 401 is handled by the hook
      if (err.response?.status !== 401) {
        setError(`Failed to load user data: ${err.message}`);
      }
    }
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Header 
        handleDrawerToggle={handleDrawerToggle}
        toggleColorMode={toggleColorMode}
        mode={mode}
        user={user}
        handleLogout={handleLogout}
      />
      
      <Sidebar 
        mobileOpen={mobileOpen} 
        handleDrawerToggle={handleDrawerToggle}
        error={error}
        onCloseError={() => setError(null)}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          backgroundColor: theme.palette.background.default,
          minHeight: '100vh',
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
          overflow: 'auto'
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
