
// admin-ui/src/components/realm/RealmUsers.jsx

import { useState } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, FormControlLabel, Switch,
  Menu, MenuItem, Tooltip
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  MoreVert as MoreIcon, PersonAdd as PersonAddIcon,
  Lock as LockIcon, LockOpen as UnlockIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { formatDistanceToNow } from 'date-fns';
import api, { extractData } from '../../services/api';

function RealmUsers({ realmName }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [openCreate, setOpenCreate] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    enabled: true,
    password: ''
  });

  // ✅ Updated to match /users route with realm filter
  const { data: users = [] } = useQuery({
    queryKey: ['realm-users', realmName],
    queryFn: () => api.get(`/users?realm=${realmName}`).then(extractData),
    enabled: !!realmName,
  });

  // ✅ Updated to match POST /users route
  const createUserMutation = useMutation({
    mutationFn: (userData) => api.post('/users', { ...userData, realm: realmName }),
    onSuccess: () => {
      queryClient.invalidateQueries(['realm-users', realmName]);
      setOpenCreate(false);
      setFormData({
        username: '', email: '', firstName: '', lastName: '',
        enabled: true, password: ''
      });
    },
    onError: (error) => {
      enqueueSnackbar(`Failed to create user: ${error.response?.data?.message || error.message}`, { variant: 'error' });
    }
  });

  // ✅ Updated to match DELETE /users/:userId route
  const deleteUserMutation = useMutation({
    mutationFn: (userId) => api.delete(`/users/${userId}?realm=${realmName}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['realm-users', realmName]);
      setAnchorEl(null);
    },
    onError: (error) => {
      enqueueSnackbar(`Failed to delete user: ${error.response?.data?.message || error.message}`, { variant: 'error' });
    }
  });

  // ✅ Added password reset functionality
  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, newPassword }) => 
      api.post(`/users/${userId}/reset-password?realm=${realmName}`, { newPassword }),
    onSuccess: () => {
      enqueueSnackbar('Password reset successfully', { variant: 'success' });
      setAnchorEl(null);
    },
    onError: (error) => {
      enqueueSnackbar(`Failed to reset password: ${error.response?.data?.message || error.message}`, { variant: 'error' });
    }
  });

  const handleCreateUser = () => {
    if (!formData.username || !formData.email || !formData.password) {
      enqueueSnackbar('Username, email, and password are required', { variant: 'warning' });
      return;
    }
    createUserMutation.mutate(formData);
  };

  const handleMenuClick = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleDeleteUser = () => {
    if (selectedUser && confirm(`Are you sure you want to delete user ${selectedUser.username}?`)) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  const handleResetPassword = () => {
    const newPassword = prompt('Enter new password:');
    if (newPassword && selectedUser) {
      resetPasswordMutation.mutate({ userId: selectedUser.id, newPassword });
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Users in {realmName}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreate(true)}
        >
          Add User
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Email Verified</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {`${user.firstName || ''} ${user.lastName || ''}`.trim() || '-'}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={user.enabled ? 'Enabled' : 'Disabled'} 
                    color={user.enabled ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={user.emailVerified ? 'Verified' : 'Unverified'} 
                    color={user.emailVerified ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {user.createdTimestamp
                    ? formatDistanceToNow(new Date(user.createdTimestamp), { addSuffix: true })
                    : '-'
                  }
                </TableCell>
                <TableCell>
                  <IconButton onClick={(e) => handleMenuClick(e, user)}>
                    <MoreIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No users found in this realm
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* User Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleMenuClose}>
          <EditIcon sx={{ mr: 1 }} /> Edit User
        </MenuItem>
        <MenuItem onClick={handleResetPassword}>
          <LockIcon sx={{ mr: 1 }} /> Reset Password
        </MenuItem>
        <MenuItem onClick={handleDeleteUser} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} /> Delete User
        </MenuItem>
      </Menu>

      {/* Create User Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Username"
            fullWidth
            variant="outlined"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="First Name"
            fullWidth
            variant="outlined"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Last Name"
            fullWidth
            variant="outlined"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              />
            }
            label="Enabled"
            sx={{ mb: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateUser} 
            variant="contained"
            disabled={createUserMutation.isLoading}
          >
            {createUserMutation.isLoading ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default RealmUsers;