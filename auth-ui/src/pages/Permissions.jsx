
// admin-ui/src/pages/Permissions.jsx
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
  FormControlLabel,
  Switch,
  Alert,
  Tooltip,
  Badge,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  VpnKey as PermissionIcon,
  Security as SecurityIcon,
  Assignment as RoleIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { formatDistanceToNow } from 'date-fns';
import api, { extractData } from '../services/api';
import SearchFilter from '../components/SearchFilter';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function Permissions() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [tabValue, setTabValue] = useState(0);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openBulkCreate, setOpenBulkCreate] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPermission, setSelectedPermission] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    resource: '',
    action: ''
  });
  const [bulkPermissions, setBulkPermissions] = useState('');
  const [search, setSearch] = useState('');

  // Fetch permissions
  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => api.get('/permissions').then(extractData)
  });

  // Client-side search filtering
  const filteredPermissions = permissions.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase()) ||
    p.resource?.toLowerCase().includes(search.toLowerCase())
  );

  // Fetch permission statistics
  const { data: stats = {} } = useQuery({
    queryKey: ['permissions-stats'],
    queryFn: () => api.get('/permissions/stats/overview').then(extractData)
  });

  // Create permission mutation
  const createMutation = useMutation({
    mutationFn: (permissionData) => api.post('/permissions', permissionData),
    onSuccess: () => {
      queryClient.invalidateQueries(['permissions']);
      queryClient.invalidateQueries(['permissions-stats']);
      setOpenCreate(false);
      setFormData({ name: '', description: '', resource: '', action: '' });
    },
    onError: (error) => {
      enqueueSnackbar(`Failed to create permission: ${error.response?.data?.message || error.message}`, { variant: 'error' });
    }
  });

  // Bulk create permissions mutation
  const bulkCreateMutation = useMutation({
    mutationFn: (permissionsData) => api.post('/permissions/bulk', { permissions: permissionsData }),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['permissions']);
      queryClient.invalidateQueries(['permissions-stats']);
      setOpenBulkCreate(false);
      setBulkPermissions('');
      enqueueSnackbar(`Created ${response.data.created} permissions. ${response.data.errors} errors.`, { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(`Failed to bulk create permissions: ${error.response?.data?.message || error.message}`, { variant: 'error' });
    }
  });

  // Update permission mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/permissions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['permissions']);
      setOpenEdit(false);
      setSelectedPermission(null);
    },
    onError: (error) => {
      enqueueSnackbar(`Failed to update permission: ${error.response?.data?.message || error.message}`, { variant: 'error' });
    }
  });

  // Delete permission mutation
  const deleteMutation = useMutation({
    mutationFn: (permissionId) => api.delete(`/permissions/${permissionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['permissions']);
      queryClient.invalidateQueries(['permissions-stats']);
      setAnchorEl(null);
      setSelectedPermission(null);
    },
    onError: (error) => {
      enqueueSnackbar(`Failed to delete permission: ${error.response?.data?.message || error.message}`, { variant: 'error' });
    }
  });

  const handleCreatePermission = () => {
    if (!formData.name) {
      enqueueSnackbar('Permission name is required', { variant: 'warning' });
      return;
    }
    
    // Auto-extract resource and action from name if not provided
    if (!formData.resource || !formData.action) {
      const parts = formData.name.split(':');
      if (parts.length === 2) {
        formData.resource = formData.resource || parts[0];
        formData.action = formData.action || parts[1];
      }
    }
    
    createMutation.mutate(formData);
  };

  const handleBulkCreate = () => {
    if (!bulkPermissions.trim()) {
      enqueueSnackbar('Please enter permissions', { variant: 'warning' });
      return;
    }

    try {
      const lines = bulkPermissions.split('\n').filter(line => line.trim());
      const permissionsData = lines.map(line => {
        const [name, description] = line.split(',').map(part => part.trim());
        const parts = name.split(':');
        return {
          name,
          description: description || '',
          resource: parts[0] || '',
          action: parts[1] || ''
        };
      });

      bulkCreateMutation.mutate(permissionsData);
    } catch {
      enqueueSnackbar('Invalid bulk format. Please use "permission:name, description" per line', { variant: 'error' });
    }
  };

  const handleEditPermission = () => {
    if (!formData.name) {
      enqueueSnackbar('Permission name is required', { variant: 'warning' });
      return;
    }
    updateMutation.mutate({ id: selectedPermission.id, ...formData });
  };

  const handleMenuClick = (event, permission) => {
    setAnchorEl(event.currentTarget);
    setSelectedPermission(permission);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPermission(null);
  };

  const handleEditClick = () => {
    setFormData({
      name: selectedPermission.name,
      description: selectedPermission.description || '',
      resource: selectedPermission.resource || '',
      action: selectedPermission.action || ''
    });
    setOpenEdit(true);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    if (confirm(`Are you sure you want to delete "${selectedPermission.name}"?`)) {
      deleteMutation.mutate(selectedPermission.id);
    }
  };

  const groupedByResource = permissions.reduce((acc, permission) => {
    const resource = permission.resource || 'uncategorized';
    if (!acc[resource]) acc[resource] = [];
    acc[resource].push(permission);
    return acc;
  }, {});

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, margin: '0 auto' }}>
      {/* Header */}
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} gap={2} mb={3}>
        <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
          Permissions Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setOpenBulkCreate(true)}
            sx={{ mr: 2 }}
          >
            Bulk Create
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreate(true)}
          >
            Create Permission
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PermissionIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h4">{stats.total_permissions || 0}</Typography>
                  <Typography color="text.secondary">Total Permissions</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <SecurityIcon sx={{ mr: 2, color: 'success.main' }} />
                <Box>
                  <Typography variant="h4">{stats.system_permissions || 0}</Typography>
                  <Typography color="text.secondary">System Permissions</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <LockIcon sx={{ mr: 2, color: 'info.main' }} />
                <Box>
                  <Typography variant="h4">{stats.custom_permissions || 0}</Typography>
                  <Typography color="text.secondary">Custom Permissions</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <RoleIcon sx={{ mr: 2, color: 'warning.main' }} />
                <Box>
                  <Typography variant="h4">{Object.keys(groupedByResource).length}</Typography>
                  <Typography color="text.secondary">Resources</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
        <Tab label="All Permissions" />
        <Tab label="By Resource" />
        <Tab label="System Only" />
      </Tabs>

      {/* Search */}
      <Paper sx={{ mb: 3, p: 2 }} elevation={0}>
        <SearchFilter
          onSearch={setSearch}
          placeholder="Search permissions by name, resource, or description..."
          initialValue={search}
        />
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <PermissionsTable 
          permissions={filteredPermissions} 
          onMenuClick={handleMenuClick}
          isLoading={isLoading}
          search={search}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box>
          {Object.entries(groupedByResource).map(([resource, resourcePermissions]) => (
            <Box key={resource} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, textTransform: 'capitalize' }}>
                {resource} ({resourcePermissions.length})
              </Typography>
              <PermissionsTable 
                permissions={resourcePermissions}
                onMenuClick={handleMenuClick}
                isLoading={isLoading}
                hideResource
              />
            </Box>
          ))}
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <PermissionsTable 
          permissions={filteredPermissions.filter(p => p.is_system)} 
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
          Edit Permission
        </MenuItem>
        {!selectedPermission?.is_system && (
          <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} />
            Delete Permission
          </MenuItem>
        )}
      </Menu>

      {/* Create Permission Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Permission</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Permission Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., users:read, orders:create"
            helperText="Format: resource:action"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Resource"
            fullWidth
            variant="outlined"
            value={formData.resource}
            onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
            placeholder="e.g., users, orders, products"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Action"
            fullWidth
            variant="outlined"
            value={formData.action}
            onChange={(e) => setFormData({ ...formData, action: e.target.value })}
            placeholder="e.g., read, create, update, delete"
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button onClick={handleCreatePermission} variant="contained" disabled={createMutation.isLoading}>
            {createMutation.isLoading ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Permission Dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Permission</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Permission Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={selectedPermission?.is_system}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Resource"
            fullWidth
            variant="outlined"
            value={formData.resource}
            onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Action"
            fullWidth
            variant="outlined"
            value={formData.action}
            onChange={(e) => setFormData({ ...formData, action: e.target.value })}
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button onClick={handleEditPermission} variant="contained" disabled={updateMutation.isLoading}>
            {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Create Dialog */}
      <Dialog open={openBulkCreate} onClose={() => setOpenBulkCreate(false)} maxWidth="md" fullWidth>
        <DialogTitle>Bulk Create Permissions</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Enter permissions one per line in format: "permission:name, description"
            <br />
            Example: users:read, Read user information
          </Alert>
          <TextField
            autoFocus
            margin="dense"
            label="Permissions"
            fullWidth
            multiline
            rows={8}
            variant="outlined"
            value={bulkPermissions}
            onChange={(e) => setBulkPermissions(e.target.value)}
            placeholder={`users:read, Read user information
users:create, Create new users
users:update, Update user information
users:delete, Delete users
orders:read, View orders
orders:create, Create new orders`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBulkCreate(false)}>Cancel</Button>
          <Button onClick={handleBulkCreate} variant="contained" disabled={bulkCreateMutation.isLoading}>
            {bulkCreateMutation.isLoading ? 'Creating...' : 'Bulk Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function PermissionsTable({ permissions, onMenuClick, isLoading, hideResource = false, search }) {
  if (isLoading) {
    return <Typography>Loading permissions...</Typography>;
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            {!hideResource && <TableCell>Resource</TableCell>}
            <TableCell>Action</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Roles</TableCell>
            <TableCell>Created</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {permissions.map((permission) => (
            <TableRow key={permission.id}>
              <TableCell>
                <Box display="flex" alignItems="center">
                  <PermissionIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body1" fontWeight="medium">
                    {permission.name}
                  </Typography>
                </Box>
              </TableCell>
              {!hideResource && (
                <TableCell>
                  <Chip 
                    label={permission.resource || 'N/A'} 
                    size="small" 
                    variant="outlined" 
                    color="primary"
                  />
                </TableCell>
              )}
              <TableCell>
                <Chip 
                  label={permission.action || 'N/A'} 
                  size="small" 
                  variant="outlined" 
                  color="secondary"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {permission.description || 'No description'}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip 
                  label={permission.is_system ? 'System' : 'Custom'} 
                  size="small" 
                  color={permission.is_system ? 'secondary' : 'primary'} 
                  variant={permission.is_system ? 'filled' : 'outlined'}
                />
              </TableCell>
              <TableCell>
                <Badge badgeContent={permission.role_count || 0} color="info">
                  <RoleIcon />
                </Badge>
              </TableCell>
              <TableCell>
                {permission.created_at && formatDistanceToNow(new Date(permission.created_at), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <IconButton onClick={(e) => onMenuClick(e, permission)}>
                  <MoreIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {permissions.length === 0 && (
            <TableRow>
              <TableCell colSpan={hideResource ? 7 : 8} align="center">
                <Typography variant="body1" color="text.secondary" py={4}>
                  {search ? `No permissions match "${search}"` : 'No permissions found'}
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default Permissions;
