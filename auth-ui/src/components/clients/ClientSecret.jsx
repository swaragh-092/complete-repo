import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff, Refresh as RefreshIcon } from '@mui/icons-material';
import clientService from '../../services/clientService';

function ClientSecret({ realmName, clientId }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [showSecret, setShowSecret] = useState(false);

  // Fetch Secret
  const { data: secretData, isLoading, error } = useQuery({
    queryKey: ['client-secret', realmName, clientId],
    queryFn: () => clientService.getClientSecret(clientId, realmName)
  });

  // Regenerate Mutation
  const regenerateMutation = useMutation({
    mutationFn: () => clientService.regenerateClientSecret(clientId, realmName),
    onSuccess: () => {
      queryClient.invalidateQueries(['client-secret', realmName, clientId]);
      enqueueSnackbar('Client secret regenerated successfully', { variant: 'success' });
    },
    onError: (err) => {
      enqueueSnackbar(err.message || 'Failed to regenerate secret', { variant: 'error' });
    }
  });

  if (isLoading) return <CircularProgress />;
  
  // Some clients (public) don't have secrets
  if (error || !secretData) {
    return (
      <Alert severity="info">
        This client does not have a secret (Public Client).
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Credentials</Typography>
      
      <Box display="flex" alignItems="center" gap={2} mt={2}>
        <TextField
          label="Client Secret"
          type={showSecret ? 'text' : 'password'}
          value={secretData.value || secretData.secret || ''}
          fullWidth
          InputProps={{
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowSecret(!showSecret)}
                  edge="end"
                >
                  {showSecret ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        <Button
          variant="contained"
          color="warning"
          startIcon={<RefreshIcon />}
          onClick={() => regenerateMutation.mutate()}
          disabled={regenerateMutation.isPending}
          sx={{ minWidth: 150 }}
        >
          Regenerate
        </Button>
      </Box>
      
      <Alert severity="warning" sx={{ mt: 2 }}>
        Regenerating the secret will invalidate the current one immediately. Applications using the old secret will fail to authenticate.
      </Alert>
    </Box>
  );
}

export default ClientSecret;
