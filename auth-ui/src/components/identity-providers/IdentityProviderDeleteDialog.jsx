import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';

function IdentityProviderDeleteDialog({ open, onClose, onConfirm, alias, loading }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Identity Provider?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete the identity provider "{alias}"? This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          color="error" 
          variant="contained" 
          disabled={loading}
        >
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default IdentityProviderDeleteDialog;
