import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import userService from '../../services/userService';

function UserCredentials({ realmName, userId }) {
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [temporary, setTemporary] = useState(true);

  const resetMutation = useMutation({
    mutationFn: (data) => userService.resetPassword(userId, data, realmName),
    onSuccess: () => {
      enqueueSnackbar('Password reset successfully', { variant: 'success' });
      setOpen(false);
      setPassword('');
      setTemporary(true);
    },
    onError: (err) => {
      enqueueSnackbar(err.message || 'Failed to reset password', { variant: 'error' });
    }
  });

  const handleSubmit = () => {
    resetMutation.mutate({
      newPassword: password,
      temporary
    });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Credentials</Typography>
        <Button variant="outlined" onClick={() => setOpen(true)}>
          Reset Password
        </Button>
      </Box>

      <Alert severity="info">
        Manage user credentials and password resets here.
      </Alert>

      {/* Reset Password Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="New Password"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={temporary}
                  onChange={(e) => setTemporary(e.target.checked)}
                />
              }
              label="Temporary (User must change on next login)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={!password || resetMutation.isPending}
          >
            {resetMutation.isPending ? 'Resetting...' : 'Reset Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UserCredentials;
