
// admin-ui/src/pages/DatabaseRoles.jsx
import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Menu,
  MenuItem,
  Chip,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  ListItemText,
  Checkbox,
  Alert,
  Tooltip,
  Badge,
  Switch,
  FormControlLabel,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Security as SecurityIcon,
  People as PeopleIcon,
  VpnKey as PermissionIcon,
  Assignment as AssignIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { formatDistanceToNow } from 'date-fns';
import databaseRoleService from '../services/databaseRoleService';
import SearchFilter from '../components/SearchFilter';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function DatabaseRoles() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [tabValue, setTabValue] = useState(0);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: []
  });
  const [assignData, setAssignData] = useState({
    user_id: '',
    org_id: ''
  });
  const [search, setSearch] = useState('');

  // Fetch database roles
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['database-roles'],
    queryFn: () => databaseRoleService.getAllRoles()
  });

  // Client-side search filtering
  const filteredRoles = roles.filter(role =>
    role.name?.toLowerCase().includes(search.toLowerCase()) ||
    role.description?.toLowerCase().includes(search.toLowerCase())
  );

  // Fetch permissions for role creation/editing
  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => databaseRoleService.getAllPermissions()
  });

  // Fetch users for role assignment
  const { data: users = [] } = useQuery({
    queryKey: ['users-for-assignment'],
    queryFn: () => databaseRoleService.getUsers(),
    enabled: openAssign
  });

  // Fetch organizations for role assignment
  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations-for-assignment'],
    queryFn: () => databaseRoleService.getOrganizations(),
    enabled: openAssign
  });

  // Create role mutation
  const createMutation = useMutation({
    mutationFn: (roleData) => databaseRoleService.createRole(roleData),
    onSuccess: () => {
      queryClient.invalidateQueries(['database-roles']);
      setOpenCreate(false);
      setFormData({ name: '', description: '', permissions: [] });
    },
    onError: (error) => {
      enqueueSnackbar(`Failed to create role: ${error.response?.data?.message || error.message}`, { variant: 'error' });
    }
  });

  // Update role mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => databaseRoleService.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['database-roles']);
      setOpenEdit(false);
      setSelectedRole(null);
    },
    onError: (error) => {
      enqueueSnackbar(`Failed to update role: ${error.response?.data?.message || error.message}`, { variant: 'error' });
    }
  });

  // Delete role mutation
  const deleteMutation = useMutation({
    mutationFn: (roleId) => databaseRoleService.deleteRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries(['database-roles']);
      setAnchorEl(null);
      setSelectedRole(null);
    },
    onError: (error) => {
      enqueueSnackbar(`Failed to delete role: ${error.response?.data?.message || error.message}`, { variant: 'error' });
    }
  });

  // Assign role mutation
  const assignMutation = useMutation({
    mutationFn: ({ roleId, ...data }) => databaseRoleService.assignRole(roleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['database-roles']);
      setOpenAssign(false);
      setAssignData({ user_id: '', org_id: '' });
    },
    onError: (error) => {
      enqueueSnackbar(`Failed to assign role: ${error.response?.data?.message || error.message}`, { variant: 'error' });
    }
  });

  const handleCreateRole = () => {
    if (!formData.name) {
      enqueueSnackbar('Role name is required', { variant: 'warning' });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEditRole = () => {
    if (!formData.name) {
      enqueueSnackbar('Role name is required', { variant: 'warning' });
      return;
    }
    updateMutation.mutate({ id: selectedRole.id, ...formData });
  };

  const handleAssignRole = () => {
    if (!assignData.user_id || !assignData.org_id) {
      enqueueSnackbar('User and organization are required', { variant: 'warning' });
      return;
    }
    assignMutation.mutate({ roleId: selectedRole.id, ...assignData });
  };

  const handleMenuClick = (event, role) => {
    setAnchorEl(event.currentTarget);
    setSelectedRole(role);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRole(null);
  };

  const handleEditClick = () => {
    setFormData({
      name: selectedRole.name,
      description: selectedRole.description || '',
      permissions: selectedRole.permissions?.map(p => p.id) || []
    });
    setOpenEdit(true);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    if (confirm(`Are you sure you want to delete "${selectedRole.name}"?`)) {
      deleteMutation.mutate(selectedRole.id);
    }
  };

  const handleAssignClick = () => {
    setOpenAssign(true);
    handleMenuClose();
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, margin: '0 auto' }}>
      {/* Header */}
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} gap={2} mb={3}>
        <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
          Database Roles
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreate(true)}
        >
          Create Role
        </Button>
      </Box>

      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
        <Tab label="All Roles" />
        <Tab label="System Roles" />
        <Tab label="Custom Roles" />
      </Tabs>

      {/* Search */}
      <Paper sx={{ mb: 3, p: 2 }} elevation={0}>
        <SearchFilter
          onSearch={setSearch}
          placeholder="Search roles by name or description..."
          initialValue={search}
        />
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <RolesTable 
          roles={filteredRoles} 
          onMenuClick={handleMenuClick}
          isLoading={isLoading}
          search={search}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <RolesTable 
          roles={filteredRoles.filter(role => role.is_system)} 
          onMenuClick={handleMenuClick}
          isLoading={isLoading}
          search={search}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <RolesTable 
          roles={filteredRoles.filter(role => !role.is_system)} 
          onMenuClick={handleMenuClick}
          isLoading={isLoading}
          search={search}
        />
      </TabPanel>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditClick}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Role
        </MenuItem>
        <MenuItem onClick={handleAssignClick}>
          <AssignIcon sx={{ mr: 1 }} />
          Assign to User
        </MenuItem>
        {!selectedRole?.is_system && (
          <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} />
            Delete Role
          </MenuItem>
        )}
      </Menu>

      {/* Create Role Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Database Role</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Role Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Permissions</InputLabel>
            <Select
              multiple
              value={formData.permissions}
              onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
              input={<OutlinedInput label="Permissions" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const permission = permissions.find(p => p.id === value);
                    return (
                      <Chip
                        key={value}
                        label={permission?.name || value}
                        size="small"
                      />
                    );
                  })}
                </Box>
              )}
            >
              {permissions.map((permission) => (
                <MenuItem key={permission.id} value={permission.id}>
                  <Checkbox checked={formData.permissions.indexOf(permission.id) > -1} />
                  <ListItemText 
                    primary={permission.name}
                    secondary={permission.description}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button onClick={handleCreateRole} variant="contained" disabled={createMutation.isLoading}>
            {createMutation.isLoading ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Database Role</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Role Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
            disabled={selectedRole?.is_system}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Permissions</InputLabel>
            <Select
              multiple
              value={formData.permissions}
              onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
              input={<OutlinedInput label="Permissions" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const permission = permissions.find(p => p.id === value);
                    return (
                      <Chip
                        key={value}
                        label={permission?.name || value}
                        size="small"
                      />
                    );
                  })}
                </Box>
              )}
            >
              {permissions.map((permission) => (
                <MenuItem key={permission.id} value={permission.id}>
                  <Checkbox checked={formData.permissions.indexOf(permission.id) > -1} />
                  <ListItemText 
                    primary={permission.name}
                    secondary={permission.description}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button onClick={handleEditRole} variant="contained" disabled={updateMutation.isLoading}>
            {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Role Dialog */}
      <Dialog open={openAssign} onClose={() => setOpenAssign(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Role to User</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>User</InputLabel>
            <Select
              value={assignData.user_id}
              onChange={(e) => setAssignData({ ...assignData, user_id: e.target.value })}
              label="User"
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.email} ({user.username})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Organization</InputLabel>
            <Select
              value={assignData.org_id}
              onChange={(e) => setAssignData({ ...assignData, org_id: e.target.value })}
              label="Organization"
            >
              {organizations.map((org) => (
                <MenuItem key={org.id} value={org.id}>
                  {org.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssign(false)}>Cancel</Button>
          <Button onClick={handleAssignRole} variant="contained" disabled={assignMutation.isLoading}>
            {assignMutation.isLoading ? 'Assigning...' : 'Assign Role'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function RolesTable({ roles, onMenuClick, isLoading, search }) {
  if (isLoading) {
    return <Typography>Loading roles...</Typography>;
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Permissions</TableCell>
            <TableCell>Users</TableCell>
            <TableCell>Created</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.id}>
              <TableCell>
                <Box display="flex" alignItems="center">
                  <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body1" fontWeight="medium">
                    {role.name}
                  </Typography>
                  {role.is_system && (
                    <Chip label="System" size="small" color="secondary" sx={{ ml: 1 }} />
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {role.description || 'No description'}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip 
                  label={role.is_system ? 'System' : 'Custom'} 
                  size="small" 
                  color={role.is_system ? 'secondary' : 'primary'} 
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <Badge badgeContent={role.permission_count || 0} color="info">
                  <PermissionIcon />
                </Badge>
              </TableCell>
              <TableCell>
                <Badge badgeContent={role.user_count || 0} color="success">
                  <PeopleIcon />
                </Badge>
              </TableCell>
              <TableCell>
                {role.created_at && formatDistanceToNow(new Date(role.created_at), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <IconButton onClick={(e) => onMenuClick(e, role)}>
                  <MoreIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {roles.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Typography variant="body1" color="text.secondary" py={4}>
                  {search ? `No roles match "${search}"` : 'No roles found'}
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default DatabaseRoles;
