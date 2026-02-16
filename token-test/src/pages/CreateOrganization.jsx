/**
 * @fileoverview Create Organization Page
 * @description Screen for creating a new organization or joining via invitation
 * Uses MUI components for consistent theming with dark mode support
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '@spidy092/auth-client';
import { useOrganization } from '../context/OrganizationContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Container,
  Link,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Link as LinkIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';

export default function CreateOrganization() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { createOrganization, loading, error, fetchOrganizations } = useOrganization();
  const [activeTab, setActiveTab] = useState('create');
  const [orgName, setOrgName] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [validationError, setValidationError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validateName = (name) => {
    if (!name.trim()) return 'Organization name is required';
    if (name.trim().length < 2) return 'Organization name must be at least 2 characters';
    if (name.trim().length > 100) return 'Organization name must be less than 100 characters';
    return '';
  };

  const validateCode = (code) => {
    if (!code.trim()) return 'Invitation code is required';
    if (code.trim().length < 6) return 'Invalid invitation code';
    return '';
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateName(orgName);
    if (validation) {
      setValidationError(validation);
      return;
    }
    
    setValidationError('');
    setSubmitting(true);
    
    try {
      await createOrganization(orgName.trim());
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setValidationError(err.response?.data?.message || err.message || 'Failed to create organization');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateCode(invitationCode);
    if (validation) {
      setValidationError(validation);
      return;
    }
    
    setValidationError('');
    setSubmitting(true);
    
    try {
      const response = await auth.api.post('/org-onboarding/join', {
        invitation_code: invitationCode.trim()
      });
      
      if (response.data.success) {
        await fetchOrganizations();
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to join organization';
      setValidationError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    if (newValue !== null) {
      setActiveTab(newValue);
      setValidationError('');
      setOrgName('');
      setInvitationCode('');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.2)} 100%)`
          : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        p: 3,
      }}
    >
      <Container maxWidth="sm">
        <Card
          elevation={theme.palette.mode === 'dark' ? 0 : 8}
          sx={{
            borderRadius: 3,
            border: theme.palette.mode === 'dark' ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}` : 'none',
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <BusinessIcon
                sx={{
                  fontSize: 56,
                  color: theme.palette.primary.main,
                  mb: 2,
                }}
              />
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Get Started
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Create a new organization or join an existing one
              </Typography>
            </Box>

            {/* Tab Switcher */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              <ToggleButtonGroup
                value={activeTab}
                exclusive
                onChange={handleTabChange}
                aria-label="Organization action"
                sx={{
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  borderRadius: 2,
                  p: 0.5,
                  '& .MuiToggleButton-root': {
                    border: 'none',
                    borderRadius: 1.5,
                    px: 3,
                    py: 1,
                    textTransform: 'none',
                    fontWeight: 600,
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.primary.main,
                      color: '#fff',
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                      },
                    },
                  },
                }}
              >
                <ToggleButton value="create" disabled={submitting}>
                  <AddIcon sx={{ mr: 1, fontSize: 18 }} />
                  Create New
                </ToggleButton>
                <ToggleButton value="join" disabled={submitting}>
                  <LinkIcon sx={{ mr: 1, fontSize: 18 }} />
                  Join Existing
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Error Display */}
            {(validationError || error) && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {validationError || error}
              </Alert>
            )}

            {/* Create Organization Form */}
            {activeTab === 'create' && (
              <Box component="form" onSubmit={handleCreateSubmit}>
                <TextField
                  fullWidth
                  label="Organization Name"
                  placeholder="Enter organization name"
                  value={orgName}
                  onChange={(e) => {
                    setOrgName(e.target.value);
                    if (validationError) setValidationError(validateName(e.target.value));
                  }}
                  disabled={submitting}
                  autoFocus
                  error={!!validationError}
                  helperText="This will be your organization's display name"
                  sx={{ mb: 3 }}
                  InputProps={{
                    sx: {
                      borderRadius: 2,
                    },
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={submitting || loading}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                    },
                  }}
                >
                  {submitting ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1, color: 'inherit' }} />
                      Creating...
                    </>
                  ) : (
                    'Create Organization'
                  )}
                </Button>
              </Box>
            )}

            {/* Join Organization Form */}
            {activeTab === 'join' && (
              <Box component="form" onSubmit={handleJoinSubmit}>
                <TextField
                  fullWidth
                  label="Invitation Code"
                  placeholder="Enter your invitation code"
                  value={invitationCode}
                  onChange={(e) => {
                    setInvitationCode(e.target.value);
                    if (validationError) setValidationError(validateCode(e.target.value));
                  }}
                  disabled={submitting}
                  autoFocus
                  error={!!validationError}
                  helperText="Enter the invitation code you received"
                  sx={{ mb: 3 }}
                  InputProps={{
                    sx: {
                      borderRadius: 2,
                    },
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={submitting || loading}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                    },
                  }}
                >
                  {submitting ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1, color: 'inherit' }} />
                      Joining...
                    </>
                  ) : (
                    'Join Organization'
                  )}
                </Button>
              </Box>
            )}

            {/* Footer */}
            <Divider sx={{ my: 3 }} />
            <Typography variant="body2" color="text.secondary" textAlign="center">
              By continuing, you agree to our{' '}
              <Link href="/terms" target="_blank" underline="hover">
                Terms of Service
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
