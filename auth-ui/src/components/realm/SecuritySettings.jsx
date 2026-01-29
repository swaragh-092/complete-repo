
// admin-ui/src/components/realm/SecuritySettings.jsx
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import api from '../../services/api';

function SecuritySettings({ realm, realmName }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [settings, setSettings] = useState({
    bruteForceProtected: false,
    permanentLockout: false,
    maxFailureWaitSeconds: 900,
    minimumQuickLoginWaitSeconds: 60,
    waitIncrementSeconds: 60,
    quickLoginCheckMilliSeconds: 1000,
    failureFactor: 30,
  });

  useEffect(() => {
    if (realm) {
      setSettings({
        bruteForceProtected: realm.bruteForceProtected || false,
        permanentLockout: realm.permanentLockout || false,
        maxFailureWaitSeconds: realm.maxFailureWaitSeconds || 900,
        minimumQuickLoginWaitSeconds: realm.minimumQuickLoginWaitSeconds || 60,
        waitIncrementSeconds: realm.waitIncrementSeconds || 60,
        quickLoginCheckMilliSeconds: realm.quickLoginCheckMilliSeconds || 1000,
        failureFactor: realm.failureFactor || 30,
      });
    }
  }, [realm]);

  const updateMutation = useMutation({
    mutationFn: (updates) => api.patch(`/realms/${realmName}/settings`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['realm', realmName]);
      enqueueSnackbar('Security settings updated successfully', { variant: 'success' });
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
        Security Settings
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Brute Force Detection</Typography>
          <FormControlLabel
            control={
              <Switch
                checked={settings.bruteForceProtected}
                onChange={(e) => setSettings({ ...settings, bruteForceProtected: e.target.checked })}
              />
            }
            label="Brute Force Protection"
            sx={{ mb: 2, display: 'block' }}
          />

          {settings.bruteForceProtected && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Max Login Failures"
                  type="number"
                  value={settings.failureFactor}
                  onChange={(e) => setSettings({ ...settings, failureFactor: parseInt(e.target.value) || 30 })}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Wait Increment (seconds)"
                  type="number"
                  value={settings.waitIncrementSeconds}
                  onChange={(e) => setSettings({ ...settings, waitIncrementSeconds: parseInt(e.target.value) || 60 })}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Quick Login Check (ms)"
                  type="number"
                  value={settings.quickLoginCheckMilliSeconds}
                  onChange={(e) => setSettings({ ...settings, quickLoginCheckMilliSeconds: parseInt(e.target.value) || 1000 })}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Min Quick Login Wait (seconds)"
                  type="number"
                  value={settings.minimumQuickLoginWaitSeconds}
                  onChange={(e) => setSettings({ ...settings, minimumQuickLoginWaitSeconds: parseInt(e.target.value) || 60 })}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                 <TextField
                  fullWidth
                  label="Max Failure Wait (seconds)"
                  type="number"
                  value={settings.maxFailureWaitSeconds}
                  onChange={(e) => setSettings({ ...settings, maxFailureWaitSeconds: parseInt(e.target.value) || 900 })}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.permanentLockout}
                      onChange={(e) => setSettings({ ...settings, permanentLockout: e.target.checked })}
                    />
                  }
                  label="Permanent Lockout"
                />
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
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

export default SecuritySettings;