/**
 * @fileoverview Realm Detail Page - SUPERADMIN VERSION
 * @description Full control over all realm settings with warnings for critical changes
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// checking if useQueryClient is used. I replaced it in onSuccess.
// useSnackbar also replaced.
// So:
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; -> Remove
// import { useSnackbar } from 'notistack'; -> Remove
// BUT useQueryClient might be used if I didn't clean up all usages?
// I replaced `const queryClient = useQueryClient()` usage in onSuccess.
// I will comment them out or remove them.

import { useForm, Controller } from 'react-hook-form';
import {
  Box, Paper, Typography, Tabs, Tab, Button, TextField, Switch,
  FormControlLabel, Grid, Divider, Chip, Alert, Skeleton,
  Accordion, AccordionSummary, AccordionDetails, InputAdornment,
  Select, MenuItem, FormControl, InputLabel, FormHelperText,
  Stack, Card, CardContent, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, Tooltip, List, ListItem, ListItemText, 
  Checkbox, useTheme, Fade, 
} from '@mui/material';
import {
  ArrowBack, Save, Refresh, ExpandMore, Schedule,
  Email, Lock, Language, Verified, Palette,
  Settings as SettingsIcon, Warning, Add, Delete,
  Info, People, Apps, Fingerprint, Assessment,
  AdminPanelSettings as SecurityIcon,  AdminPanelSettings as Security
} from '@mui/icons-material';
import { useRealm, useUpdateRealm } from '../hooks/useRealm';

import LoadingSpinner from '../components/LoadingSpinner';
import { parsePasswordPolicy, buildPasswordPolicy } from '../utils/policyUtils';
import GeneralTab from './realms/tabs/GeneralTab';
import LoginTab from './realms/tabs/LoginTab';
import SecurityTab from './realms/tabs/SecurityTab';
import TokensTab from './realms/tabs/TokensTab';
import SMTPTab from './realms/tabs/SMTPTab';

function TabPanel({ children, value, index }) {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ overflow: 'hidden' }}>
      {value === index && <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, overflow: 'auto' }}>{children}</Box>}
    </Box>
  );
}

function RealmDetail() {
  const { realmName } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [showCriticalWarning, setShowCriticalWarning] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(null);

  // Password policy state
  const [passwordPolicy, setPasswordPolicy] = useState({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireDigit: true,
    requireSpecial: true,
    notUsername: true,
    notEmail: true,
    passwordHistory: 3
  });
  
  // Track if password policy was modified
  const [isPasswordPolicyDirty, setIsPasswordPolicyDirty] = useState(false);
  
  // Wrapper to track dirty state when password policy changes
  const updatePasswordPolicy = (updates) => {
    setPasswordPolicy(prev => ({ ...prev, ...updates }));
    setIsPasswordPolicyDirty(true);
  };

  // SMTP state
  const [smtpConfig, setSmtpConfig] = useState({
    host: '',
    port: '587',
    from: '',
    fromDisplayName: '',
    replyTo: '',
    replyToDisplayName: '',
    auth: true,
    ssl: false,
    starttls: true,
    user: '',
    password: ''
  });

  // Fetch realm settings
  const { data: realm, isLoading, refetch, error } = useRealm(realmName, {
    onSuccess: (data) => {
      // Parse password policy
      if (data.passwordPolicy) {
        const policy = parsePasswordPolicy(data.passwordPolicy);
        setPasswordPolicy(policy);
      }

      // Load SMTP config
      if (data.smtpServer) {
        setSmtpConfig({
          host: data.smtpServer.host || '',
          port: data.smtpServer.port || '587',
          from: data.smtpServer.from || '',
          fromDisplayName: data.smtpServer.fromDisplayName || '',
          replyTo: data.smtpServer.replyTo || '',
          replyToDisplayName: data.smtpServer.replyToDisplayName || '',
          auth: data.smtpServer.auth === 'true',
          ssl: data.smtpServer.ssl === 'true',
          starttls: data.smtpServer.starttls === 'true',
          user: data.smtpServer.user || '',
          password: '' // Don't show existing password
        });
      }
    }
  });

  // Form setup
  const { control, handleSubmit, formState: { errors, isDirty }, watch } = useForm({
    values: realm || {},
    mode: 'onChange'
  });

  const bruteForceEnabled = watch('bruteForceProtected');

  // Update mutation
  const updateMutation = useUpdateRealm({
    onSuccess: () => {
      // Clean up UI state after successful update
      setShowCriticalWarning(false);
      setPendingChanges(null);
      setIsPasswordPolicyDirty(false);
    }
  });

  // Check if changes are critical
  const isCriticalChange = (data) => {
    const criticalFields = ['enabled', 'sslRequired', 'bruteForceProtected', 'passwordPolicy', 'smtpServer'];
    return criticalFields.some(field => data[field] !== undefined);
  };

  const onSubmit = (data) => {
  // Build update payload - ONLY send fields that Keycloak accepts for updates
  const updateData = {};
  
  // Basic settings
  if (data.displayName !== realm?.displayName) {
    updateData.displayName = data.displayName || data.display_name;
  }
  
  if (data.enabled !== realm?.enabled) {
    updateData.enabled = data.enabled;
  }
  
  if (data.sslRequired !== realm?.sslRequired) {
    updateData.sslRequired = data.sslRequired;
  }
  
  // Login settings
  if (data.registrationAllowed !== realm?.registrationAllowed) {
    updateData.registrationAllowed = data.registrationAllowed;
  }
  
  if (data.registrationEmailAsUsername !== realm?.registrationEmailAsUsername) {
    updateData.registrationEmailAsUsername = data.registrationEmailAsUsername;
  }
  
  if (data.verifyEmail !== realm?.verifyEmail) {
    updateData.verifyEmail = data.verifyEmail;
  }
  
  if (data.loginWithEmailAllowed !== realm?.loginWithEmailAllowed) {
    updateData.loginWithEmailAllowed = data.loginWithEmailAllowed;
  }
  
  if (data.duplicateEmailsAllowed !== realm?.duplicateEmailsAllowed) {
    updateData.duplicateEmailsAllowed = data.duplicateEmailsAllowed;
  }
  
  if (data.resetPasswordAllowed !== realm?.resetPasswordAllowed) {
    updateData.resetPasswordAllowed = data.resetPasswordAllowed;
  }
  
  if (data.rememberMe !== realm?.rememberMe) {
    updateData.rememberMe = data.rememberMe;
  }
  
  if (data.editUsernameAllowed !== realm?.editUsernameAllowed) {
    updateData.editUsernameAllowed = data.editUsernameAllowed;
  }
  
  // Security settings
  if (data.bruteForceProtected !== realm?.bruteForceProtected) {
    updateData.bruteForceProtected = data.bruteForceProtected;
  }
  
  if (data.permanentLockout !== realm?.permanentLockout) {
    updateData.permanentLockout = data.permanentLockout;
  }
  
  if (data.failureFactor !== realm?.failureFactor) {
    updateData.failureFactor = parseInt(data.failureFactor);
  }
  
  if (data.maxFailureWaitSeconds !== realm?.maxFailureWaitSeconds) {
    updateData.maxFailureWaitSeconds = parseInt(data.maxFailureWaitSeconds);
  }
  
  if (data.minimumQuickLoginWaitSeconds !== realm?.minimumQuickLoginWaitSeconds) {
    updateData.minimumQuickLoginWaitSeconds = parseInt(data.minimumQuickLoginWaitSeconds);
  }
  
  if (data.waitIncrementSeconds !== realm?.waitIncrementSeconds) {
    updateData.waitIncrementSeconds = parseInt(data.waitIncrementSeconds);
  }
  
  // Token settings
  if (data.accessTokenLifespan !== realm?.accessTokenLifespan) {
    updateData.accessTokenLifespan = parseInt(data.accessTokenLifespan);
  }
  
  if (data.ssoSessionIdleTimeout !== realm?.ssoSessionIdleTimeout) {
    updateData.ssoSessionIdleTimeout = parseInt(data.ssoSessionIdleTimeout);
  }
  
  if (data.ssoSessionMaxLifespan !== realm?.ssoSessionMaxLifespan) {
    updateData.ssoSessionMaxLifespan = parseInt(data.ssoSessionMaxLifespan);
  }
  
  if (data.offlineSessionIdleTimeout !== realm?.offlineSessionIdleTimeout) {
    updateData.offlineSessionIdleTimeout = parseInt(data.offlineSessionIdleTimeout);
  }
  
  if (data.accessCodeLifespan !== realm?.accessCodeLifespan) {
    updateData.accessCodeLifespan = parseInt(data.accessCodeLifespan);
  }
  
  if (data.accessCodeLifespanUserAction !== realm?.accessCodeLifespanUserAction) {
    updateData.accessCodeLifespanUserAction = parseInt(data.accessCodeLifespanUserAction);
  }
  
  if (data.accessCodeLifespanLogin !== realm?.accessCodeLifespanLogin) {
    updateData.accessCodeLifespanLogin = parseInt(data.accessCodeLifespanLogin);
  }
  
  // Internationalization
  if (data.internationalizationEnabled !== realm?.internationalizationEnabled) {
    updateData.internationalizationEnabled = data.internationalizationEnabled;
  }
  
  // Password policy - always include if changed
  const currentPolicy = buildPasswordPolicy(passwordPolicy);
  if (currentPolicy !== realm?.passwordPolicy) {
    updateData.passwordPolicy = currentPolicy;
  }
  
  // SMTP server - only include if host is provided
  if (smtpConfig.host && smtpConfig.host.trim()) {
    updateData.smtpServer = {
      host: smtpConfig.host,
      port: String(smtpConfig.port),
      from: smtpConfig.from,
      fromDisplayName: smtpConfig.fromDisplayName,
      replyTo: smtpConfig.replyTo || smtpConfig.from,
      replyToDisplayName: smtpConfig.replyToDisplayName || smtpConfig.fromDisplayName,
      auth: String(smtpConfig.auth),
      ssl: String(smtpConfig.ssl),
      starttls: String(smtpConfig.starttls),
      user: smtpConfig.user,
      envelopeFrom: smtpConfig.from
    };
    
    // Only include password if changed
    if (smtpConfig.password && smtpConfig.password.trim()) {
      updateData.smtpServer.password = smtpConfig.password;
    }
  }
  
  // Check if there are any changes
  if (Object.keys(updateData).length === 0) {
    // No changes to save
    return;
  }
  
  // Check for critical changes
  if (isCriticalChange(updateData)) {
    setPendingChanges(updateData);
    setShowCriticalWarning(true);
  } else {
    updateMutation.mutate(updateData);
  }
};


  const handleConfirmCriticalChange = () => {
    if (pendingChanges) {
      updateMutation.mutate(pendingChanges);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load realm settings: {error?.message}
        </Alert>
        <Button onClick={() => navigate('/realms')} sx={{ mt: 2 }}>
          Back to Realms
        </Button>
      </Box>
    );
  }

  return (

    <Fade in={true} timeout={500}>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, maxWidth: 1600, margin: '0 auto', overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/realms')} sx={{ bgcolor: theme.palette.background.paper, boxShadow: 1 }}>
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h4" fontWeight="700" color="text.primary" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                {realm?.display_name || realm?.displayName || realmName}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Chip 
                  label={realm?.realm_name || realm?.realm} 
                  size="small" 
                  variant="outlined" 
                  sx={{ fontWeight: 500 }}
                />
                <Chip 
                  label={realm?.enabled ? 'Active' : 'Disabled'} 
                  color={realm?.enabled ? 'success' : 'default'}
                  size="small"
                  variant="filled"
                  sx={{ fontWeight: 500 }}
                />
                <Chip 
                  label="SUPERADMIN" 
                  size="small" 
                  color="error" 
                  icon={<Security sx={{ fontSize: '1rem !important' }} />} 
                  variant="outlined"
                />
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: { xs: 1, md: 2 }, flexWrap: 'wrap' }}>
            <Button 
              startIcon={<Refresh />} 
              onClick={refetch} 
              disabled={isLoading}
              variant="outlined"
              sx={{ bgcolor: theme.palette.background.paper }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSubmit(onSubmit)}
              disabled={(!isDirty && !isPasswordPolicyDirty) || updateMutation.isPending}
              sx={{ px: 3 }}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Box>

        {/* Superadmin Info Alert */}
        <Alert 
          severity="info" 
          icon={<Security />} 
          sx={{ 
            mb: 4, 
            borderRadius: 2,
            border: `1px solid ${theme.palette.info.main}20`
          }}
        >
          <strong>Superadmin Mode:</strong> You have full control over all realm settings. Critical changes will show a confirmation dialog.
        </Alert>

        {/* Tabs */}
        <Paper 
          elevation={0} 
          sx={{ 
            mb: 3, 
            borderBottom: 1, 
            borderColor: 'divider',
            bgcolor: 'transparent'
          }}
        >
          <Tabs 
            value={activeTab} 
            onChange={(e, v) => {
              if (v === 'users') navigate(`/realms/${realmName}/users`);
              else if (v === 'clients') navigate(`/realms/${realmName}/clients`);
              else if (v === 'roles') navigate(`/realms/${realmName}/roles`);
              else if (v === 'idps') navigate(`/realms/${realmName}/identity-providers`);
              else if (v === 'analytics') navigate(`/realms/${realmName}/analytics`);
              else setActiveTab(v);
            }}
            variant="scrollable"
            scrollButtons="auto"
            textColor="primary"
            indicatorColor="primary"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                minHeight: 48,
              }
            }}
          >
            <Tab label="General" icon={<SettingsIcon fontSize="small" />} iconPosition="start" />
            <Tab label="Users" value="users" icon={<People fontSize="small" />} iconPosition="start" />
            <Tab label="Clients" value="clients" icon={<Apps fontSize="small" />} iconPosition="start" />
            <Tab label="Roles" value="roles" icon={<SecurityIcon fontSize="small" />} iconPosition="start" />
            <Tab label="Identity Providers" value="idps" icon={<Fingerprint fontSize="small" />} iconPosition="start" />
            <Tab label="Analytics" value="analytics" icon={<Assessment fontSize="small" />} iconPosition="start" />
            <Tab label="Login" icon={<Lock fontSize="small" />} iconPosition="start" />
            <Tab label="Security" icon={<Security fontSize="small" />} iconPosition="start" />
            <Tab label="Tokens & Sessions" icon={<Schedule fontSize="small" />} iconPosition="start" />
            <Tab label="Themes" icon={<Palette fontSize="small" />} iconPosition="start" />
            <Tab label="Email (SMTP)" icon={<Email fontSize="small" />} iconPosition="start" />
            <Tab label="Localization" icon={<Language fontSize="small" />} iconPosition="start" />
            <Tab label="Advanced" icon={<Verified fontSize="small" />} iconPosition="start" />
          </Tabs>
        </Paper>

        {/* General Tab */}
        <TabPanel value={activeTab} index={0}>
          <GeneralTab control={control} errors={errors} realm={realm} />
        </TabPanel>

        {/* Login Tab */}
        <TabPanel value={activeTab} index={5}>
          <LoginTab control={control} realm={realm} />
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={activeTab} index={6}>
          <SecurityTab 
            control={control} 
            realm={realm} 
            passwordPolicy={passwordPolicy} 
            updatePasswordPolicy={updatePasswordPolicy}
            bruteForceEnabled={bruteForceEnabled}
          />
        </TabPanel>

        {/* Tokens & Sessions Tab */}
        <TabPanel value={activeTab} index={7}>
          <TokensTab control={control} realm={realm} />
        </TabPanel>

        {/* Themes Tab */}
        <TabPanel value={activeTab} index={8}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Theme customization available for superadmins
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField 
                label="Login Theme" 
                value={realm?.loginTheme || 'keycloak'} 
                fullWidth 
                helperText="Theme for login pages"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField 
                label="Account Theme" 
                value={realm?.accountTheme || 'keycloak'} 
                fullWidth 
                helperText="Theme for account management"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField 
                label="Admin Theme" 
                value={realm?.adminTheme || 'keycloak'} 
                fullWidth 
                helperText="Theme for admin console"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField 
                label="Email Theme" 
                value={realm?.emailTheme || 'keycloak'} 
                fullWidth 
                helperText="Theme for email templates"
              />
            </Grid>

            <Grid item xs={12}>
              <Alert severity="warning">
                Custom theme development requires deploying theme files to Keycloak server
              </Alert>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Email (SMTP) Tab */}
        <TabPanel value={activeTab} index={9}>
          <SMTPTab smtpConfig={smtpConfig} setSmtpConfig={setSmtpConfig} />
        </TabPanel>

        {/* Localization Tab */}
        <TabPanel value={activeTab} index={10}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="internationalizationEnabled"
                control={control}
                defaultValue={realm?.internationalizationEnabled ?? false}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} />}
                    label="Enable Internationalization"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField 
                label="Default Locale" 
                value={realm?.defaultLocale || 'en'} 
                fullWidth 
                helperText="Default language for the realm"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Supported Locales: {realm?.supportedLocales?.join(', ') || 'None configured'}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Alert severity="info">
                Language customization requires deploying message bundles to Keycloak server
              </Alert>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Advanced Tab */}
        <TabPanel value={activeTab} index={11}>
          <Alert severity="error" icon={<Warning />} sx={{ mb: 3 }}>
            <strong>Advanced Settings:</strong> Modifying these settings incorrectly can break authentication. Proceed with caution.
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Cryptography</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField 
                label="Default Signature Algorithm" 
                value={realm?.defaultSignatureAlgorithm || 'RS256'} 
                fullWidth 
                disabled
                helperText="Token signing algorithm"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>Authentication Flows</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField 
                label="Browser Flow" 
                value={realm?.browserFlow || 'browser'} 
                fullWidth 
                disabled
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField 
                label="Registration Flow" 
                value={realm?.registrationFlow || 'registration'} 
                fullWidth 
                disabled
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField 
                label="Direct Grant Flow" 
                value={realm?.directGrantFlow || 'direct grant'} 
                fullWidth 
                disabled
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField 
                label="Reset Credentials Flow" 
                value={realm?.resetCredentialsFlow || 'reset credentials'} 
                fullWidth 
                disabled
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>Events</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={realm?.eventsEnabled ?? false} 
                    disabled 
                  />
                }
                label="Events Enabled"
              />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4 }}>
                Login events tracking
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={realm?.adminEventsEnabled ?? false} 
                    disabled 
                  />
                }
                label="Admin Events Enabled"
              />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4 }}>
                Admin action auditing
              </Typography>
            </Grid>

            {realm?.eventsEnabled && (
              <Grid item xs={12}>
                <Alert severity="info">
                  Events Expiration: {realm?.eventsExpiration ? `${realm.eventsExpiration} seconds` : 'Not configured'}
                </Alert>
              </Grid>
            )}
          </Grid>
        </TabPanel>


      {/* Critical Change Warning Dialog */}
      <Dialog open={showCriticalWarning} onClose={() => setShowCriticalWarning(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Warning color="error" />
            <Typography variant="h6">Confirm Critical Changes</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            You are about to make critical changes that may affect:
          </Alert>
          <List>
            <ListItem>
              <ListItemText 
                primary="User Authentication" 
                secondary="Users may be unable to log in if settings are incorrect"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Security" 
                secondary="Changes to security settings affect all realm users"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Email Delivery" 
                secondary="SMTP changes may prevent password resets and notifications"
              />
            </ListItem>
          </List>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Are you sure you want to proceed?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCriticalWarning(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleConfirmCriticalChange}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Confirm Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </Fade>
  );
}

export default RealmDetail;
