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
  TextField,
} from '@mui/material';
import {
  Add as AddIcon,
  Settings as SettingsIcon,
  Workspaces as WorkspaceIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { getWorkspaces, createWorkspace } from '../../api/workspaces';

export default function OrganizationWorkspaces({ orgId, orgName, userRole }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Check if user can create workspaces (admin or owner)
  const canCreateWorkspace = ['admin', 'owner'].includes(userRole);

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
        {canCreateWorkspace && (
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
            {canCreateWorkspace 
              ? 'Create your first workspace to start collaborating.'
              : 'Ask an organization admin to create a workspace.'}
          </Typography>
          {canCreateWorkspace && (
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
                <TableCell>Actions</TableCell>
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
                  <TableCell>
                    <Tooltip title="Settings">
                      <IconButton size="small">
                        <SettingsIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleWorkspaceCreated}
        orgId={orgId}
      />
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
