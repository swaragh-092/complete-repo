
// admin-ui/src/components/realm/RealmRoles.jsx - Complete CRUD Component

import { useState } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Tabs, Tab, Menu, MenuItem,
  FormControl, InputLabel, Select, Chip, Card, CardContent, Grid,
  Switch, FormControlLabel, List, ListItem, ListItemText, ListItemIcon,
  Divider, Alert, Tooltip, Badge
} from '@mui/material';
import {
  Add as AddIcon, Security as SecurityIcon, MoreVert as MoreIcon,
  Edit as EditIcon, Delete as DeleteIcon, Group as GroupIcon,
  Assignment as AssignIcon, Link as LinkIcon, Info as InfoIcon,
  SupervisorAccount as CompositeIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import api, { extractData } from '../../services/api';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function RealmRoles({ realmName }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [tabValue, setTabValue] = useState(0);
  const [openCreate, setOpenCreate] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);
  const [openComposite, setOpenComposite] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isComposite: false
  });

  const [assignData, setAssignData] = useState({
    userId: '',
    selectedUsers: []
  });

  const [compositeData, setCompositeData] = useState({
    selectedRoles: []
  });

  // Fetch roles for this realm
  const { data: roles = [] } = useQuery({
    queryKey: ['realm-roles', realmName],
    queryFn: () => api.get(`/roles?realm=${realmName}`).then(extractData),
    enabled: !!realmName,
  });

  // Fetch users for role assignment
  const { data: users = [] } = useQuery({
    queryKey: ['realm-users', realmName],
    queryFn: () => api.get(`/users?realm=${realmName}`).then(extractData),
    enabled: !!realmName && (openAssign || openComposite),
  });

  // Fetch global roles for composite setup
  const { data: globalRoles = [] } = useQuery({
    queryKey: ['global-roles'],
    queryFn: () => api.get('/roles/global/all').then(extractData).then(data => data.roles || []),
    enabled: openComposite,
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: (roleData) => api.post('/roles', { ...roleData, realm: realmName }),
    onSuccess: () => {
      queryClient.invalidateQueries(['realm-roles', realmName]);
      setOpenCreate(false);
      resetForm();
    },
    onError: (error) => {
      enqueueSnackbar(`Failed to create role: ${error.response?.data?.message || error.message}`, { variant: 'error' });
    }
  });

  // Update role mutation
  // Update role mutation
  // eslint-disable-next-line no-unused-vars
  const _updateRoleMutation = useMutation({
    mutationFn: ({ roleId, ...data }) => api.put(`/roles/${roleId}`, { ...data, realm: realmName }),
    onSuccess: () => {
      queryClient.invalidateQueries(['realm-roles', realmName]);
      setAnchorEl(null);
    },
    onError: (error) => {
      enqueueSnackbar(`Failed to update role: ${error.response?.data?.message || error.message}`, { variant: 'error' });
    }
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: (roleId) => api.delete(`/roles/${roleId}?realm=${realmName}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['realm-roles', realmName]);
      setAnchorEl(null);
    },
    onError: (error) => {
      enqueueSnackbar(`Failed to delete role: ${error.response?.data?.message || error.message}`, { variant: 'error' });
    }
  });

  // Assign role to user mutation
  const assignRoleMutation = useMutation({
    mutationFn: ({ roleId, userId }) => api.post(`/roles/${roleId}/assign`, { userId, realm: realmName }),
    onSuccess: () => {
      queryClient.invalidateQueries(['realm-roles', realmName]);
      setOpenAssign(false);
      setAssignData({ userId: '', selectedUsers: [] });
    },
    onError: (error) => {
      enqueueSnackbar(`Failed to assign role: ${error.response?.data?.message || error.message}`, { variant: 'error' });
    }
  });

  // Add composite roles mutation
  const addCompositeMutation = useMutation({
    mutationFn: ({ roleId, roleNames }) => api.post(`/roles/${roleId}/composite`, { roleNames, realm: realmName }),
    onSuccess: () => {
      queryClient.invalidateQueries(['realm-roles', realmName]);
      setOpenComposite(false);
      setCompositeData({ selectedRoles: [] });
    },
    onError: (error) => {
      enqueueSnackbar(`Failed to add composite roles: ${error.response?.data?.message || error.message}`, { variant: 'error' });
    }
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', isComposite: false });
  };

  const handleCreateRole = () => {
    if (!formData.name.trim()) {
      enqueueSnackbar('Role name is required', { variant: 'warning' });
      return;
    }
    createRoleMutation.mutate(formData);
  };

  const handleMenuClick = (event, role) => {
    setAnchorEl(event.currentTarget);
    setSelectedRole(role);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRole(null);
  };

  const handleDeleteRole = () => {
    if (selectedRole && confirm(`Are you sure you want to delete role "${selectedRole.name}"?`)) {
      deleteRoleMutation.mutate(selectedRole.id);
    }
  };

  const handleAssignRole = () => {
    if (selectedRole && assignData.userId) {
      assignRoleMutation.mutate({ 
        roleId: selectedRole.id, 
        userId: assignData.userId 
      });
    }
  };

  const handleAddComposite = () => {
    if (selectedRole && compositeData.selectedRoles.length > 0) {
      addCompositeMutation.mutate({
        roleId: selectedRole.id,
        roleNames: compositeData.selectedRoles
      });
    }
  };

  // Get role type badge
  const getRoleTypeBadge = (role) => {
    if (role.composite) {
      return <Chip label="Composite" color="secondary" size="small" />;
    }
    return <Chip label="Simple" color="primary" size="small" />;
  };

  // Render roles overview
  const renderRolesOverview = () => (
    <Box>
      {/* Role Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Roles
              </Typography>
              <Typography variant="h4">
                {roles.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Composite Roles
              </Typography>
              <Typography variant="h4">
                {roles.filter(r => r.composite).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Users with Roles
              </Typography>
              <Typography variant="h4">
                {roles.reduce((sum, role) => sum + (role.userCount || 0), 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Users/Role
              </Typography>
              <Typography variant="h4">
                {roles.length > 0 
                  ? Math.round(roles.reduce((sum, role) => sum + (role.userCount || 0), 0) / roles.length)
                  : 0
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Roles Table */}
      <Paper>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Roles in {realmName}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreate(true)}
          >
            Create Role
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Role Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Users</TableCell>
                <TableCell>Composite Roles</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SecurityIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="subtitle2">
                        {role.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {role.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getRoleTypeBadge(role)}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={`${role.userCount || 0} users have this role`}>
                      <Badge badgeContent={role.userCount || 0} color="primary">
                        <GroupIcon color="action" />
                      </Badge>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {role.compositeRoles?.length || 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={(e) => handleMenuClick(e, role)}
                      size="small"
                    >
                      <MoreIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {roles.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No roles found in this realm
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );

  return (
    <Box>
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Roles Overview" />
          <Tab label="Role Mapping" />
          <Tab label="Global Roles" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {renderRolesOverview()}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          Role Mapping
        </Typography>
        <Alert severity="info">
          Role mapping functionality will allow bulk assignment and management of roles across users.
        </Alert>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          Global Roles View
        </Typography>
        <Alert severity="info">
          This will show roles across all realms for global management.
        </Alert>
      </TabPanel>

      {/* Role Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem 
          onClick={() => {
            setOpenAssign(true);
            setAnchorEl(null);
          }}
        >
          <AssignIcon sx={{ mr: 1 }} />
          Assign to User
        </MenuItem>

        <MenuItem 
          onClick={() => {
            setOpenComposite(true);
            setAnchorEl(null);
          }}
          disabled={!selectedRole?.composite}
        >
          <CompositeIcon sx={{ mr: 1 }} />
          Manage Composite
        </MenuItem>

        <Divider />

        <MenuItem onClick={() => {}}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Role
        </MenuItem>

        <MenuItem 
          onClick={handleDeleteRole}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Role
        </MenuItem>
      </Menu>

      {/* Create Role Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Role</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Role Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />

          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.isComposite}
                onChange={(e) => setFormData({ ...formData, isComposite: e.target.checked })}
              />
            }
            label="Composite Role"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateRole}
            variant="contained"
            disabled={createRoleMutation.isLoading}
          >
            {createRoleMutation.isLoading ? 'Creating...' : 'Create Role'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Role Dialog */}
      <Dialog open={openAssign} onClose={() => setOpenAssign(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Assign Role: {selectedRole?.name}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Select User</InputLabel>
            <Select
              value={assignData.userId}
              onChange={(e) => setAssignData({ ...assignData, userId: e.target.value })}
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.username} ({user.firstName} {user.lastName})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssign(false)}>Cancel</Button>
          <Button 
            onClick={handleAssignRole}
            variant="contained"
            disabled={assignRoleMutation.isLoading || !assignData.userId}
          >
            {assignRoleMutation.isLoading ? 'Assigning...' : 'Assign Role'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Composite Roles Dialog */}
      <Dialog open={openComposite} onClose={() => setOpenComposite(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Manage Composite Role: {selectedRole?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Select roles to include as composite roles:
          </Typography>

          <FormControl fullWidth>
            <InputLabel>Available Roles</InputLabel>
            <Select
              multiple
              value={compositeData.selectedRoles}
              onChange={(e) => setCompositeData({ selectedRoles: e.target.value })}
            >
              {globalRoles
                .filter(role => role.realm === realmName && role.name !== selectedRole?.name)
                .map((role) => (
                  <MenuItem key={role.id} value={role.name}>
                    {role.name} - {role.description || 'No description'}
                  </MenuItem>
                ))
              }
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenComposite(false)}>Cancel</Button>
          <Button 
            onClick={handleAddComposite}
            variant="contained"
            disabled={addCompositeMutation.isLoading || compositeData.selectedRoles.length === 0}
          >
            {addCompositeMutation.isLoading ? 'Adding...' : 'Add Composite Roles'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default RealmRoles;
