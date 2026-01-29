import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
  Typography,
  Avatar
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import api, { extractData } from '../../services/api'; // Direct API usage for org memberships
import workspaceService from '../../services/workspaceService';

export default function AddMemberModal({ open, onClose, workspaceId, orgId, existingMemberIds = [] }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [formData, setFormData] = useState({ userId: '', role: 'viewer' });
  const [error, setError] = useState('');

  // Fetch Organization Members
  const { data: orgMemberships = [], isLoading } = useQuery({
    queryKey: ['org-members', orgId],
    queryFn: () => api.get(`/organization-memberships?org_id=${orgId}`).then(extractData),
    enabled: !!orgId && open
  });

  // Filter out existing workspace members
  // orgMemberships structure: { user: { id, email }, role: ... }
  const availableMembers = orgMemberships.filter(
      m => !existingMemberIds.includes(m.user.id)
  );

  const addMutation = useMutation({
    mutationFn: (data) => workspaceService.addMember(workspaceId, { user_id: data.userId, role: data.role }),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspace-members', workspaceId]);
      enqueueSnackbar('Member added successfully', { variant: 'success' });
      onClose();
      setFormData({ userId: '', role: 'viewer' });
    },
    onError: (err) => {
      const errorMessage = err.response?.data?.message || 'Failed to add member';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  });

  const handleSubmit = () => {
      if (!formData.userId) return;
      addMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Member to Workspace</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
            <InputLabel>Select User from Organization</InputLabel>
            <Select
                value={formData.userId}
                label="Select User from Organization"
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
            >
                {isLoading ? (
                    <MenuItem disabled>Loading members...</MenuItem>
                ) : availableMembers.length === 0 ? (
                    <MenuItem disabled>No eligible members found</MenuItem>
                ) : (
                    availableMembers.map((m) => (
                        <MenuItem key={m.user.id} value={m.user.id}>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: 12 }}>
                                {(m.user.email || '?').charAt(0).toUpperCase()}
                            </Avatar>
                            {m.user.email}
                          </Box>
                        </MenuItem>
                    ))
                )}
            </Select>
        </FormControl>

        <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
                value={formData.role}
                label="Role"
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
                <MenuItem value="viewer">Viewer</MenuItem>
                <MenuItem value="editor">Editor</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
            </Select>
        </FormControl>

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={addMutation.isLoading || !formData.userId}
        >
            {addMutation.isLoading ? 'Adding...' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
