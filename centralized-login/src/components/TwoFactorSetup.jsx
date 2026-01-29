
// components/TwoFactorAuth.jsx - Corrected Implementation

import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Alert, List, ListItem, ListItemText,
  ListItemIcon, CircularProgress, Stepper, Step, StepLabel
} from '@mui/material';
import {
  Security as SecurityIcon, Launch as LaunchIcon,
  CheckCircle as CheckCircleIcon, Info as InfoIcon
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { securityApi } from '../api/security.api';

const steps = ['Setup Instructions', 'Configure in Keycloak', 'Verification Complete'];

function TwoFactorAuth({ open, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  // Get current 2FA status
  const { data: twoFAStatus } = useQuery({
    queryKey: ['2fa-status'],
    queryFn: securityApi.getStatus,
    enabled: open
  });

  // Setup redirect mutation
  const setupMutation = useMutation({
    mutationKey: ['2fa', 'setup-redirect'],
    mutationFn: securityApi.start2FASetup,
    onSuccess: (response) => {
      // Open Keycloak Account Console in new tab
      const newTab = window.open(response.redirectUrl, '_blank');
      if (newTab) {
        setActiveStep(1);
        // Start polling to check if setup is complete
        startStatusPolling();
      } else {
        alert('Please allow pop-ups and try again');
      }
    },
    onError: (error) => {
      console.error('2FA setup failed:', error);
    }
  });

  // Disable 2FA mutation
  const disableMutation = useMutation({
    mutationKey: ['2fa', 'disable'],
    mutationFn: securityApi.disable2FA,
    onSuccess: () => {
      queryClient.invalidateQueries(['2fa-status']);
      queryClient.invalidateQueries(['security-settings']);
      onClose();
      if (onSuccess) onSuccess();
    }
  });

  // Check if setup is complete
  const checkSetupMutation = useMutation({
    mutationKey: ['2fa', 'check'],
    mutationFn: securityApi.check2FAConfigured,
    onSuccess: (response) => {
      if (response.configured) {
        setActiveStep(2);
        setTimeout(() => {
          queryClient.invalidateQueries(['2fa-status']);
          queryClient.invalidateQueries(['security-settings']);
          if (onSuccess) onSuccess();
          onClose();
        }, 2000);
      }
    }
  });

  // Poll for completion
  const startStatusPolling = () => {
    setIsChecking(true);
    const pollInterval = setInterval(async () => {
      try {
        const response = await securityApi.check2FAConfigured();
        if (response.configured) {
          clearInterval(pollInterval);
          setIsChecking(false);
          setActiveStep(2);
          setTimeout(() => {
            queryClient.invalidateQueries(['2fa-status']);
            queryClient.invalidateQueries(['security-settings']);
            if (onSuccess) onSuccess();
            onClose();
          }, 2000);
        }
      } catch (error) {
        console.error('Status check failed:', error);
      }
    }, 3000); // Check every 3 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      setIsChecking(false);
    }, 300000);
  };

  const handleStartSetup = () => {
    setupMutation.mutate();
  };

  const handleManualCheck = () => {
    checkSetupMutation.mutate();
  };

  const renderSetupInstructions = () => (
    <Box py={2}>
      <Box textAlign="center" mb={3}>
        <SecurityIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Enable Two-Factor Authentication
        </Typography>
        <Typography variant="body2" color="text.secondary">
          We'll redirect you to Keycloak to set up 2FA with Google Authenticator
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        You'll need Google Authenticator or a similar TOTP app installed on your mobile device.
      </Alert>

      <Typography variant="subtitle2" gutterBottom>
        Setup Process:
      </Typography>
      <List dense>
        <ListItem>
          <ListItemIcon><InfoIcon /></ListItemIcon>
          <ListItemText primary="Click 'Start Setup' to open Keycloak Account Console" />
        </ListItem>
        <ListItem>
          <ListItemIcon><InfoIcon /></ListItemIcon>
          <ListItemText primary="Navigate to 'Signing in' section" />
        </ListItem>
        <ListItem>
          <ListItemIcon><InfoIcon /></ListItemIcon>
          <ListItemText primary="Click 'Set up Authenticator application'" />
        </ListItem>
        <ListItem>
          <ListItemIcon><InfoIcon /></ListItemIcon>
          <ListItemText primary="Scan QR code with your authenticator app" />
        </ListItem>
        <ListItem>
          <ListItemIcon><InfoIcon /></ListItemIcon>
          <ListItemText primary="Enter the 6-digit verification code" />
        </ListItem>
      </List>

      <Box textAlign="center" mt={3}>
        <Button
          variant="contained"
          onClick={handleStartSetup}
          disabled={setupMutation.isLoading}
          startIcon={<LaunchIcon />}
        >
          {setupMutation.isLoading ? 'Opening...' : 'Start Setup'}
        </Button>
      </Box>
    </Box>
  );

  const renderWaitingStep = () => (
    <Box py={2} textAlign="center">
      <Typography variant="h6" gutterBottom>
        Complete Setup in Keycloak
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        Please complete the 2FA setup in the Keycloak tab that opened.
        We'll automatically detect when you're done.
      </Typography>

      {isChecking && (
        <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography variant="body2">
            Checking for completion...
          </Typography>
        </Box>
      )}

      <Alert severity="warning" sx={{ mb: 2 }}>
        Don't close this dialog until setup is complete.
      </Alert>

      <Button
        variant="outlined"
        onClick={handleManualCheck}
        disabled={checkSetupMutation.isLoading}
      >
        {checkSetupMutation.isLoading ? 'Checking...' : 'Check if Complete'}
      </Button>
    </Box>
  );

  const renderCompleteStep = () => (
    <Box py={2} textAlign="center">
      <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
      <Typography variant="h6" gutterBottom color="success.main">
        2FA Successfully Enabled!
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Your account is now protected with two-factor authentication.
      </Typography>
    </Box>
  );

  const renderDisableStep = () => (
    <Box py={2} textAlign="center">
      <SecurityIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Disable Two-Factor Authentication
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        This will remove 2FA protection from your account.
      </Typography>

      <Alert severity="warning" sx={{ mb: 2 }}>
        Your account will be less secure without 2FA.
      </Alert>

      <Box display="flex" gap={2} justifyContent="center">
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => disableMutation.mutate()}
          disabled={disableMutation.isLoading}
        >
          {disableMutation.isLoading ? 'Disabling...' : 'Disable 2FA'}
        </Button>
      </Box>
    </Box>
  );

  const isDisabling = twoFAStatus?.enabled && activeStep === 0;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{ sx: { minHeight: 400 } }}
    >
      <DialogTitle>
        {isDisabling ? 'Disable 2FA' : 'Two-Factor Authentication'}
      </DialogTitle>

      <DialogContent>
        {!isDisabling && (
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}

        {isDisabling ? renderDisableStep() :
         activeStep === 0 ? renderSetupInstructions() :
         activeStep === 1 ? renderWaitingStep() :
         renderCompleteStep()}
      </DialogContent>

      {!isDisabling && activeStep === 1 && (
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

export default TwoFactorAuth;
