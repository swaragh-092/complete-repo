/**
 * @fileoverview Protected Layout Component
 * @description Wrapper for protected routes with org enforcement - MUI version
 * @matches centalized-login pattern
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Container, Toolbar } from '@mui/material';

import { useOrganization } from '../context/OrganizationContext';

import Header from './Header';

export default function ProtectedLayout({ children }) {
  const navigate = useNavigate();
  
  const { currentOrganization, loading } = useOrganization();

  // Enforce organization selection
  useEffect(() => {
    if (!loading && !currentOrganization) {
      console.log('⚠️ No organization selected, redirecting...');
      navigate('/select-organization', { replace: true });
    }
  }, [currentOrganization, loading, navigate]);

  // Show loading while checking org
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <Box component="main" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  // Don't render content until org is selected
  if (!currentOrganization) {
    return null;
  }
  

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
        {/* Toolbar spacer to prevent content from going under fixed header */}
        <Toolbar /> 
        <Container maxWidth="lg" sx={{ py: 3 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
}
