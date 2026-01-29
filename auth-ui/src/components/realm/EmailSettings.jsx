
// admin-ui/src/components/realm/EmailSettings.jsx
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

function EmailSettings({ realm, realmName }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [settings, setSettings] = useState({
    smtpServer: {
      host: '',
      port: 587,
      from: '',
      ssl: false,
      starttls: true,
      auth: false,
      username: '',
      password: ''
    }
  });

  useEffect(() => {
    if (realm) {
      setSettings({
        smtpServer: realm.smtpServer || {
          host: '',
          port: 587,
          from: '',
          ssl: false,
          starttls: true,
          auth: false,
          username: '',
          password: ''
        }
      });
    }
  }, [realm]);

  const updateMutation = useMutation({
    mutationFn: (updates) => api.patch(`/realms/${realmName}/settings`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['realm', realmName]);
      enqueueSnackbar('Email settings updated successfully', { variant: 'success' });
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
        Email Settings
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>SMTP Configuration</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Host"
                value={settings.smtpServer.host}
                onChange={(e) => setSettings({
                  ...settings,
                  smtpServer: { ...settings.smtpServer, host: e.target.value }
                })}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Port"
                type="number"
                value={settings.smtpServer.port}
                onChange={(e) => setSettings({
                  ...settings,
                  smtpServer: { ...settings.smtpServer, port: parseInt(e.target.value) || 587 }
                })}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="From Email"
                value={settings.smtpServer.from}
                onChange={(e) => setSettings({
                  ...settings,
                  smtpServer: { ...settings.smtpServer, from: e.target.value }
                })}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                value={settings.smtpServer.username}
                onChange={(e) => setSettings({
                  ...settings,
                  smtpServer: { ...settings.smtpServer, username: e.target.value }
                })}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={settings.smtpServer.password}
                onChange={(e) => setSettings({
                  ...settings,
                  smtpServer: { ...settings.smtpServer, password: e.target.value }
                })}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.smtpServer.ssl}
                    onChange={(e) => setSettings({
                      ...settings,
                      smtpServer: { ...settings.smtpServer, ssl: e.target.checked }
                    })}
                  />
                }
                label="Use SSL"
                sx={{ mr: 3 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.smtpServer.starttls}
                    onChange={(e) => setSettings({
                      ...settings,
                      smtpServer: { ...settings.smtpServer, starttls: e.target.checked }
                    })}
                  />
                }
                label="Use STARTTLS"
              />
            </Grid>
          </Grid>
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

export default EmailSettings;