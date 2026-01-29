import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Box,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  Skeleton,
  Breadcrumbs,
  Link,
  Divider,
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  Fade,
  IconButton
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  VpnKey as VpnKeyIcon,
  History as HistoryIcon,
  Devices as DevicesIcon
} from '@mui/icons-material';

import userService from '../../services/userService';
import UserCredentials from '../../components/users/UserCredentials';
import UserRoleMapper from '../../components/users/UserRoleMapper';
import UserClientRoleMapper from '../../components/users/UserClientRoleMapper';
import UserSessionsTable from '../../components/users/UserSessionsTable';
import UserEventsTable from '../../components/users/UserEventsTable';
import EmptyState from '../../components/EmptyState';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function UserDetail() {
  const { realmName, userId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState(0);

  // Fetch User Details
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', realmName, userId],
    queryFn: () => userService.getUser(userId, realmName)
  });

  // Update User Mutation
  const updateMutation = useMutation({
    mutationFn: (data) => userService.updateUser(userId, data, realmName),
    onSuccess: () => {
      queryClient.invalidateQueries(['user', realmName, userId]);
      enqueueSnackbar('User updated successfully', { variant: 'success' });
    },
    onError: (err) => {
      enqueueSnackbar(err.message || 'Failed to update user', { variant: 'error' });
    }
  });

  const handleUpdate = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updates = Object.fromEntries(formData.entries());
    // Handle boolean switch manually if needed, or rely on controlled inputs
    // For simplicity, assuming simple text updates here.
    // In a real app, use React Hook Form like in other components.
    updateMutation.mutate(updates);
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={600} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <EmptyState
          type="error"
          title="Error loading user"
          message={error.message}
          actionLabel="Back to Users"
          onAction={() => navigate(`/realms/${realmName}/users`)}
        />
      </Box>
    );
  }

  return (
    <Fade in={true} timeout={500}>
      <Box sx={{ p: 3, maxWidth: 1600, margin: '0 auto' }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate(`/realms/${realmName}/users`)} sx={{ bgcolor: 'background.paper', boxShadow: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h4" fontWeight="700" color="text.primary">
                {user.username}
              </Typography>
              <Breadcrumbs sx={{ mt: 0.5 }}>
                <Link 
                  component="button" 
                  color="inherit" 
                  onClick={() => navigate(`/realms/${realmName}`)}
                  sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  {realmName}
                </Link>
                <Link 
                  component="button" 
                  color="inherit" 
                  onClick={() => navigate(`/realms/${realmName}/users`)}
                  sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  Users
                </Link>
                <Typography color="text.primary">User Details</Typography>
              </Breadcrumbs>
            </Box>
          </Box>
        </Box>

        <Paper sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 2 }} elevation={0}>
          <Tabs
            value={activeTab}
            onChange={(e, v) => setActiveTab(v)}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<PersonIcon />} label="Details" iconPosition="start" sx={{ minHeight: 64 }} />
            <Tab icon={<VpnKeyIcon />} label="Credentials" iconPosition="start" sx={{ minHeight: 64 }} />
            <Tab icon={<SecurityIcon />} label="Role Mapping" iconPosition="start" sx={{ minHeight: 64 }} />
            <Tab icon={<DevicesIcon />} label="Sessions" iconPosition="start" sx={{ minHeight: 64 }} />
            <Tab icon={<HistoryIcon />} label="Events" iconPosition="start" sx={{ minHeight: 64 }} />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <Box sx={{ maxWidth: 800 }}>
              <form onSubmit={handleUpdate}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Profile Information</Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Update the user's basic profile information.
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Username"
                      name="username"
                      defaultValue={user.username}
                      fullWidth
                      disabled
                      helperText="Username cannot be changed"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Email"
                      name="email"
                      defaultValue={user.email}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="First Name"
                      name="firstName"
                      defaultValue={user.firstName}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Last Name"
                      name="lastName"
                      defaultValue={user.lastName}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button 
                      type="submit" 
                      variant="contained"
                      disabled={updateMutation.isPending}
                      size="large"
                    >
                      Save Changes
                    </Button>
                  </Grid>
                </Grid>
              </form>

              <Divider sx={{ my: 4 }} />

              <Box>
                <Typography variant="h6" gutterBottom>Account Actions</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle2">Account Status</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.enabled ? 'User is currently enabled' : 'User is currently disabled'}
                        </Typography>
                      </Box>
                      <Switch 
                        checked={user.enabled} 
                        onChange={(e) => updateMutation.mutate({ enabled: e.target.checked })}
                        disabled={updateMutation.isPending}
                      />
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle2">Email Verification</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.emailVerified ? 'Email is verified' : 'Email is not verified'}
                        </Typography>
                      </Box>
                      <Button 
                        size="small" 
                        variant="outlined"
                        disabled={user.emailVerified}
                        onClick={() => {
                          userService.verifyEmail(userId, realmName)
                            .then(() => enqueueSnackbar('Verification email sent', { variant: 'success' }))
                            .catch(err => enqueueSnackbar(err.message, { variant: 'error' }));
                        }}
                      >
                        {user.emailVerified ? 'Verified' : 'Verify Email'}
                      </Button>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle2">Force Logout</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Sign out from all devices
                        </Typography>
                      </Box>
                      <Button 
                        size="small" 
                        color="warning"
                        variant="outlined"
                        onClick={() => {
                          if(window.confirm('Are you sure you want to logout this user from all sessions?')) {
                            userService.logoutAllSessions(userId, realmName)
                              .then(() => enqueueSnackbar('User logged out', { variant: 'success' }))
                              .catch(err => enqueueSnackbar(err.message, { variant: 'error' }));
                          }
                        }}
                      >
                        Logout
                      </Button>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle2">Reset Password</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Send password reset email
                        </Typography>
                      </Box>
                      <Button 
                        size="small" 
                        color="info"
                        variant="outlined"
                        onClick={() => {
                           userService.sendPasswordResetEmail(userId, realmName)
                            .then(() => enqueueSnackbar('Password reset email sent', { variant: 'success' }))
                            .catch(err => enqueueSnackbar(err.message, { variant: 'error' }));
                        }}
                      >
                        Reset Password
                      </Button>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <UserCredentials realmName={realmName} userId={userId} />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <UserRoleMapper realmName={realmName} userId={userId} />
            <UserClientRoleMapper realmName={realmName} userId={userId} />
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <UserSessionsTable realmName={realmName} userId={userId} />
          </TabPanel>

          <TabPanel value={activeTab} index={4}>
            <UserEventsTable realmName={realmName} userId={userId} />
          </TabPanel>
        </Paper>
      </Box>
    </Fade>
  );
}

export default UserDetail;
