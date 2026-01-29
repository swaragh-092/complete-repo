import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import { CheckCircle as CheckIcon, Error as ErrorIcon, Email as EmailIcon } from '@mui/icons-material';
import workspaceService from '../../services/workspaceService';
import { useWorkspace } from '../../context/WorkspaceContext';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshWorkspaces } = useWorkspace();
  
  const code = searchParams.get('code');
  
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [acceptedWorkspace, setAcceptedWorkspace] = useState(null);

  // Load invitation details
  useEffect(() => {
    if (!code) {
      setError('Invalid invitation link - no code provided');
      setLoading(false);
      return;
    }

    workspaceService.previewInvitation(code)
      .then(data => {
        setInvitation(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to load invitation');
        setLoading(false);
      });
  }, [code]);

  const handleAccept = async () => {
    setAccepting(true);
    setError('');
    try {
      const result = await workspaceService.acceptInvitation(code);
      setAccepted(true);
      setAcceptedWorkspace(result.workspace);
      refreshWorkspaces && refreshWorkspaces();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  const handleGoToWorkspace = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Success state
  if (accepted) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 450 }}>
          <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={600} gutterBottom>
            You're In!
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            You've successfully joined <strong>{acceptedWorkspace?.name}</strong>
          </Typography>
          <Button variant="contained" size="large" onClick={handleGoToWorkspace}>
            Go to Workspace
          </Button>
        </Paper>
      </Box>
    );
  }

  // Error state (no valid invitation)
  if (error && !invitation) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 450 }}>
          <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Invalid Invitation
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {error}
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/')}>
            Go to Dashboard
          </Button>
        </Paper>
      </Box>
    );
  }

  // Invitation preview
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Paper sx={{ p: 4, maxWidth: 500 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <EmailIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h5" fontWeight={600}>
            Workspace Invitation
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {!invitation?.isValid && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            This invitation is no longer valid ({invitation?.status}).
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">Workspace</Typography>
          <Typography variant="h6">{invitation?.Workspace?.name}</Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">Organization</Typography>
          <Typography>{invitation?.Workspace?.Organization?.name || 'N/A'}</Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">Your Role</Typography>
          <Chip label={invitation?.role} color="primary" size="small" />
        </Box>

        {invitation?.message && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">Message from inviter</Typography>
            <Typography sx={{ fontStyle: 'italic' }}>"{invitation?.message}"</Typography>
          </Box>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">Invited by</Typography>
          <Typography>{invitation?.Inviter?.email}</Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">Expires</Typography>
          <Typography>{new Date(invitation?.expires_at).toLocaleDateString()}</Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" fullWidth onClick={() => navigate('/')}>
            Decline
          </Button>
          <Button 
            variant="contained" 
            fullWidth 
            onClick={handleAccept}
            disabled={!invitation?.isValid || accepting}
          >
            {accepting ? 'Accepting...' : 'Accept Invitation'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
