import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Alert,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Email as EmailIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { formatDistanceToNow } from 'date-fns';
import workspaceService from '../../services/workspaceService';

export default function InvitationsList({ workspaceId }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [error, setError] = useState('');

  // Fetch Invitations
  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ['workspace-invitations', workspaceId],
    queryFn: () => workspaceService.getInvitations(workspaceId),
    enabled: !!workspaceId
  });

  // Revoke Mutation
  const revokeMutation = useMutation({
    mutationFn: (invitationId) => workspaceService.revokeInvitation(workspaceId, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspace-invitations', workspaceId]);
      enqueueSnackbar('Invitation revoked', { variant: 'success' });
    },
    onError: (err) => {
      const errorMessage = err.response?.data?.message || 'Failed to revoke invitation';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  });

  const handleRevoke = (invitationId) => {
    if (confirm('Are you sure you want to revoke this invitation?')) {
      revokeMutation.mutate(invitationId);
    }
  };

  if (isLoading) {
    return <CircularProgress size={24} />;
  }

  if (invitations.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <EmailIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No pending invitations
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Invite members to see them here.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Sent</TableCell>
              <TableCell>Expires</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invitations.map((invite) => {
              const isExpired = new Date(invite.expires_at) < new Date();
              return (
                <TableRow key={invite.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon color="action" fontSize="small" />
                      <Typography variant="body2">{invite.email}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={invite.role} 
                      size="small" 
                      variant="outlined" 
                      color="primary"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={isExpired ? 'Expired' : invite.status} 
                      size="small" 
                      color={isExpired ? 'error' : 'warning'}
                      variant={isExpired ? 'outlined' : 'filled'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(invite.created_at), { addSuffix: true })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TimeIcon fontSize="small" color={isExpired ? 'error' : 'action'} />
                      <Typography variant="caption" color={isExpired ? 'error' : 'text.secondary'}>
                        {new Date(invite.expires_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Revoke Invitation">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleRevoke(invite.id)}
                        disabled={revokeMutation.isLoading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
