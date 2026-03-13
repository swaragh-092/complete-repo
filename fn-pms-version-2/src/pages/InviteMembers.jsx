/**
 * @fileoverview Invite Members Page
 * @description Screen for inviting users to join the organization
 * Uses MUI components for consistent theming with dark mode support
 */

import { useState, useEffect } from 'react';
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
  CircularProgress,
  Container,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Paper,
  useTheme,
  alpha,
  Snackbar,
} from '@mui/material';
import {
  Person as PersonIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  GroupAdd as GroupAddIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

export default function InviteMembers() {
  const theme = useTheme();
  const { currentOrganization } = useOrganization();
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [roles, setRoles] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    if (currentOrganization) {
      fetchRoles();
      fetchInvitations();
    }
  }, [currentOrganization]);

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
      const response = await auth.api.get('/db-roles');
      const allRoles = response.data?.data || response.data || [];
      const invitableRoles = allRoles.filter(role => 
        !['superadmin', 'owner'].includes(role.name?.toLowerCase())
      );
      setRoles(invitableRoles);
      if (invitableRoles.length > 0) {
        setSelectedRole(invitableRoles[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    } finally {
      setLoadingRoles(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      setLoadingInvitations(true);
      const orgId = currentOrganization.id || currentOrganization.org_id;
      const response = await auth.api.get(`/org-onboarding/invitations?org_id=${orgId}`);
      // Handle ResponseHandler wrapper: { success, data: { invitations: [...] } }
      const invitationsData = response.data?.data?.invitations || response.data.invitations || [];
      console.log('📋 Invitations loaded:', invitationsData);
      setInvitations(invitationsData);
    } catch (err) {
      console.error('Failed to fetch invitations:', err);
      setInvitations([]);
    } finally {
      setLoadingInvitations(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await auth.api.post('/org-onboarding/invitations', {
        org_id: currentOrganization.id || currentOrganization.org_id,
        invited_email: email.trim(),
        role_id: selectedRole,
        expires_in_days: 7
      });

      setSuccess({
        message: 'Invitation sent successfully!',
        invitation: response.data.invitation
      });
      setEmail('');
      fetchInvitations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!currentOrganization) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>⚠️ No Organization Selected</Typography>
          <Typography>Please select an organization first.</Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <GroupAddIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight={700}>
            Invite Members
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Invite users to join <strong>{currentOrganization.name || currentOrganization.org_name}</strong>
        </Typography>
      </Box>

      {/* Send Invitation Card */}
      <Card 
        elevation={theme.palette.mode === 'dark' ? 0 : 2}
        sx={{ 
          mb: 3, 
          borderRadius: 3,
          border: theme.palette.mode === 'dark' ? `1px solid ${alpha(theme.palette.divider, 0.2)}` : 'none',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Send Invitation
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                fullWidth
                label="Email Address"
                placeholder="colleague@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                sx={{ flex: 2 }}
                InputProps={{ sx: { borderRadius: 2 } }}
              />
              
              <FormControl sx={{ flex: 1, minWidth: 150 }}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  disabled={loading || loadingRoles}
                  label="Role"
                  sx={{ borderRadius: 2 }}
                >
                  {loadingRoles ? (
                    <MenuItem disabled>Loading roles...</MenuItem>
                  ) : roles.length === 0 ? (
                    <MenuItem disabled>No roles available</MenuItem>
                  ) : (
                    roles.map(role => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
                <Typography fontWeight={600}>{success.message}</Typography>
                {success.invitation?.invitation_link && (
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      mt: 1, 
                      p: 1.5, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      backgroundColor: alpha(theme.palette.success.main, 0.1),
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        flex: 1, 
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        wordBreak: 'break-all'
                      }}
                    >
                      {success.invitation.invitation_link}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(success.invitation.invitation_link, 'new')}
                      color={copiedCode === 'new' ? 'success' : 'default'}
                    >
                      {copiedCode === 'new' ? <CheckIcon /> : <CopyIcon />}
                    </IconButton>
                  </Paper>
                )}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading || !email.trim()}
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                },
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1, color: 'inherit' }} />
                  Sending...
                </>
              ) : (
                '📧 Send Invitation'
              )}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Pending Invitations Card */}
      <Card 
        elevation={theme.palette.mode === 'dark' ? 0 : 2}
        sx={{ 
          borderRadius: 3,
          border: theme.palette.mode === 'dark' ? `1px solid ${alpha(theme.palette.divider, 0.2)}` : 'none',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Pending Invitations
          </Typography>

          {loadingInvitations ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={32} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Loading invitations...
              </Typography>
            </Box>
          ) : invitations.filter(inv => inv.status === 'pending').length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <Typography sx={{ fontSize: 48, mb: 1 }}>📭</Typography>
              <Typography color="text.secondary">No pending invitations</Typography>
            </Box>
          ) : (
            <List>
              {invitations.filter(inv => inv.status === 'pending').map((invitation, index) => (
                <Box key={invitation.id}>
                  {index > 0 && <Divider />}
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon fontSize="small" color="action" />
                          <Typography component="span" fontWeight={500}>{invitation.invited_email}</Typography>
                          <Chip 
                            label={invitation.role} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                            sx={{ height: 24 }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <ScheduleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography component="span" variant="caption" color="text.secondary">
                            Expires: {formatDate(invitation.expires_at)}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      {invitation.invitation_link ? (
                        <IconButton
                          onClick={() => copyToClipboard(invitation.invitation_link, invitation.id)}
                          size="small"
                          color={copiedCode === invitation.id ? 'success' : 'default'}
                          title="Copy invitation link"
                        >
                          {copiedCode === invitation.id ? <CheckIcon /> : <CopyIcon />}
                        </IconButton>
                      ) : (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          Link sent
                        </Typography>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
