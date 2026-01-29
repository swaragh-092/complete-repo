// auth-ui/src/components/organizations/OrganizationMembers.jsx
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
  IconButton,
  Button,
  Chip,
  Avatar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Delete as DeleteIcon,
  PersonAdd as AddIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import api, { extractData } from '../../services/api';

export default function OrganizationMembers({ orgId, orgName }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState({ email: '', role_id: '' });

  // Fetch members
  const { data: membersData, isLoading } = useQuery({
    queryKey: ['org-members', orgId],
    queryFn: () => api.get(`/organizations/${orgId}/members`).then(extractData),
    enabled: !!orgId
  });

  // Fetch roles for dropdown
  const { data: roles = [] } = useQuery({
    queryKey: ['database-roles'],
    queryFn: () => api.get('/roles').then(extractData)
  });

  const members = membersData?.members || [];

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: (data) => api.post(`/memberships`, { 
      user_id: data.user_id,
      org_id: orgId,
      role_id: data.role_id
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['org-members', orgId]);
      setAddDialogOpen(false);
      setAddForm({ email: '', role_id: '' });
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to add member')
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (membershipId) => api.delete(`/memberships/${membershipId}`),
    onSuccess: () => queryClient.invalidateQueries(['org-members', orgId]),
    onError: (err) => setError(err.response?.data?.message || 'Failed to remove member')
  });

  const handleRemove = (membershipId) => {
    if (confirm('Are you sure you want to remove this member?')) {
      removeMemberMutation.mutate(membershipId);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Members in {orgName}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddDialogOpen(true)}
        >
          Add Member
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Members Table */}
      {members.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No members found</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.membership_id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        {(member.email || '?').charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {member.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {member.keycloak_id?.substring(0, 8)}...
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={member.role?.name || 'Member'} 
                      size="small" 
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {member.department || member.designation || '-'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {member.created_at ? formatDistanceToNow(new Date(member.created_at), { addSuffix: true }) : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleRemove(member.membership_id)}
                      disabled={removeMemberMutation.isLoading}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Member Dialog - Simplified for admin */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Member to {orgName}</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            To add a member, use the Memberships page or invite them via the workspace.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Close</Button>
          <Button 
            variant="outlined" 
            onClick={() => { setAddDialogOpen(false); window.location.href = '/memberships'; }}
          >
            Go to Memberships
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
