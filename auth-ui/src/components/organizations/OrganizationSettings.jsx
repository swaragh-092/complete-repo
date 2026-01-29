// auth-ui/src/components/organizations/OrganizationSettings.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api, { extractData } from '../../services/api';

export default function OrganizationSettings({ organization }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active'
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        description: organization.description || '',
        status: organization.status || 'active'
      });
    }
  }, [organization]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data) => api.put(`/organizations/${organization.id}`, data).then(extractData),
    onSuccess: () => {
      queryClient.invalidateQueries(['organization', organization.id]);
      setSuccess('Organization updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to update organization')
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/organizations/${organization.id}`).then(extractData),
    onSuccess: () => {
      navigate('/organizations');
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to delete organization')
  });

  const handleSave = (e) => {
    e.preventDefault();
    setError('');
    updateMutation.mutate(formData);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

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
                    label="Organization Name"
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
                <Grid item xs={12}>
                  <TextField
                    label="Tenant ID"
                    value={organization?.tenant_id || ''}
                    fullWidth
                    disabled
                    helperText="Tenant ID cannot be changed"
                  />
                </Grid>
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    disabled={updateMutation.isLoading}
                    startIcon={<SaveIcon />}
                  >
                    {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>

        {/* Info Panel */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Organization Info</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">ID</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {organization?.id}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Created At</Typography>
                <Typography variant="body2">
                  {organization?.created_at ? new Date(organization.created_at).toLocaleString() : '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Typography variant="body2">{organization?.status || 'active'}</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Danger Zone */}
          <Paper sx={{ p: 3, border: '1px solid', borderColor: 'error.light' }}>
            <Typography variant="h6" color="error" gutterBottom>Danger Zone</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="body2" color="text.secondary" paragraph>
              Deleting an organization will remove all associated workspaces, memberships, and data.
            </Typography>

            <Button 
              variant="outlined" 
              color="error" 
              fullWidth
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete Organization
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Organization?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{organization?.name}</strong>? 
            This will remove all workspaces and memberships. This action cannot be undone.
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
