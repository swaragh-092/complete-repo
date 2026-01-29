// Enhanced SecuritySettings.jsx with all security features
import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Grid, Switch,
  FormControlLabel, TextField, Divider, Alert, List, ListItem,
  ListItemText, ListItemIcon, ListItemSecondaryAction, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, Paper,
  LinearProgress, Snackbar, MenuItem, Select, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tooltip, Badge
} from '@mui/material';
import {
  Security as SecurityIcon, Key as KeyIcon, Shield as ShieldIcon,
  Smartphone as SmartphoneIcon, Email as EmailIcon,
  History as HistoryIcon, Warning as WarningIcon,
  CheckCircle as CheckCircleIcon, Add as AddIcon,
  Delete as DeleteIcon, Edit as EditIcon, Language as LanguageIcon,
  Timer as TimerIcon, Block as BlockIcon, Verified as VerifiedIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import { auth } from '@spidy092/auth-client';
import TwoFactorAuth from './TwoFactorSetup';
import { securityApi } from '../api/security.api';

function SecuritySettings() {
  const queryClient = useQueryClient();
  
  // State management
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [twoFactorDialogOpen, setTwoFactorDialogOpen] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  
  // Fetch security settings
  const { data: security = {}, isLoading: securityLoading, error: securityError } = useQuery({
    queryKey: ['security-settings'],
    queryFn: securityApi.getOverview,
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });
  
  // Fetch security events
  const { data: securityEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['security-events'],
    queryFn: securityApi.getEvents,
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
  });
  
  const { data: twoFAStatus, isLoading: twoFALoading } = useQuery({
    queryKey: ['2fa-status'],
    queryFn: securityApi.getStatus,
    staleTime: 2 * 60 * 1000,
  });
  // Change password mutation
  // SecuritySettings.jsx - Update the changePasswordMutation
const changePasswordMutation = useMutation({
  mutationFn: securityApi.changePassword,
  onSuccess: async () => {
    // ✅ Enhanced cache invalidation - Replace your existing onSuccess
    await Promise.all([
      // Invalidate session validation queries
      queryClient.invalidateQueries({ 
        queryKey: ['session-validation'],
        refetchType: 'all'
      }),
      // Invalidate all session-related queries
      queryClient.invalidateQueries({ 
        queryKey: ['all-user-sessions'],
        refetchType: 'all'
      }),
      // Invalidate user profile queries
      queryClient.invalidateQueries({ 
        queryKey: ['user-profile'],
        refetchType: 'all'
      }),
      // Invalidate security settings
      queryClient.invalidateQueries({ 
        queryKey: ['security-settings'],
        refetchType: 'all'
      })
    ]);

    // ✅ Clear all cached data to force fresh fetch
    queryClient.clear();

    // ✅ Show success message
    showSnackbar('Password changed successfully! Logging out...', 'success');

    // ✅ Close the dialog
    setChangePasswordOpen(false);
    
    // ✅ Reset form
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    });

    // ✅ Force logout after a short delay
    setTimeout(() => {
      auth.logout();
    }, 2000);
  },
  onError: (error) => {
    const message = error.response?.data?.message || 'Failed to change password';
    showSnackbar(message, 'error');
  }
});





    
  
  // Update security settings mutation
  const updateSecurityMutation = useMutation({
    mutationFn: (data) => auth.api.put('/account/security', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['security-settings']);
      showSnackbar('Security preferences updated!', 'success');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update security preferences';
      showSnackbar(message, 'error');
    }
  });
  
  // Remove trusted device mutation
  const removeTrustedDeviceMutation = useMutation({
    mutationFn: (deviceId) => auth.api.delete(`/account/trusted-device/${deviceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['security-settings']);
      showSnackbar('Trusted device removed successfully!', 'success');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to remove trusted device';
      showSnackbar(message, 'error');
    }
  });
  
  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  
  const handlePasswordChange = () => {
    // Validation
    if (!passwordForm.newPassword || !passwordForm.confirmNewPassword) {
      showSnackbar('Please fill in all password fields', 'error');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      showSnackbar('New passwords do not match', 'error');
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      showSnackbar('Password must be at least 8 characters long', 'error');
      return;
    }
    
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
      confirmNewPassword: passwordForm.confirmNewPassword
    });
  };
  
  const getSecurityScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };
  
  const getSecurityScoreText = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };
  
  if (securityLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading security settings...</Typography>
      </Box>
    );
  }
  
  if (securityError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load security settings. Please try refreshing the page.
      </Alert>
    );
  }
  
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Security Score Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom startIcon={<SecurityIcon />}>
            Security Overview
          </Typography>
          
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color={getSecurityScoreColor(security.securityScore)}>
                  {security.securityScore}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Security Score - {getSecurityScoreText(security.securityScore)}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={security.securityScore} 
                  color={getSecurityScoreColor(security.securityScore)}
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={9}>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <CheckCircleIcon color={security.emailVerified ? 'success' : 'disabled'} />
                    <Typography variant="body2">Email Verified</Typography>
                    <Typography variant="h6">{security.emailVerified ? 'YES' : 'NO'}</Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <ShieldIcon color={security.twoFactorEnabled ? 'success' : 'disabled'} />
                    <Typography variant="body2">2FA Status</Typography>
                    <Typography variant="h6">{security.twoFactorEnabled ? 'ON' : 'OFF'}</Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <SmartphoneIcon color="primary" />
                    <Typography variant="body2">Active Sessions</Typography>
                    <Typography variant="h6">{security.activeSessions || 0}</Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <WarningIcon color={security.failedLoginAttempts > 0 ? 'warning' : 'success'} />
                    <Typography variant="body2">Failed Logins</Typography>
                    <Typography variant="h6">{security.failedLoginAttempts || 0}</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Password & Authentication */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom startIcon={<KeyIcon />}>
            Password & Authentication
          </Typography>
          
          <Grid container spacing={2} alignItems="center" sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Last Password Change
                </Typography>
                <Typography variant="body1">
                  {security.lastPasswordChange ? 
                    formatDistanceToNow(new Date(security.lastPasswordChange), { addSuffix: true }) :
                    'Never changed'
                  }
                </Typography>
                {security.passwordAge > 90 && (
                  <Chip 
                    label="Password is old - consider changing" 
                    color="warning" 
                    size="small" 
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: 'right' }}>
                <Button 
                  variant="outlined" 
                  startIcon={<KeyIcon />}
                  onClick={() => setChangePasswordOpen(true)}
                  sx={{ mr: 1 }}
                >
                  Change Password
                </Button>
                
                <FormControlLabel
  control={
    <Switch
      checked={twoFAStatus?.enabled || false}
      onChange={(e) => {
        if (e.target.checked) {
          // Enable 2FA
          setTwoFactorDialogOpen(true);
        } else {
          // Disable 2FA - you can handle this in the dialog
          setTwoFactorDialogOpen(true);
        }
      }}
      disabled={twoFALoading}
    />
  }
  label={
    <Box>
      <Typography variant="body1">Two-Factor Authentication</Typography>
      <Typography variant="caption" color="text.secondary">
        {twoFAStatus?.enabled ? 'Your account is protected with 2FA' : 'Add extra security to your account'}
      </Typography>
    </Box>
  }
/>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Security Preferences */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Security Preferences
          </Typography>
          
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={security.loginNotifications !== false}
                    onChange={(e) => updateSecurityMutation.mutate({
                      loginNotifications: e.target.checked
                    })}
                    disabled={updateSecurityMutation.isLoading}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1">Login Notifications</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Email me about new sign-ins
                    </Typography>
                  </Box>
                }
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={security.suspiciousActivityAlerts !== false}
                    onChange={(e) => updateSecurityMutation.mutate({
                      suspiciousActivityAlerts: e.target.checked
                    })}
                    disabled={updateSecurityMutation.isLoading}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1">Suspicious Activity Alerts</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Alert me about unusual activity
                    </Typography>
                  </Box>
                }
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={security.sessionTimeout === true}
                    onChange={(e) => updateSecurityMutation.mutate({
                      sessionTimeout: e.target.checked
                    })}
                    disabled={updateSecurityMutation.isLoading}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1">Auto-logout</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Automatic logout after inactivity
                    </Typography>
                  </Box>
                }
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Preferred Language</InputLabel>
                <Select
                  value={security.locale || 'en'}
                  label="Preferred Language"
                  onChange={(e) => updateSecurityMutation.mutate({
                    locale: e.target.value
                  })}
                  disabled={updateSecurityMutation.isLoading}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="fr">Français</MenuItem>
                  <MenuItem value="de">Deutsch</MenuItem>
                  <MenuItem value="zh">中文</MenuItem>
                  <MenuItem value="ja">日本語</MenuItem>
                  <MenuItem value="pt">Português</MenuItem>
                  <MenuItem value="it">Italiano</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Trusted Devices */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Trusted Devices ({(security.trustedDevices || []).length})
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />}
              onClick={() => { /* TODO: Implement manage devices modal */ }}
            >
              Manage Devices
            </Button>
          </Box>
          
          {(security.trustedDevices || []).length === 0 ? (
            <Typography variant="body2" color="textSecondary">
              No trusted devices configured
            </Typography>
          ) : (
            <List>
              {(security.trustedDevices || []).slice(0, 3).map((device, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <SmartphoneIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={device.name || 'Unknown Device'}
                    secondary={`Added ${formatDistanceToNow(new Date(device.addedAt), { addSuffix: true })}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      onClick={() => removeTrustedDeviceMutation.mutate(device.id)}
                      disabled={removeTrustedDeviceMutation.isLoading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
      
      {/* Recent Security Activity */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Security Activity
          </Typography>
          
          {eventsLoading ? (
            <LinearProgress />
          ) : securityEvents.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Event</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell>Device</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {securityEvents.slice(0, 10).map((event, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {event.type === 'LOGIN' ? <CheckCircleIcon color="primary" sx={{ mr: 1 }} /> :
                           event.type === 'PASSWORD_CHANGE' ? <KeyIcon color="success" sx={{ mr: 1 }} /> :
                           event.type === 'SUSPICIOUS' ? <WarningIcon color="error" sx={{ mr: 1 }} /> :
                           <HistoryIcon sx={{ mr: 1 }} />}
                          {event.type.replace('_', ' ')}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={event.success ? 'Success' : 'Failed'} 
                          color={event.success ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title={format(new Date(event.timestamp), 'PPpp')}>
                          <span>{formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {event.ipAddress}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {event.userAgent?.substring(0, 50)}...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No recent security events found
            </Typography>
          )}
        </CardContent>
      </Card>
      
      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="password"
            label="Current Password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
            margin="normal"
            helperText="Leave blank if this is your first password setup"
          />
          <TextField
            fullWidth
            type="password"
            label="New Password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
            margin="normal"
            helperText="Password must be at least 8 characters long"
          />
          <TextField
            fullWidth
            type="password"
            label="Confirm New Password"
            value={passwordForm.confirmNewPassword}
            onChange={(e) => setPasswordForm({...passwordForm, confirmNewPassword: e.target.value})}
            margin="normal"
            error={passwordForm.confirmNewPassword && passwordForm.newPassword !== passwordForm.confirmNewPassword}
            helperText={passwordForm.confirmNewPassword && passwordForm.newPassword !== passwordForm.confirmNewPassword ?
              'Passwords do not match' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePasswordOpen(false)}>Cancel</Button>
          <Button 
            onClick={handlePasswordChange}
            variant="contained"
            disabled={changePasswordMutation.isLoading}
          >
            {changePasswordMutation.isLoading ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>

      <TwoFactorAuth
  open={twoFactorDialogOpen}
  onClose={() => setTwoFactorDialogOpen(false)}
  onSuccess={() => {
    queryClient.invalidateQueries(['2fa-status']);
    queryClient.invalidateQueries(['security-settings']);
    showSnackbar('2FA settings updated successfully!', 'success');
  }}
/>
      
      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity} 
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default SecuritySettings;
