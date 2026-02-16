/**
 * @fileoverview Dashboard Page
 * @description Modern responsive dashboard with MUI components
 */

import { useEffect, useState } from 'react';
import { auth } from '@spidy092/auth-client';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Typography,
  Button,
  Chip,
  Alert,
  useTheme,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Business as OrgIcon,
  CalendarToday as CalendarIcon,
  Security as SecurityIcon,
  Devices as DevicesIcon,
  Settings as SettingsIcon,
  Launch as LaunchIcon,
  Dashboard as DashboardIcon,
  Workspaces as WorkspaceIcon,
} from '@mui/icons-material';

import { useOrganization } from '../context/OrganizationContext';
import { useWorkspace } from '../context/WorkspaceContext';


export default function Dashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { currentOrganization } = useOrganization();
  const { currentWorkspace, workspaceCount } = useWorkspace();
  

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await auth.api.get('/account/profile');
        // Extract from ResponseHandler wrapper: { success, data: { ... } }
        const profileData = response.data?.data || response.data;
        console.log('📋 Profile data loaded:', profileData);
        setUser(profileData);
      } catch (err) {
        if (err.response?.status === 401) {
          auth.logout();
          navigate('/login');
        } else {
          setError('Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [navigate]);

  const getUserInitial = () => {
    const name = user?.firstName || user?.name || user?.username || user?.email || 'U';
    return name.charAt(0).toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const accountUrl = import.meta.env.VITE_ACCOUNT_UI_URL || 'https://account.local.test:5174';

  const quickActions = [
    { title: 'Edit Profile', description: 'Update your personal info', icon: <PersonIcon />, url: `${accountUrl}/profile` },
    { title: 'Security', description: 'Password & 2FA settings', icon: <SecurityIcon />, url: `${accountUrl}/security` },
    { title: 'Sessions', description: 'Manage active devices', icon: <DevicesIcon />, url: `${accountUrl}/sessions` },
    { title: 'Settings', description: 'Account preferences', icon: <SettingsIcon />, url: `${accountUrl}/preferences` },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={<Button onClick={() => window.location.reload()}>Retry</Button>}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Welcome Section */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          mb: 3,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: 'white',
          borderRadius: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Avatar
            sx={{
              width: { xs: 56, sm: 72 },
              height: { xs: 56, sm: 72 },
              bgcolor: 'rgba(255,255,255,0.2)',
              fontSize: { xs: '1.5rem', sm: '2rem' },
              fontWeight: 700,
            }}
          >
            {getUserInitial()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              Welcome back, {user?.firstName || user?.name?.split(' ')[0] || user?.username || 'User'}! 👋
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Here's what's happening with your account
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <PersonIcon color="primary" />
                <Typography variant="subtitle2" color="text.secondary">Account Status</Typography>
              </Box>
              <Typography variant="h6" fontWeight={600}>Active</Typography>
              <Chip label="Verified" color="success" size="small" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <EmailIcon color="primary" />
                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
              </Box>
              <Typography variant="body2" fontWeight={500} noWrap>{user?.email || 'Not set'}</Typography>
            </CardContent>
          </Card>
        </Grid>

        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <OrgIcon color="primary" />
                <Typography variant="subtitle2" color="text.secondary">Organization</Typography>
              </Box>
              <Typography variant="body2" fontWeight={500} noWrap>
                {currentOrganization?.name || currentOrganization?.org_name || 'None'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <WorkspaceIcon color="primary" />
                <Typography variant="subtitle2" color="text.secondary">Workspace</Typography>
              </Box>
              <Typography variant="body2" fontWeight={500} noWrap>
                {currentWorkspace?.name || 'Select workspace'}
              </Typography>
              <Chip label={`${workspaceCount} available`} size="small" variant="outlined" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
        

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <CalendarIcon color="primary" />
                <Typography variant="subtitle2" color="text.secondary">Member Since</Typography>
              </Box>
              <Typography variant="body2" fontWeight={500}>{formatDate(user?.created_at)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Quick Actions</Typography>
      <Grid container spacing={2}>
        {quickActions.map((action) => (
          <Grid item xs={12} sm={6} md={3} key={action.title}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${theme.palette.primary.main}20`,
                },
              }}
              onClick={() => window.open(action.url, '_blank')}
            >
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: `${theme.palette.primary.main}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'primary.main',
                  }}
                >
                  {action.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600}>{action.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{action.description}</Typography>
                </Box>
                <LaunchIcon fontSize="small" color="action" />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}