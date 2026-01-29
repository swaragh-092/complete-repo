
// admin-ui/src/pages/AccountManagement.jsx
import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  Avatar,
  Tabs,
  Tab,
  Paper,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Badge,
  useTheme,
  Fade,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Business as BusinessIcon,
  VpnKey as PermissionIcon,
  History as HistoryIcon,
  Lock as LockIcon,
  Visibility as ViewIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Devices as DevicesIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import api from '../services/api';

// Tab Components
import AccountProfileTab from './account/tabs/AccountProfileTab';
import AccountOrganizationsTab from './account/tabs/AccountOrganizationsTab';
import AccountPermissionsTab from './account/tabs/AccountPermissionsTab';
import AccountSessionsTab from './account/tabs/AccountSessionsTab';
import AccountActivityTab from './account/tabs/AccountActivityTab';

function TabPanel({ children, value, index }) {
  return (
    <Fade in={value === index} timeout={300}>
      <div hidden={value !== index}>
        {value === index && <Box>{children}</Box>}
      </div>
    </Fade>
  );
}

function AccountManagement() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [formData, setFormData] = useState({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => api.get('/auth/account/profile').then(res => res.data)
  });

  // Fetch user organizations
  const { data: organizations = {} } = useQuery({
    queryKey: ['user-organizations'],
    queryFn: () => api.get('/auth/account/organizations').then(res => res.data?.data || res.data)
  });

  // Fetch user permissions
  const { data: permissions = {} } = useQuery({
    queryKey: ['user-permissions'],
    queryFn: () => api.get('/auth/account/permissions').then(res => res.data)
  });

  // Fetch user sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ['user-sessions'],
    queryFn: () => api.get('/auth/account/sessions').then(res => res.data)
  });

  // Fetch security events
  const { data: securityEvents = [] } = useQuery({
    queryKey: ['security-events'],
    queryFn: () => api.get('/auth/account/security-events').then(res => res.data)
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (profileData) => api.put('/auth/account/profile', profileData),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-profile']);
      setOpenEdit(false);
      enqueueSnackbar('Profile updated successfully', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(`Failed to update profile: ${error.response?.data?.message || error.message}`, { variant: 'error' });
    }
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (passwordData) => api.post('/auth/account/change-password', passwordData),
    onSuccess: () => {
      setOpenChangePassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      enqueueSnackbar('Password changed successfully', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(`Failed to change password: ${error.response?.data?.message || error.message}`, { variant: 'error' });
    }
  });

  // Set primary organization mutation
  const setPrimaryOrgMutation = useMutation({
    mutationFn: (orgId) => api.put('/auth/account/primary-organization', { org_id: orgId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-organizations']);
      enqueueSnackbar('Primary organization updated successfully', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(`Failed to update primary organization: ${error.response?.data?.message || error.message}`, { variant: 'error' });
    }
  });

  const handleEditProfile = () => {
    setFormData({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      email: profile?.email || '',
      designation: profile?.metadata?.designation || '',
      department: profile?.metadata?.department || '',
      mobile: profile?.metadata?.mobile || '',
      gender: profile?.metadata?.gender || ''
    });
    setOpenEdit(true);
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      enqueueSnackbar('Passwords do not match', { variant: 'warning' });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      enqueueSnackbar('Password must be at least 8 characters long', { variant: 'warning' });
      return;
    }
    changePasswordMutation.mutate(passwordData);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
          <Box>
            <Typography 
              variant="h4" 
              fontWeight={700} 
              sx={{ 
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 100%)'
                  : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 0.5
              }}
            >
              My Account
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your profile, security, and preferences
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<LockIcon />}
              onClick={() => setOpenChangePassword(true)}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              Change Password
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<EditIcon />}
              onClick={handleEditProfile}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(99, 102, 241, 0.5)'
                }
              }}
            >
              Edit Profile
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Profile Card */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3,
          mb: 4,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
            : 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    bgcolor: profile?.enabled ? 'success.main' : 'error.main',
                    border: '3px solid',
                    borderColor: 'background.paper'
                  }}
                />
              }
            >
              <Avatar
                sx={{ 
                  width: 80, 
                  height: 80, 
                  fontSize: '2rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)'
                }}
              >
                {profile?.firstName?.charAt(0) || profile?.email?.charAt(0) || 'U'}
              </Avatar>
            </Badge>
          </Grid>
          <Grid item xs>
            <Typography variant="h5" fontWeight={700}>
              {profile?.firstName} {profile?.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {profile?.email}
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {profile?.emailVerified && (
                <Chip 
                  icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                  label="Verified" 
                  size="small"
                  sx={{ 
                    bgcolor: 'success.50', 
                    color: 'success.700',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    '& .MuiChip-icon': { color: 'success.600' }
                  }}
                />
              )}
              {profile?.metadata?.designation && (
                <Chip 
                  label={profile.metadata.designation} 
                  size="small"
                  sx={{ 
                    bgcolor: 'primary.50', 
                    color: 'primary.700',
                    fontWeight: 500,
                    fontSize: '0.75rem'
                  }}
                />
              )}
              {profile?.metadata?.department && (
                <Chip 
                  label={profile.metadata.department} 
                  size="small"
                  sx={{ 
                    bgcolor: 'grey.100', 
                    color: 'grey.700',
                    fontWeight: 500,
                    fontSize: '0.75rem'
                  }}
                />
              )}
            </Box>
          </Grid>
          <Grid item>
            <Box sx={{ display: 'flex', gap: 4, textAlign: 'center' }}>
              <Box>
                <Typography variant="h4" fontWeight={700} color="primary.main">
                  {organizations?.memberships?.length || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Organizations
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box>
                <Typography variant="h4" fontWeight={700} color="secondary.main">
                  {permissions?.total || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Permissions
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Tabs 
        value={tabValue} 
        onChange={(e, v) => setTabValue(v)} 
        sx={{ 
          mb: 3,
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: 1.5,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
          },
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.9rem',
            minHeight: 48,
            '&.Mui-selected': { color: '#6366f1' }
          }
        }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab icon={<PersonIcon />} iconPosition="start" label="Profile" />
        <Tab icon={<BusinessIcon />} iconPosition="start" label="Organizations" />
        <Tab icon={<PermissionIcon />} iconPosition="start" label="Permissions" />
        <Tab icon={<DevicesIcon />} iconPosition="start" label="Sessions" />
        <Tab icon={<HistoryIcon />} iconPosition="start" label="Activity" />
      </Tabs>

      {/* Profile Tab */}
      <TabPanel value={tabValue} index={0}>
        <AccountProfileTab profile={profile} />
      </TabPanel>

      {/* Organizations Tab */}
      <TabPanel value={tabValue} index={1}>
        <AccountOrganizationsTab 
          organizations={organizations} 
          onSetPrimary={(orgId) => setPrimaryOrgMutation.mutate(orgId)}
        />
      </TabPanel>

      {/* Permissions Tab */}
      <TabPanel value={tabValue} index={2}>
        <AccountPermissionsTab permissions={permissions} />
      </TabPanel>

      {/* Sessions Tab */}
      <TabPanel value={tabValue} index={3}>
        <AccountSessionsTab sessions={sessions} />
      </TabPanel>

      {/* Activity Tab */}
      <TabPanel value={tabValue} index={4}>
        <AccountActivityTab securityEvents={securityEvents} />
      </TabPanel>

      {/* Edit Profile Dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Edit Profile</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                label="First Name"
                fullWidth
                size="small"
                value={formData.firstName || ''}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Last Name"
                fullWidth
                size="small"
                value={formData.lastName || ''}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                fullWidth
                size="small"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Designation"
                fullWidth
                size="small"
                value={formData.designation || ''}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Department"
                fullWidth
                size="small"
                value={formData.department || ''}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Mobile"
                fullWidth
                size="small"
                value={formData.mobile || ''}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button 
            onClick={() => setOpenEdit(false)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveProfile} 
            variant="contained" 
            disabled={updateProfileMutation.isLoading}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
            }}
          >
            {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={openChangePassword} onClose={() => setOpenChangePassword(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Current Password"
            type={showPasswords.current ? 'text' : 'password'}
            fullWidth
            size="small"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  edge="end"
                  size="small"
                >
                  {showPasswords.current ? <VisibilityOffIcon fontSize="small" /> : <ViewIcon fontSize="small" />}
                </IconButton>
              )
            }}
          />
          <TextField
            margin="dense"
            label="New Password"
            type={showPasswords.new ? 'text' : 'password'}
            fullWidth
            size="small"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  edge="end"
                  size="small"
                >
                  {showPasswords.new ? <VisibilityOffIcon fontSize="small" /> : <ViewIcon fontSize="small" />}
                </IconButton>
              )
            }}
          />
          <TextField
            margin="dense"
            label="Confirm New Password"
            type={showPasswords.confirm ? 'text' : 'password'}
            fullWidth
            size="small"
            value={passwordData.confirmNewPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  edge="end"
                  size="small"
                >
                  {showPasswords.confirm ? <VisibilityOffIcon fontSize="small" /> : <ViewIcon fontSize="small" />}
                </IconButton>
              )
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button 
            onClick={() => setOpenChangePassword(false)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleChangePassword} 
            variant="contained" 
            disabled={changePasswordMutation.isLoading}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
            }}
          >
            {changePasswordMutation.isLoading ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AccountManagement;
