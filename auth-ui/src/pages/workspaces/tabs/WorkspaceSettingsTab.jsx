import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import workspaceService from '../../../services/workspaceService';
import { useWorkspace } from '../../../context/WorkspaceContext';

export default function WorkspaceSettingsTab({ workspace }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshWorkspaces } = useWorkspace();
  const { enqueueSnackbar } = useSnackbar();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (workspace) {
      setFormData({ 
        name: workspace.name || '', 
        description: workspace.description || '' 
      });
    }
  }, [workspace]);

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (data) => workspaceService.update(workspace.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspace', workspace.id]);
      refreshWorkspaces && refreshWorkspaces();
      enqueueSnackbar('Workspace updated successfully', { variant: 'success' });
    },
    onError: (err) => {
      const errorMessage = err.response?.data?.message || 'Failed to update workspace';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: () => workspaceService.delete(workspace.id),
    onSuccess: () => {
      refreshWorkspaces && refreshWorkspaces();
      enqueueSnackbar('Workspace deleted successfully', { variant: 'success' });
      // Navigate back to the organization page
      navigate(workspace.org_id ? `/organizations/${workspace.org_id}` : '/');
    },
    onError: (err) => {
      const errorMessage = err.response?.data?.message || 'Failed to delete workspace';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  });

  const handleSave = (e) => {
    e.preventDefault();
    setError('');
    const hasChanges = formData.name !== workspace.name || formData.description !== workspace.description;
    
    if (!hasChanges) return;
    
    updateMutation.mutate(formData);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* General Settings */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>General Settings</Typography>
            <Divider sx={{ mb: 3 }} />
            
            <form onSubmit={handleSave}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Workspace Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    fullWidth
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    disabled={updateMutation.isLoading || (formData.name === workspace?.name && formData.description === workspace?.description)}
                    startIcon={<SaveIcon />}
                  >
                    {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>

        {/* Danger Zone */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, border: '1px solid', borderColor: 'error.light' }}>
            <Typography variant="h6" color="error" gutterBottom>Danger Zone</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="body2" color="text.secondary" paragraph>
              Deleting a workspace is irreversible. All memberships, resources, and settings associated with this workspace will be permanently deleted.
            </Typography>

            <Button 
              variant="outlined" 
              color="error" 
              fullWidth
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete Workspace
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Workspace?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{workspace?.name}</strong>? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            color="error" 
            variant="contained" 
            onClick={handleDelete}
            disabled={deleteMutation.isLoading}
          >
            {deleteMutation.isLoading ? 'Deleting...' : 'Delete Forever'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
