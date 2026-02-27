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
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Delete as DeleteIcon,
  PersonAdd as AddIcon,
  Star as PrimaryIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../hooks/useToast';
import { formatDistanceToNow } from 'date-fns';
import api, { extractData } from '../../services/api';

export default function OrganizationMembers({ orgId, orgName, primaryUsers = [] }) {
  const queryClient = useQueryClient();
  const { showSuccess, showError, showWarning, showInfo, enqueueSnackbar } = useToast();
  const [error, setError] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ user_id: '', role_id: '' });

  // Fetch users for dropdown
  const { data: users = [] } = useQuery({
    queryKey: ['users-for-memberships'],
    queryFn: () => api.get('/users').then(extractData),
    enabled: addDialogOpen
  });

  // Fetch roles for dropdown
  const { data: roles = [] } = useQuery({
    queryKey: ['db-roles-for-memberships'],
    queryFn: () => api.get('/db-roles').then(extractData),
    enabled: addDialogOpen
  });

  // Fetch members — response shape: { organization, members[], total_members }
  const { data: membersData, isLoading } = useQuery({
    queryKey: ['org-members', orgId],
    queryFn: () => api.get(`/organizations/${orgId}/members`).then(extractData),
    enabled: !!orgId
  });

  const members = membersData?.members || [];

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (membershipId) => api.delete(`/organizations/${orgId}/members/${membershipId}`),
    onSuccess: () => {
        queryClient.invalidateQueries(['org-members', orgId]);
        showSuccess('Member removed successfully');
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to remove member')
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: (data) => api.post(`/organizations/${orgId}/members`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['org-members', orgId]);
      showSuccess('Member added successfully');
      setAddDialogOpen(false);
      setFormData({ user_id: '', role_id: '' });
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to add member')
  });

  const handleAddMember = () => {
    if (!formData.user_id || !formData.role_id) {
       setError('User and role are required');
       return;
    }
    addMemberMutation.mutate(formData);
  };

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
          <Chip label={members.length} size="small" color="primary" sx={{ ml: 1 }} />
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
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((member) => {
                // The /members endpoint wraps user info in a `user` object
                const user = member.user || member;
                const role = member.role || {};
                return (
                  <TableRow key={member.membership_id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          {(user.email || '?').charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {user.email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(user.keycloak_id || '').substring(0, 8)}...
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={role.name || 'Member'} 
                        size="small" 
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {user.department || user.designation || '—'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_active !== false ? 'Active' : 'Inactive'}
                        size="small"
                        color={user.is_active !== false ? 'success' : 'default'}
                        variant="outlined"
                      />
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
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Primary Users Section */}
      {primaryUsers.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            <PrimaryIcon sx={{ verticalAlign: 'middle', mr: 0.5, color: 'warning.main' }} />
            Primary Users
            <Chip label={primaryUsers.length} size="small" color="secondary" sx={{ ml: 1 }} />
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Department</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {primaryUsers.map((user) => (
                  <TableRow key={user.user_id || user.keycloak_id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                          {(user.email || '?').charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {user.email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(user.keycloak_id || '').substring(0, 8)}...
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label="Owner (Primary)" size="small" color="warning" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      {user.department || user.designation || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Member to {orgName}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3, mt: 1 }}>
                <InputLabel>User</InputLabel>
                <Select
                    value={formData.user_id}
                    label="User"
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                >
                    {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                        <Box display="flex" alignItems="center" width="100%">
                        <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                            {user?.email?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <Box>
                            <Typography variant="body2">{user.email}</Typography>
                        </Box>
                        </Box>
                    </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                    value={formData.role_id}
                    label="Role"
                    onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                >
                    {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                        {role.name}
                    </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleAddMember}
            disabled={addMemberMutation.isLoading}
          >
            {addMemberMutation.isLoading ? 'Adding...' : 'Add Member'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

