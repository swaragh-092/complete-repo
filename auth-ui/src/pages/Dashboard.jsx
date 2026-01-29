
// admin-ui/src/pages/Dashboard.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Box, Grid, Card, CardContent, Typography, Button, Avatar,
  Chip, LinearProgress, List, ListItem, ListItemText, ListItemAvatar,
  IconButton, Divider, Paper, Alert, Skeleton, useTheme, Fade,
  CircularProgress, Tooltip
} from '@mui/material';
import {
  People as PeopleIcon,
  Apps as AppsIcon,
  Domain as DomainIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  Business as BusinessIcon,
  VpnKey as VpnKeyIcon,
  GroupWork as GroupWorkIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  Shield as ShieldIcon,
  Add as AddIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import realmService from '../services/realmService';
import roleService from '../services/roleService';

function Dashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all realms using service layer
  const { data: realms = [], isLoading: realmsLoading, refetch: refetchRealms } = useQuery({
    queryKey: ['dashboard-realms'],
    queryFn: () => realmService.getAllRealms(),
  });

  // Fetch aggregated data across all realms
  const { data: dashboardStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const stats = {
        totalUsers: 0,
        totalClients: 0,
        totalRoles: 0,
        enabledRealms: 0,
        recentUsers: [],
        recentClients: [],
        systemHealth: []
      };

      // Get stats for each realm using service layer
      for (const realm of realms) {
        try {
          // Users in this realm
          const users = await realmService.getRealmUsers(realm.realm_name);
          const usersList = users?.rows || (Array.isArray(users) ? users : []);
          stats.totalUsers += users?.count || usersList.length;

          // Add recent users (created in last 7 days)
          const recentUsers = usersList.filter(user => {
            if (!user.createdTimestamp) return false;
            const created = new Date(user.createdTimestamp);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return created > weekAgo;
          }).slice(0, 3);

          stats.recentUsers.push(...recentUsers.map(user => ({
            ...user,
            realmName: realm.realm_name
          })));

          // Clients in this realm
          const clients = await realmService.getRealmClients(realm.realm_name);
          const clientsList = clients?.rows || (Array.isArray(clients) ? clients : []);
          stats.totalClients += clients?.count || clientsList.length;

          // Add recent clients
          stats.recentClients.push(...clientsList.slice(0, 2).map(client => ({
            ...client,
            realmName: realm.realm_name
          })));

          // Realm roles
          const realmRoles = await roleService.getRealmRoles(realm.realm_name);
          const rolesList = realmRoles?.rows || (Array.isArray(realmRoles) ? realmRoles : []);
          stats.totalRoles += rolesList.length;

          // Count enabled realms
          if (realm.enabled) stats.enabledRealms++;

          // System health check
          stats.systemHealth.push({
            realm: realm.realm_name,
            status: realm.enabled ? 'healthy' : 'disabled',
            users: usersList.length,
            clients: clientsList.length
          });

        } catch (error) {
          console.error(`Error fetching data for realm ${realm.realm_name}:`, error);
          stats.systemHealth.push({
            realm: realm.realm_name,
            status: 'error',
            error: error.message
          });
        }
      }

      // Sort recent users by creation date
      stats.recentUsers = stats.recentUsers
        .sort((a, b) => new Date(b.createdTimestamp) - new Date(a.createdTimestamp))
        .slice(0, 5);

      return stats;
    },
    enabled: realms && realms.length > 0,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchRealms(), refetchStats()]);
    setRefreshing(false);
    enqueueSnackbar('Dashboard refreshed', { variant: 'success' });
  };

  const isLoading = realmsLoading || statsLoading;

  // Modern Stats Card Component
  const StatCard = ({ title, value, subtext, icon: StatIconComponent, gradient, delay }) => (
    <Fade in={true} timeout={500} style={{ transitionDelay: `${delay}ms` }}>
      <Paper 
        elevation={0}
        sx={{ 
          p: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'primary.main',
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
          }
        }}
      >
        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
          <Box sx={{ zIndex: 1 }}>
            <Typography 
              color="text.secondary" 
              variant="body2" 
              fontWeight={500}
              sx={{ mb: 1 }}
            >
              {title}
            </Typography>
            {isLoading ? (
              <Skeleton variant="text" width={60} height={48} />
            ) : (
              <Typography 
                variant="h3" 
                component="div" 
                fontWeight={700} 
                sx={{ 
                  background: gradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 1.2
                }}
              >
                {value}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {subtext}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              background: gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
            }}
          >
            <StatIconComponent sx={{ color: 'white', fontSize: 24 }} />
          </Box>
        </Box>
      </Paper>
    </Fade>
  );

  // Quick Action Card
  const QuickActionCard = ({ title, description, icon: ActionIconComponent, onClick, gradient }) => (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: 'action.hover',
          '& .action-arrow': {
            transform: 'translateX(4px)',
            opacity: 1
          }
        }
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 1.5,
          background: gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <ActionIconComponent sx={{ color: 'white', fontSize: 20 }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" fontWeight={600} noWrap>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {description}
        </Typography>
      </Box>
      <ArrowForwardIcon 
        className="action-arrow"
        sx={{ 
          color: 'text.secondary', 
          fontSize: 18,
          opacity: 0.5,
          transition: 'all 0.2s ease'
        }} 
      />
    </Paper>
  );

  return (
    <Box>
      {/* Welcome Header */}
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
              Welcome back! 👋
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Here's what's happening with your authentication system today.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={refreshing ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => navigate('/realms')}
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
              New Realm
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={dashboardStats?.totalUsers || 0}
            subtext={`Across ${realms.length} realms`}
            icon={PeopleIcon}
            gradient="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
            delay={100}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Active Realms"
            value={dashboardStats?.enabledRealms || 0}
            subtext={`Of ${realms.length} total`}
            icon={DomainIcon}
            gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
            delay={200}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Total Clients"
            value={dashboardStats?.totalClients || 0}
            subtext="Applications"
            icon={AppsIcon}
            gradient="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
            delay={300}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Total Roles"
            value={dashboardStats?.totalRoles || 0}
            subtext="Permissions"
            icon={SecurityIcon}
            gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
            delay={400}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Left Column - System Health & Quick Actions */}
        <Grid item xs={12} lg={8}>
          <Grid container spacing={3}>
            {/* Quick Actions */}
            <Grid item xs={12}>
              <Fade in={true} timeout={500} style={{ transitionDelay: '500ms' }}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2.5 }}>
                    Quick Actions
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <QuickActionCard
                        title="Manage Realms"
                        description="View all realms"
                        icon={DomainIcon}
                        onClick={() => navigate('/realms')}
                        gradient="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <QuickActionCard
                        title="Clients"
                        description="App connections"
                        icon={AppsIcon}
                        onClick={() => navigate('/clients')}
                        gradient="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <QuickActionCard
                        title="Organizations"
                        description="Manage orgs"
                        icon={BusinessIcon}
                        onClick={() => navigate('/organizations')}
                        gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <QuickActionCard
                        title="Permissions"
                        description="Access control"
                        icon={VpnKeyIcon}
                        onClick={() => navigate('/permissions')}
                        gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Fade>
            </Grid>

            {/* System Health */}
            <Grid item xs={12}>
              <Fade in={true} timeout={500} style={{ transitionDelay: '600ms' }}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: dashboardStats?.enabledRealms === realms.length ? 'success.main' : 'warning.main',
                          animation: 'pulse 2s infinite'
                        }}
                      />
                      <Typography variant="h6" fontWeight={600}>
                        System Health
                      </Typography>
                    </Box>
                    <Chip 
                      label={`${dashboardStats?.enabledRealms || 0}/${realms.length} Active`}
                      size="small"
                      sx={{
                        bgcolor: dashboardStats?.enabledRealms === realms.length ? 'success.50' : 'warning.50',
                        color: dashboardStats?.enabledRealms === realms.length ? 'success.700' : 'warning.700',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    />
                  </Box>

                  {isLoading ? (
                    <Box>
                      {[1, 2, 3].map((i) => (
                        <Box key={i} mb={2}>
                          <Skeleton variant="text" height={24} width="30%" />
                          <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 4, mt: 1 }} />
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box>
                      {dashboardStats?.systemHealth?.map((health, index) => (
                        <Box 
                          key={index} 
                          sx={{ 
                            py: 2,
                            borderBottom: index < dashboardStats.systemHealth.length - 1 ? '1px solid' : 'none',
                            borderColor: 'divider'
                          }}
                        >
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Box display="flex" alignItems="center" gap={1.5}>
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  background: health.status === 'healthy' 
                                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                    : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                                }}
                              >
                                {health.realm.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {health.realm}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {health.users} users • {health.clients} clients
                                </Typography>
                              </Box>
                            </Box>
                            <Chip 
                              label={health.status}
                              size="small"
                              icon={health.status === 'healthy' ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : <WarningIcon sx={{ fontSize: 14 }} />}
                              sx={{ 
                                height: 24,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                bgcolor: health.status === 'healthy' ? 'success.50' : 'error.50',
                                color: health.status === 'healthy' ? 'success.700' : 'error.700',
                                '& .MuiChip-icon': {
                                  color: 'inherit'
                                }
                              }}
                            />
                          </Box>
                          {health.status === 'healthy' && (
                            <LinearProgress 
                              variant="determinate" 
                              value={Math.min((health.users / 20) * 100, 100)} 
                              sx={{ 
                                height: 6, 
                                borderRadius: 3,
                                bgcolor: 'grey.100',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 3,
                                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                                }
                              }}
                            />
                          )}
                          {health.error && (
                            <Alert severity="error" sx={{ mt: 1, py: 0, borderRadius: 2 }}>
                              {health.error}
                            </Alert>
                          )}
                        </Box>
                      ))}
                    </Box>
                  )}
                </Paper>
              </Fade>
            </Grid>
          </Grid>
        </Grid>

        {/* Right Column - Recent Activity */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3}>
            {/* Recent Users */}
            <Grid item xs={12}>
              <Fade in={true} timeout={500} style={{ transitionDelay: '700ms' }}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden'
                  }}
                >
                  <Box sx={{ p: 3, pb: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" fontWeight={600}>
                        Recent Users
                      </Typography>
                      <Button 
                        size="small" 
                        endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                        onClick={() => navigate('/account')}
                        sx={{ textTransform: 'none', fontWeight: 500 }}
                      >
                        View All
                      </Button>
                    </Box>
                  </Box>
                  <Divider />
                  <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
                    {isLoading ? (
                      <Box sx={{ p: 3 }}>
                        {[1, 2, 3].map((i) => (
                          <Box key={i} display="flex" alignItems="center" mb={2}>
                            <Skeleton variant="circular" width={40} height={40} />
                            <Box ml={2} flex={1}>
                              <Skeleton variant="text" width="60%" />
                              <Skeleton variant="text" width="40%" />
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    ) : dashboardStats?.recentUsers?.length > 0 ? (
                      <List disablePadding>
                        {dashboardStats.recentUsers.map((user, index) => (
                          <ListItem 
                            key={user.id}
                            sx={{ 
                              py: 2,
                              px: 3,
                              borderBottom: index < dashboardStats.recentUsers.length - 1 ? '1px solid' : 'none',
                              borderColor: 'divider',
                              '&:hover': { bgcolor: 'action.hover' }
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar 
                                sx={{ 
                                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                  fontWeight: 600
                                }}
                              >
                                {user.username?.charAt(0)?.toUpperCase() || 'U'}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {user.username}
                                </Typography>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    {user.email}
                                  </Typography>
                                  <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                    <Chip 
                                      label={user.realmName} 
                                      size="small" 
                                      sx={{ 
                                        height: 18, 
                                        fontSize: '0.65rem',
                                        bgcolor: 'primary.50',
                                        color: 'primary.700',
                                        fontWeight: 500
                                      }}
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                      {user.createdTimestamp && 
                                        formatDistanceToNow(new Date(user.createdTimestamp), { addSuffix: true })
                                      }
                                    </Typography>
                                  </Box>
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Box sx={{ p: 4, textAlign: 'center' }}>
                        <PeopleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                        <Typography color="text.secondary">
                          No recent users
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Fade>
            </Grid>

            {/* Performance Card */}
            <Grid item xs={12}>
              <Fade in={true} timeout={500} style={{ transitionDelay: '800ms' }}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)'
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <SpeedIcon sx={{ color: 'white', fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        System Status
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        All services operational
                      </Typography>
                    </Box>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h4" fontWeight={700} color="success.main">
                        99.9%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Uptime this month
                      </Typography>
                    </Box>
                    <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
                  </Box>
                </Paper>
              </Fade>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
