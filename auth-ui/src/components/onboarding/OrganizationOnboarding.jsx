// components/onboarding/OrganizationOnboarding.jsx
// Main onboarding component that handles organization creation and joining

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider
} from '@mui/material';
import {
  Business as BusinessIcon,
  GroupAdd as GroupAddIcon,
  CheckCircle as CheckCircleIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useMutation, useQuery } from '@tanstack/react-query';
import api, { extractData } from '../../services/api';

const OnboardingSteps = {
  CHECK_STATUS: 0,
  CHOOSE_ACTION: 1,
  CREATE_ORG: 2,
  JOIN_ORG: 3,
  COMPLETE: 4
};

export default function OrganizationOnboarding() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [activeStep, setActiveStep] = useState(OnboardingSteps.CHECK_STATUS);
  const [selectedAction, setSelectedAction] = useState(null);
  const [error, setError] = useState(null);
  
  // Form data
  const [orgName, setOrgName] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  
  // URL parameters
  const clientKey = searchParams.get('client_key');
  const accessToken = searchParams.get('access_token');
  const state = searchParams.get('state');
  const joinCode = searchParams.get('code'); // For direct invitation links

  // Set invitation code from URL if present
  useEffect(() => {
    if (joinCode) {
      setInvitationCode(joinCode);
      setSelectedAction('join');
      setActiveStep(OnboardingSteps.JOIN_ORG);
    }
  }, [joinCode]);

  // Check onboarding status
  const { data: onboardingStatus, isLoading: statusLoading, error: statusError } = useQuery({
    queryKey: ['onboarding-status', clientKey],
    queryFn: () => api.get(`/auth/onboarding-status?client_key=${clientKey}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    }).then(extractData),
    enabled: !!clientKey && !!accessToken,
    onSuccess: (data) => {
      if (data.pending_invitation) {
        setActiveStep(OnboardingSteps.CHOOSE_ACTION);
      } else if (data.tenant_status.needs_tenant) {
        setActiveStep(OnboardingSteps.CHOOSE_ACTION);
      } else {
        // User is already set up
        redirectToApp(data.tenant_status.current_tenant_id);
      }
    }
  });

  // Create organization mutation
  const createOrgMutation = useMutation({
    mutationFn: (data) => api.post('/org-onboarding/create', data, {
      headers: { Authorization: `Bearer ${accessToken}` }
    }),
    onSuccess: (data) => {
      setActiveStep(OnboardingSteps.COMPLETE);
      // Redirect after showing success message
      setTimeout(() => {
        redirectToApp(data.data.organization.tenant_id);
      }, 2000);
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to create organization');
    }
  });

  // Join organization mutation
  const joinOrgMutation = useMutation({
    mutationFn: (data) => api.post('/org-onboarding/join', data, {
      headers: { Authorization: `Bearer ${accessToken}` }
    }),
    onSuccess: (data) => {
      setActiveStep(OnboardingSteps.COMPLETE);
      // Redirect after showing success message
      setTimeout(() => {
        redirectToApp(data.data.organization.tenant_id);
      }, 2000);
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to join organization');
    }
  });

  // Accept pending invitation mutation
  const acceptPendingMutation = useMutation({
    mutationFn: () => api.post('/org-onboarding/accept-pending', {}, {
      headers: { Authorization: `Bearer ${accessToken}` }
    }),
    onSuccess: (data) => {
      setActiveStep(OnboardingSteps.COMPLETE);
      setTimeout(() => {
        redirectToApp(data.data.organization.tenant_id);
      }, 2000);
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to accept invitation');
    }
  });

  const redirectToApp = (tenantId = null) => {
    if (tenantId && onboardingStatus?.client?.requires_tenant) {
      const tenantDomain = `${tenantId}.${window.location.hostname}`;
      const protocol = window.location.protocol;
      const port = window.location.port ? `:${window.location.port}` : '';
      window.location.href = `${protocol}//${tenantDomain}${port}/callback?access_token=${accessToken}&state=${state || ''}`;
    } else {
      navigate(`/callback?access_token=${accessToken}&state=${state || ''}`);
    }
  };

  const handleCreateOrg = () => {
    if (!orgName.trim()) {
      setError('Organization name is required');
      return;
    }

    createOrgMutation.mutate({
      name: orgName.trim(),
      client_key: clientKey
    });
  };

  const handleJoinOrg = () => {
    if (!invitationCode.trim()) {
      setError('Invitation code is required');
      return;
    }

    joinOrgMutation.mutate({
      invitation_code: invitationCode.trim()
    });
  };

  const handleAcceptPending = () => {
    acceptPendingMutation.mutate();
  };

  if (statusLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
        <Typography ml={2}>Checking your onboarding status...</Typography>
      </Box>
    );
  }

  if (statusError) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Alert severity="error">
          Failed to load onboarding information. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ bgcolor: 'grey.100', p: 2 }}
    >
      <Paper elevation={3} sx={{ maxWidth: 600, width: '100%', p: 4 }}>
        <Box textAlign="center" mb={4}>
          <BusinessIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Welcome to {onboardingStatus?.client?.name || 'the application'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Let's get you set up with an organization
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={activeStep} orientation="vertical">
          {/* Step 1: Choose Action */}
          <Step>
            <StepLabel>Choose your path</StepLabel>
            <StepContent>
              {onboardingStatus?.pending_invitation && (
                <Card sx={{ mb: 2, border: '2px solid', borderColor: 'primary.main' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <EmailIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <Typography variant="h6">You have a pending invitation!</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      You've been invited to join "{onboardingStatus.pending_invitation.organization.name}" 
                      as a {onboardingStatus.pending_invitation.role.name}.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="contained"
                      startIcon={<CheckCircleIcon />}
                      onClick={handleAcceptPending}
                      disabled={acceptPendingMutation.isLoading}
                    >
                      {acceptPendingMutation.isLoading ? 'Accepting...' : 'Accept Invitation'}
                    </Button>
                  </CardActions>
                </Card>
              )}

              <Box display="flex" gap={2} flexDirection={{ xs: 'column', md: 'row' }}>
                <Card 
                  sx={{ 
                    flex: 1,
                    cursor: 'pointer',
                    border: selectedAction === 'create' ? '2px solid' : '1px solid',
                    borderColor: selectedAction === 'create' ? 'primary.main' : 'grey.300'
                  }}
                  onClick={() => {
                    setSelectedAction('create');
                    setActiveStep(OnboardingSteps.CREATE_ORG);
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <BusinessIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Create Organization
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Start a new organization and invite team members
                    </Typography>
                  </CardContent>
                </Card>

                <Card 
                  sx={{ 
                    flex: 1,
                    cursor: 'pointer',
                    border: selectedAction === 'join' ? '2px solid' : '1px solid',
                    borderColor: selectedAction === 'join' ? 'primary.main' : 'grey.300'
                  }}
                  onClick={() => {
                    setSelectedAction('join');
                    setActiveStep(OnboardingSteps.JOIN_ORG);
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <GroupAddIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Join Organization
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Join an existing organization with an invitation code
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </StepContent>
          </Step>

          {/* Step 2: Create Organization */}
          <Step>
            <StepLabel>Create your organization</StepLabel>
            <StepContent>
              <Box mb={3}>
                <TextField
                  fullWidth
                  label="Organization Name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Enter your organization name"
                  disabled={createOrgMutation.isLoading}
                  sx={{ mb: 2 }}
                />
                <Typography variant="body2" color="text.secondary">
                  This will be the name of your workspace. You can change it later.
                </Typography>
              </Box>
              
              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  onClick={handleCreateOrg}
                  disabled={createOrgMutation.isLoading || !orgName.trim()}
                  startIcon={createOrgMutation.isLoading ? <CircularProgress size={20} /> : <BusinessIcon />}
                >
                  {createOrgMutation.isLoading ? 'Creating...' : 'Create Organization'}
                </Button>
                <Button onClick={() => setActiveStep(OnboardingSteps.CHOOSE_ACTION)}>
                  Back
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 3: Join Organization */}
          <Step>
            <StepLabel>Join organization</StepLabel>
            <StepContent>
              <Box mb={3}>
                <TextField
                  fullWidth
                  label="Invitation Code"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value)}
                  placeholder="Enter invitation code"
                  disabled={joinOrgMutation.isLoading}
                  sx={{ mb: 2 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Enter the invitation code you received from your organization administrator.
                </Typography>
              </Box>
              
              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  onClick={handleJoinOrg}
                  disabled={joinOrgMutation.isLoading || !invitationCode.trim()}
                  startIcon={joinOrgMutation.isLoading ? <CircularProgress size={20} /> : <GroupAddIcon />}
                >
                  {joinOrgMutation.isLoading ? 'Joining...' : 'Join Organization'}
                </Button>
                <Button onClick={() => setActiveStep(OnboardingSteps.CHOOSE_ACTION)}>
                  Back
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 4: Complete */}
          <Step>
            <StepLabel>Welcome aboard!</StepLabel>
            <StepContent>
              <Box textAlign="center" py={4}>
                <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  All set!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Redirecting you to the application...
                </Typography>
              </Box>
            </StepContent>
          </Step>
        </Stepper>

        <Divider sx={{ my: 3 }} />

        <Box textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Need help? Contact your system administrator.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}