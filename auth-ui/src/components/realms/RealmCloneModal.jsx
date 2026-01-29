import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  DialogContentText
} from '@mui/material';
import realmService from '../../services/realmService';

function RealmCloneModal({ open, onClose, sourceRealm }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [newRealmName, setNewRealmName] = useState('');

  const cloneMutation = useMutation({
    mutationFn: (name) => realmService.cloneRealm(sourceRealm, name),
    onSuccess: () => {
      queryClient.invalidateQueries(['realms']);
      enqueueSnackbar(`Realm cloned successfully to ${newRealmName}`, { variant: 'success' });
      onClose();
      setNewRealmName('');
    },
    onError: (err) => {
      enqueueSnackbar(err.message || 'Failed to clone realm', { variant: 'error' });
    }
  });

  const handleClone = () => {
    if (newRealmName) {
      cloneMutation.mutate(newRealmName);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Clone Realm: {sourceRealm}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Create a new realm with the same configuration as <strong>{sourceRealm}</strong>.
          Users and sessions will NOT be copied.
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          label="New Realm Name"
          fullWidth
          value={newRealmName}
          onChange={(e) => setNewRealmName(e.target.value)}
          error={!!newRealmName && !/^[a-z0-9-_]+$/.test(newRealmName)}
          helperText="Lowercase alphanumeric, hyphens, and underscores only"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={cloneMutation.isPending}>
          Cancel
        </Button>
        <Button 
          onClick={handleClone} 
          variant="contained"
          disabled={!newRealmName || cloneMutation.isPending}
        >
          {cloneMutation.isPending ? 'Cloning...' : 'Clone'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default RealmCloneModal;
