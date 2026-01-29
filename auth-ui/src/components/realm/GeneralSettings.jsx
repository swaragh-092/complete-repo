
// admin-ui/src/components/realm/GeneralSettings.jsx
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Card,
  CardContent,
  Paper
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import api from '../../services/api';

function GeneralSettings({ realm, realmName }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [settings, setSettings] = useState({
    displayName: '',
    enabled: true,
  });

  useEffect(() => {
    if (realm) {
      setSettings({
        displayName: realm.displayName || '',
        enabled: realm.enabled || false,
      });
    }
  }, [realm]);

  const updateMutation = useMutation({
    mutationFn: (updates) => api.patch(`/realms/${realmName}/settings`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['realm', realmName]);
      enqueueSnackbar('General settings updated successfully', { variant: 'success' });
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || error.message;
      enqueueSnackbar(`Failed to update settings: ${msg}`, { variant: 'error' });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
        General Settings
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Realm Information</Typography>
          <TextField
            fullWidth
            label="Display Name"
            value={settings.displayName}
            onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
            sx={{ mb: 2 }}
            helperText="The name displayed to users in the login screen"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              />
            }
            label="Realm Enabled"
          />
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={updateMutation.isLoading}
        >
          {updateMutation.isLoading ? 'Saving...' : 'Save'}
        </Button>
      </Box>
    </Box>
  );
}

export default GeneralSettings;
