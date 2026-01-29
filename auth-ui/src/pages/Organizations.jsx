
// admin-ui/src/pages/Organizations.jsx
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
  Card,
  CardContent,
  Grid,
  Alert,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { formatDistanceToNow } from 'date-fns';
import api, { extractData } from '../services/api';
import { useNavigate } from 'react-router-dom';
import SearchFilter from '../components/SearchFilter';

function Organizations() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    tenant_id: ''
  });
  const [search, setSearch] = useState('');

  // Fetch organizations
  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => api.get('/organizations').then(extractData)
  });

  // Client-side search filtering
  const filteredOrganizations = organizations.filter(org =>
    org.name?.toLowerCase().includes(search.toLowerCase()) ||
    org.tenant_id?.toLowerCase().includes(search.toLowerCase())
  );

  // Create organization mutation
  const createMutation = useMutation({
    mutationFn: (orgData) => api.post('/organizations', orgData),
    onSuccess: () => {
      queryClient.invalidateQueries(['organizations']);
      setOpenCreate(false);
      setFormData({ name: '', tenant_id: '' });
    },
    onError: (error) => {
      enqueueSnackbar(`Failed to create organization: ${error.response?.data?.message || error.message}`, { variant: 'error' });
    }
  });

  // Update organization mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/organizations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['organizations']);
      setOpenEdit(false);
      setSelectedOrg(null);
    },
    onError: (error) => {
      enqueueSnackbar(`Failed to update organization: ${error.response?.data?.message || error.message}`, { variant: 'error' });
    }
  });

  // Delete organization mutation
  const deleteMutation = useMutation({
    mutationFn: (orgId) => api.delete(`/organizations/${orgId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['organizations']);
      setAnchorEl(null);
      setSelectedOrg(null);
    },
    onError: (error) => {
      enqueueSnackbar(`Failed to delete organization: ${error.response?.data?.message || error.message}`, { variant: 'error' });
    }
  });

  const handleCreateOrg = () => {
    if (!formData.name) {
      enqueueSnackbar('Organization name is required', { variant: 'warning' });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEditOrg = () => {
    if (!formData.name) {
      enqueueSnackbar('Organization name is required', { variant: 'warning' });
      return;
    }
    updateMutation.mutate({ id: selectedOrg.id, ...formData });
  };

  const handleMenuClick = (event, org) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrg(org);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrg(null);
  };

  const handleEditClick = () => {
    setFormData({
      name: selectedOrg.name,
      tenant_id: selectedOrg.tenant_id || ''
    });
    setOpenEdit(true);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    if (confirm(`Are you sure you want to delete "${selectedOrg.name}"?`)) {
      deleteMutation.mutate(selectedOrg.id);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, margin: '0 auto' }}>
      {/* Header */}
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} gap={2} mb={3}>
        <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
          Organizations
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreate(true)}
        >
          Create Organization
        </Button>
      </Box>

      {/* Search */}
      <Paper sx={{ mb: 3, p: 2 }} elevation={0}>
        <SearchFilter
          onSearch={setSearch}
          placeholder="Search organizations by name or tenant..."
          initialValue={search}
        />
      </Paper>

      {/* Organizations Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Tenant ID</TableCell>
              <TableCell>Members</TableCell>
              <TableCell>Primary Users</TableCell>
              <TableCell>Total Users</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrganizations.map((org) => (
              <TableRow key={org.id}>
                <TableCell>
                  <Box
                    display="flex"
                    alignItems="center"
                    sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                    onClick={() => navigate(`/organizations/${org.id}`)}
                  >
                    <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body1" fontWeight="medium">
                      {org.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {org.tenant_id ? (
                    <Chip label={org.tenant_id} size="small" variant="outlined" />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No tenant
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Badge badgeContent={org.member_count || 0} color="primary">
                    <PeopleIcon />
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge badgeContent={org.primary_user_count || 0} color="secondary">
                    <PeopleIcon />
                  </Badge>
                </TableCell>
                <TableCell>
                  <Typography variant="body1" fontWeight="medium">
                    {org.total_users || 0}
                  </Typography>
                </TableCell>
                <TableCell>
                  {org.created_at && formatDistanceToNow(new Date(org.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  <IconButton onClick={(e) => handleMenuClick(e, org)}>
                    <MoreIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredOrganizations.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body1" color="text.secondary" py={4}>
                    {search ? `No organizations match "${search}"` : 'No organizations found'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditClick}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Organization
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Organization
        </MenuItem>
      </Menu>

      {/* Create Organization Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Organization</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Organization Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Tenant ID (Optional)"
            fullWidth
            variant="outlined"
            value={formData.tenant_id}
            onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
            helperText="Optional tenant identifier for multi-tenancy"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button onClick={handleCreateOrg} variant="contained" disabled={createMutation.isLoading}>
            {createMutation.isLoading ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Organization Dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Organization</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Organization Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Tenant ID (Optional)"
            fullWidth
            variant="outlined"
            value={formData.tenant_id}
            onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
            helperText="Optional tenant identifier for multi-tenancy"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button onClick={handleEditOrg} variant="contained" disabled={updateMutation.isLoading}>
            {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Organizations;
