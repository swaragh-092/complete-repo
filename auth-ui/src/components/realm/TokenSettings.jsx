
// admin-ui/src/components/realm/TokenSettings.jsx
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Tooltip,
  IconButton
} from '@mui/material';
import { Save as SaveIcon, Info as InfoIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import api from '../../services/api';

function TokenSettings({ realm, realmName }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [settings, setSettings] = useState({
    ssoSessionIdleTimeout: 1800,
    ssoSessionMaxLifespan: 36000,
    ssoSessionIdleTimeoutRememberMe: 0,
    ssoSessionMaxLifespanRememberMe: 0,
    offlineSessionIdleTimeout: 2592000,
    offlineSessionMaxLifespan: 5184000,
    accessTokenLifespan: 300,
    accessTokenLifespanForImplicitFlow: 900,
    accessCodeLifespan: 60,
    accessCodeLifespanUserAction: 300,
    accessCodeLifespanLogin: 1800,
    actionTokenGeneratedByAdminLifespan: 43200,
    actionTokenGeneratedByUserLifespan: 300,
  });

  useEffect(() => {
    if (realm) {
      setSettings({
        ssoSessionIdleTimeout: realm.ssoSessionIdleTimeout || 1800,
        ssoSessionMaxLifespan: realm.ssoSessionMaxLifespan || 36000,
        ssoSessionIdleTimeoutRememberMe: realm.ssoSessionIdleTimeoutRememberMe || 0,
        ssoSessionMaxLifespanRememberMe: realm.ssoSessionMaxLifespanRememberMe || 0,
        offlineSessionIdleTimeout: realm.offlineSessionIdleTimeout || 2592000,
        offlineSessionMaxLifespan: realm.offlineSessionMaxLifespan || 5184000,
        accessTokenLifespan: realm.accessTokenLifespan || 300,
        accessTokenLifespanForImplicitFlow: realm.accessTokenLifespanForImplicitFlow || 900,
        accessCodeLifespan: realm.accessCodeLifespan || 60,
        accessCodeLifespanUserAction: realm.accessCodeLifespanUserAction || 300,
        accessCodeLifespanLogin: realm.accessCodeLifespanLogin || 1800,
        actionTokenGeneratedByAdminLifespan: realm.actionTokenGeneratedByAdminLifespan || 43200,
        actionTokenGeneratedByUserLifespan: realm.actionTokenGeneratedByUserLifespan || 300,
      });
    }
  }, [realm]);

  const updateMutation = useMutation({
    mutationFn: (updates) => api.patch(`/realms/${realmName}/settings`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['realm', realmName]);
      enqueueSnackbar('Token settings updated successfully', { variant: 'success' });
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || error.message;
      enqueueSnackbar(`Failed to update settings: ${msg}`, { variant: 'error' });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: parseInt(value) || 0 }));
  };

  const renderField = (label, field, tooltip) => (
    <Grid item xs={12} md={6}>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <TextField
          fullWidth
          label={label}
          type="number"
          value={settings[field]}
          onChange={(e) => handleChange(field, e.target.value)}
          InputProps={{
            endAdornment: <Typography variant="caption" color="text.secondary">seconds</Typography>
          }}
        />
        {tooltip && (
          <Tooltip title={tooltip}>
            <IconButton size="small">
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Grid>
  );

  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
        Token Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Session Lifespans</Typography>
              <Grid container spacing={3}>
                {renderField("SSO Session Idle", "ssoSessionIdleTimeout", "Time a session is allowed to be idle before it expires.")}
                {renderField("SSO Session Max", "ssoSessionMaxLifespan", "Max time before a session expires.")}
                {renderField("SSO Session Idle (Remember Me)", "ssoSessionIdleTimeoutRememberMe", "Idle timeout for remember me sessions.")}
                {renderField("SSO Session Max (Remember Me)", "ssoSessionMaxLifespanRememberMe", "Max lifespan for remember me sessions.")}
                {renderField("Offline Session Idle", "offlineSessionIdleTimeout", "Time an offline session is allowed to be idle.")}
                {renderField("Offline Session Max", "offlineSessionMaxLifespan", "Max time before an offline session expires.")}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Token Lifespans</Typography>
              <Grid container spacing={3}>
                {renderField("Access Token Lifespan", "accessTokenLifespan", "Max time before an access token expires.")}
                {renderField("Access Token Lifespan (Implicit)", "accessTokenLifespanForImplicitFlow", "Max time before an implicit flow access token expires.")}
                {renderField("Client Login Timeout", "accessCodeLifespanLogin", "Max time a client has to finish the login protocol.")}
                {renderField("Authorization Code Lifespan", "accessCodeLifespan", "Max time an authorization code is valid.")}
                {renderField("User Action Lifespan", "accessCodeLifespanUserAction", "Max time for user actions like password reset.")}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Action Tokens</Typography>
              <Grid container spacing={3}>
                 {renderField("Admin Action Token", "actionTokenGeneratedByAdminLifespan", "Max time for admin-generated action tokens.")}
                 {renderField("User Action Token", "actionTokenGeneratedByUserLifespan", "Max time for user-generated action tokens.")}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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

export default TokenSettings;
