
// admin-ui/src/components/realm/AuthenticationSettings.jsx
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import PasswordPolicyManager from '../PasswordPolicyManager';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function AuthenticationSettings({ realm, realmName }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState({
    // Registration
    registrationAllowed: false,
    registrationEmailAsUsername: false,
    verifyEmail: false,
    
    // Login
    rememberMe: false,
    loginWithEmailAllowed: true,
    duplicateEmailsAllowed: false,
    resetPasswordAllowed: true,
    editUsernameAllowed: false,
    
    // Password Policy
    passwordPolicy: '',
  });

  useEffect(() => {
    if (realm) {
      setSettings({
        registrationAllowed: realm.registrationAllowed || false,
        registrationEmailAsUsername: realm.registrationEmailAsUsername || false,
        verifyEmail: realm.verifyEmail || false,
        rememberMe: realm.rememberMe || false,
        loginWithEmailAllowed: realm.loginWithEmailAllowed !== false,
        duplicateEmailsAllowed: realm.duplicateEmailsAllowed || false,
        resetPasswordAllowed: realm.resetPasswordAllowed !== false,
        editUsernameAllowed: realm.editUsernameAllowed || false,
        passwordPolicy: realm.passwordPolicy || '',
      });
    }
  }, [realm]);

  const updateMutation = useMutation({
    mutationFn: (updates) => api.patch(`/realms/${realmName}/settings`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['realm', realmName]);
      enqueueSnackbar('Authentication settings updated successfully', { variant: 'success' });
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || error.message;
      enqueueSnackbar(`Failed to update settings: ${msg}`, { variant: 'error' });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
        Authentication Settings
      </Typography>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tab label="Login & Registration" />
        <Tab label="Password Policy" />
      </Tabs>

      {/* Login & Registration Tab */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Registration</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.registrationAllowed}
                      onChange={(e) => setSettings({ ...settings, registrationAllowed: e.target.checked })}
                    />
                  }
                  label="User Registration"
                  sx={{ mb: 1, display: 'block' }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.registrationEmailAsUsername}
                      onChange={(e) => setSettings({ ...settings, registrationEmailAsUsername: e.target.checked })}
                    />
                  }
                  label="Email as Username"
                  sx={{ mb: 1, display: 'block' }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.verifyEmail}
                      onChange={(e) => setSettings({ ...settings, verifyEmail: e.target.checked })}
                    />
                  }
                  label="Verify Email"
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Login</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.rememberMe}
                      onChange={(e) => setSettings({ ...settings, rememberMe: e.target.checked })}
                    />
                  }
                  label="Remember Me"
                  sx={{ mb: 1, display: 'block' }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.loginWithEmailAllowed}
                      onChange={(e) => setSettings({ ...settings, loginWithEmailAllowed: e.target.checked })}
                    />
                  }
                  label="Login with Email"
                  sx={{ mb: 1, display: 'block' }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.duplicateEmailsAllowed}
                      onChange={(e) => setSettings({ ...settings, duplicateEmailsAllowed: e.target.checked })}
                    />
                  }
                  label="Duplicate Emails Allowed"
                  sx={{ mb: 1, display: 'block' }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.resetPasswordAllowed}
                      onChange={(e) => setSettings({ ...settings, resetPasswordAllowed: e.target.checked })}
                    />
                  }
                  label="Forgot Password"
                  sx={{ mb: 1, display: 'block' }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.editUsernameAllowed}
                      onChange={(e) => setSettings({ ...settings, editUsernameAllowed: e.target.checked })}
                    />
                  }
                  label="Edit Username"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Password Policy Tab */}
      <TabPanel value={activeTab} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Password Policy</Typography>
            <PasswordPolicyManager
              value={settings.passwordPolicy}
              onChange={(policy) => setSettings({ ...settings, passwordPolicy: policy })}
            />
          </CardContent>
        </Card>
      </TabPanel>

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

export default AuthenticationSettings;