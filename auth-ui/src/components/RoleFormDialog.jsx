import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button
} from '@mui/material';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import api from '../services/api';

function RoleFormDialog({ open, onClose, roleType, selectedClient, onSuccess }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [formData, setFormData] = useState({ name: '', description: '' });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post(
        roleType === 'realm'
          ? '/roles/realm'
          : `/roles/client/${selectedClient}`,
         {
            roleName: formData.name,
            description: formData.description,
          }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries(['roles', roleType, selectedClient]);
      setFormData({ name: '', description: '' });
      onSuccess?.();
    },
  });

  const handleSubmit = () => {
    if (!formData.name) {
      enqueueSnackbar('Role name is required', { variant: 'warning' });
      return;
    }
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create Role</DialogTitle>
      <DialogContent>
        <TextField
          label="Role Name"
          fullWidth
          margin="normal"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
        />
        <TextField
          label="Description"
          fullWidth
          margin="normal"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default RoleFormDialog;
