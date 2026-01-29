import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Divider,
  Paper
} from '@mui/material';
import { Email as EmailIcon, Delete as DeleteIcon, Send as SendIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import workspaceService from '../../services/workspaceService';

export default function EmailInviteSection({ workspaceId }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch pending invitations
  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ['workspace-invitations', workspaceId],
    queryFn: () => workspaceService.getInvitations(workspaceId),
    enabled: !!workspaceId
  });

  // Send invitation mutation
  const sendMutation = useMutation({
    mutationFn: (data) => workspaceService.sendInvitation(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspace-invitations', workspaceId]);
      setEmail('');
      setMessage('');
      enqueueSnackbar('Invitation sent successfully!', { variant: 'success' });
    },
    onError: (err) => {
      const errorMessage = err.response?.data?.message || 'Failed to send invitation';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  });

  // Revoke invitation mutation
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

  const handleSend = () => {
    if (!email) return setError('Email is required');
    sendMutation.mutate({ email, role, message });
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <EmailIcon /> Invite by Email
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Invite Form */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Role</InputLabel>
          <Select value={role} label="Role" onChange={(e) => setRole(e.target.value)}>
            <MenuItem value="viewer">Viewer</MenuItem>
            <MenuItem value="editor">Editor</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={handleSend}
          disabled={sendMutation.isLoading}
        >
          {sendMutation.isLoading ? 'Sending...' : 'Send Invite'}
        </Button>
      </Box>

      <TextField
        label="Optional Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        size="small"
        fullWidth
        multiline
        rows={2}
        sx={{ mb: 3 }}
      />

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Pending Invitations</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invitations.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.invited_email}</TableCell>
                  <TableCell>
                    <Chip label={inv.role} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell>{new Date(inv.expires_at).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => revokeMutation.mutate(inv.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {invitations.length === 0 && !isLoading && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No pending invitations
        </Typography>
      )}
    </Paper>
  );
}
