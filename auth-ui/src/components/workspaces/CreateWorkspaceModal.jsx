import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  Alert 
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useUser } from '../../hooks/useUser';

export default function CreateWorkspaceModal({ open, onClose, forcedOrgId = null }) {
  const { createWorkspace } = useWorkspace();
  const { data: user } = useUser();
  const { enqueueSnackbar } = useSnackbar();
  const [formData, setFormData] = useState({ name: '', slug: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset form and error when modal opens
  useEffect(() => {
    if (open) {
      setFormData({ name: '', slug: '', description: '' });
      setError('');
      setLoading(false);
      console.log('[CreateWorkspaceModal] Modal opened with forcedOrgId:', forcedOrgId);
    }
  }, [open, forcedOrgId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
        const newData = { ...prev, [name]: value };
        // Auto-generate slug from name if not manually edited
        if (name === 'name' && !prev.slugIsManuallyEdited) {
            newData.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        }
        return newData;
    });
  };

  const handleSlugChange = (e) => {
      setFormData(prev => ({ ...prev, slug: e.target.value, slugIsManuallyEdited: true }));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Resolve orgId: admin-forced > user's primary org > first membership
    let orgId = null;
    
    // 1. Check forcedOrgId first (admin context from OrganizationDetail page)
    if (forcedOrgId) {
      orgId = forcedOrgId;
      console.log('[CreateWorkspaceModal] Using forcedOrgId:', orgId);
    } 
    // 2. Fallback to user's primary organization
    else if (user?.organizations?.primaryOrganization?.id) {
      orgId = user.organizations.primaryOrganization.id;
      console.log('[CreateWorkspaceModal] Using primaryOrganization:', orgId);
    }
    // 3. Fallback to user's first membership
    else if (user?.organizations?.memberships?.[0]?.orgId) {
      orgId = user.organizations.memberships[0].orgId;
      console.log('[CreateWorkspaceModal] Using first membership:', orgId);
    }
    // 4. Try org_id at root level (some API responses)
    else if (user?.org_id) {
      orgId = user.org_id;
      console.log('[CreateWorkspaceModal] Using user.org_id:', orgId);
    }
    
    if (!orgId) {
      console.error('[CreateWorkspaceModal] No orgId found. forcedOrgId:', forcedOrgId, 'user:', user);
      setError('No active organization found. You must belong to an organization to create a workspace.');
      return;
    }

    setLoading(true);
    try {
      await createWorkspace({
          ...formData,
          org_id: orgId
      });
      enqueueSnackbar('Workspace created successfully!', { variant: 'success' });
      onClose();
      setFormData({ name: '', slug: '', description: '' });
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create workspace';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
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
            type="text"
            fullWidth
            required
            value={formData.name}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="slug"
            label="Workspace ID (Slug)"
            type="text"
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
            type="text"
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
