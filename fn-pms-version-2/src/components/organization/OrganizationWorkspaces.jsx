/**
 * @fileoverview Organization Workspaces Component
 * @description List and manage workspaces within an organization
 * @matches centalized-login MUI styling
 */

import { useState, useEffect } from 'react';
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
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Settings as SettingsIcon,
  Workspaces as WorkspaceIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  SwapHoriz as SwitchIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { getWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace, setCurrentWorkspace } from '../../api/workspaces';

export default function OrganizationWorkspaces({ orgId, orgName, userRole }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);

  // Role-based permissions
  const canManageWorkspaces = ['admin', 'owner'].includes(userRole);
  const canSwitchWorkspace = true; // All roles can switch

  useEffect(() => {
    if (orgId) {
      fetchWorkspaces();
    }
  }, [orgId]);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWorkspaces(orgId);
      setWorkspaces(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkspaceCreated = () => {
    fetchWorkspaces();
    setCreateModalOpen(false);
  };

  const handleWorkspaceUpdated = () => {
    fetchWorkspaces();
    setEditModalOpen(false);
    setSelectedWorkspace(null);
  };

  const handleDeleteWorkspace = async () => {
    if (!selectedWorkspace) return;
    
    try {
      await deleteWorkspace(selectedWorkspace.id);
      fetchWorkspaces();
      setDeleteDialogOpen(false);
      setSelectedWorkspace(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete workspace');
    }
  };

  const handleSwitchWorkspace = (workspace) => {
    setCurrentWorkspace(workspace);
    // Optionally trigger a page reload or context update
    window.location.reload();
  };

  const openActionMenu = (event, workspace) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedWorkspace(workspace);
  };

  const closeActionMenu = () => {
    setActionMenuAnchor(null);
  };

  const handleEditClick = () => {
    closeActionMenu();
    setEditModalOpen(true);
  };

  const handleDeleteClick = () => {
    closeActionMenu();
    setDeleteDialogOpen(true);
  };

  const handleSwitchClick = () => {
    closeActionMenu();
    if (selectedWorkspace) {
      handleSwitchWorkspace(selectedWorkspace);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Workspaces in {orgName}
        </Typography>
        {canManageWorkspaces && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Workspace
          </Button>
        )}
      </Box>

      {/* Empty State */}
      {workspaces.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <WorkspaceIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No workspaces yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {canManageWorkspaces 
              ? 'Create your first workspace to start collaborating.'
              : 'Ask an organization admin to create a workspace.'}
          </Typography>
          {canManageWorkspaces && (
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setCreateModalOpen(true)}>
              Create Workspace
            </Button>
          )}
        </Paper>
      ) : (
        /* Workspace Table */
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Members</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workspaces.map((workspace) => (
                <TableRow key={workspace.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WorkspaceIcon color="primary" fontSize="small" />
                      <Typography fontWeight={500}>{workspace.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={workspace.slug} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{workspace.member_count || 0}</TableCell>
                  <TableCell>
                    {workspace.created_at && formatDistanceToNow(new Date(workspace.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Actions">
                      <IconButton 
                        size="small" 
                        onClick={(e) => openActionMenu(e, workspace)}
                      >
                        <MoreIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={closeActionMenu}
        PaperProps={{ sx: { minWidth: 180 } }}
      >
        {canSwitchWorkspace && (
          <MenuItem onClick={handleSwitchClick}>
            <ListItemIcon><SwitchIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Switch to Workspace</ListItemText>
          </MenuItem>
        )}
        {canManageWorkspaces && (
          <MenuItem onClick={handleEditClick}>
            <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        )}
        {canManageWorkspaces && (
          <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleWorkspaceCreated}
        orgId={orgId}
      />

      {/* Edit Workspace Modal */}
      <EditWorkspaceModal
        open={editModalOpen}
        onClose={() => { setEditModalOpen(false); setSelectedWorkspace(null); }}
        onUpdated={handleWorkspaceUpdated}
        workspace={selectedWorkspace}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Workspace</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{selectedWorkspace?.name}</strong>? 
            This action cannot be undone and all workspace data will be permanently lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteWorkspace} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Create Workspace Modal Component
function CreateWorkspaceModal({ open, onClose, onCreated, orgId }) {
  const [formData, setFormData] = useState({ name: '', slug: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Auto-generate slug from name
      if (name === 'name' && !prev.slugManuallyEdited) {
        newData.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }
      return newData;
    });
  };

  const handleSlugChange = (e) => {
    setFormData(prev => ({ ...prev, slug: e.target.value, slugManuallyEdited: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createWorkspace({
        ...formData,
        org_id: orgId
      });
      setFormData({ name: '', slug: '', description: '' });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create New Workspace</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Workspace Name"
            fullWidth
            required
            value={formData.name}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="slug"
            label="Workspace ID (Slug)"
            fullWidth
            required
            helperText="Unique identifier (e.g. my-team)"
            value={formData.slug}
            onChange={handleSlugChange}
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={formData.description}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// Edit Workspace Modal Component
function EditWorkspaceModal({ open, onClose, onUpdated, workspace }) {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (workspace) {
      setFormData({
        name: workspace.name || '',
        description: workspace.description || ''
      });
    }
  }, [workspace]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!workspace) return;
    
    setError('');
    setLoading(true);

    try {
      await updateWorkspace(workspace.id, formData);
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit Workspace</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Workspace Name"
            fullWidth
            required
            value={formData.name}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            label="Workspace Slug"
            fullWidth
            disabled
            value={workspace?.slug || ''}
            helperText="Slug cannot be changed"
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={formData.description}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
