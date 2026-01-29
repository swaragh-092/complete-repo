import { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  AppBar,
} from '@mui/material';
import {
  AppRegistrationRounded as DashboardIcon,
  PersonRounded as ProfileIcon,
  SecurityRounded as SecurityIcon,
  DevicesOtherRounded as DevicesIcon,
  HistoryRounded as SessionsIcon,
  TimelineRounded as ActivityIcon,
  NotificationsRounded as NotificationsIcon,
  SettingsSuggestRounded as PreferencesIcon,
  LogoutRounded as LogoutIcon,
  MenuRounded as MenuIcon,
  WbSunnyRounded as LightModeIcon,
  DarkModeRounded as DarkModeIcon,
  SupportAgentRounded as SupportIcon,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { auth } from '@spidy092/auth-client';
import { useThemeMode } from '../context/ThemeContext';
import { useProfile } from '../hooks/useProfile';
import { useSessions } from '../hooks/useSessions';

const drawerWidth = 280;

const navItems = [
  {
    label: 'Overview',
    description: 'Identity summary and analytics',
    path: '/dashboard',
    icon: <DashboardIcon fontSize="small" />,
  },
  {
    label: 'Profile',
    description: 'Personal and organization details',
    path: '/profile',
    icon: <ProfileIcon fontSize="small" />,
  },
  {
    label: 'Security',
    description: 'MFA, password, alerts',
    path: '/security',
    icon: <SecurityIcon fontSize="small" />,
  },
  {
    label: 'Sessions',
    description: 'Active application sessions',
    path: '/sessions',
    icon: <SessionsIcon fontSize="small" />,
  },
  {
    label: 'Trusted Devices',
    description: 'Device trust & risk insights',
    path: '/trusted-devices',
    icon: <DevicesIcon fontSize="small" />,
  },
  {
    label: 'Activity',
    description: 'Audit logs & analytics',
    path: '/activity',
    icon: <ActivityIcon fontSize="small" />,
  },
  {
    label: 'Notifications',
    description: 'Security & product alerts',
    path: '/notifications',
    icon: <NotificationsIcon fontSize="small" />,
  },
  {
    label: 'Preferences',
    description: 'Experience & accessibility',
    path: '/preferences',
    icon: <PreferencesIcon fontSize="small" />,
  },
];

const MotionBox = motion.create(Box);

export default function AppLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleMode, mode } = useThemeMode();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);

  const { data: profile, isPending: profilePending } = useProfile();
  const { data: sessions = [] } = useSessions();

  const currentRoute = useMemo(() => navItems.find((item) => location.pathname.startsWith(item.path)) || navItems[0], [location.pathname]);

  const activeSessions = useMemo(() => {
    if (!sessions) return 0;
    return sessions.filter((session) => session.active !== false).length;
  }, [sessions]);

  const totalApps = useMemo(() => {
    if (!sessions) return 0;
    const uniqueClients = new Set(sessions.map((session) => session.clientId || session.applicationName || 'unknown'));
    return uniqueClients.size;
  }, [sessions]);

  const handleNavigate = (path) => {
    navigate(path);
    if (!isDesktop) {
      setMobileOpen(false);
    }
  };

  const handleLogout = () => {
    setProfileMenuAnchor(null);
    auth.logout();
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', px: 2, pt: 3, pb: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={700} letterSpacing={-0.3}>
          Account Center
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Unified identity portal
        </Typography>
      </Box>

      <Stack spacing={1.5} sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar
            src={profile?.avatarUrl || undefined}
            sx={{ width: 48, height: 48, bgcolor: theme.palette.primary.main }}
          >
            {profile?.fullName?.charAt(0)?.toUpperCase() || profile?.username?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={600} noWrap>
              {profilePending ? 'Loading…' : profile?.fullName || profile?.username || 'Account User'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {profile?.email || 'Identity account'}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip label={`${activeSessions} sessions`} size="small" color="primary" variant="outlined" />
          <Chip label={`${totalApps} apps`} size="small" color="secondary" variant="outlined" />
          {profile?.totpEnabled && <Chip label="MFA" size="small" color="success" />}
        </Stack>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <List sx={{ flex: 1, px: 0 }}>
        {navItems.map((item) => {
          const selected = location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={selected}
                onClick={() => handleNavigate(item.path)}
                sx={{
                  borderRadius: 2,
                  alignItems: 'flex-start',
                  py: 1.25,
                  px: 1.5,
                  '&.Mui-selected': {
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(217,207,199,0.2) 0%, rgba(201,181,156,0.15) 100%)'
                      : 'linear-gradient(135deg, rgba(201,181,156,0.2) 0%, rgba(168,148,125,0.12) 100%)',
                    color: theme.palette.text.primary,
                    '& .MuiListItemIcon-root': {
                      color: theme.palette.primary.dark,
                    },
                  },
                  '&:hover': {
                    background: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(0,0,0,0.04)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, mt: 0.2, color: 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <Box>
                  <ListItemText
                    primary={<Typography variant="subtitle2" fontWeight={600}>{item.label}</Typography>}
                    secondary={<Typography variant="caption" color="text.secondary">{item.description}</Typography>}
                  />
                </Box>
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ mt: 'auto' }}>
        <Divider sx={{ mb: 2 }} />
        <Stack direction="row" spacing={1}>
          <Button
            fullWidth
            variant="outlined"
            color="inherit"
            startIcon={<SupportIcon fontSize="small" />}
            onClick={() => window.open('mailto:support@example.com', '_blank')}
          >
            Support
          </Button>
        </Stack>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
      <Box component="nav" sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}>
        <Drawer
          variant={isDesktop ? 'permanent' : 'temporary'}
          open={isDesktop || mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              borderRight: `1px solid ${theme.palette.divider}`,
              boxSizing: 'border-box',
              backgroundColor: theme.palette.background.paper,
              // Fix scroll - hide scrollbar but allow scrolling
              overflowY: 'auto',
              overflowX: 'hidden',
              '&::-webkit-scrollbar': {
                width: 6,
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                borderRadius: 3,
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
              },
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar position="sticky" color="default" sx={{ backgroundColor: theme.palette.background.paper }}>
          <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
            {!isDesktop && (
              <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
                <MenuIcon />
              </IconButton>
            )}

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="overline" color="text.secondary" letterSpacing={0.4}>
                {currentRoute.label}
              </Typography>
              <Typography variant="h5" fontWeight={700} letterSpacing={-0.4}>
                {currentRoute.description}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
                <IconButton onClick={toggleMode} color="primary">
                  {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
                </IconButton>
              </Tooltip>

              <Tooltip title="Account menu">
                <IconButton onClick={(event) => setProfileMenuAnchor(event.currentTarget)}>
                  <Badge color="secondary" variant={profile?.totpEnabled ? 'dot' : 'standard'} overlap="circular">
                    <Avatar
                      sx={{ width: 36, height: 36, bgcolor: theme.palette.primary.main }}
                      src={profile?.avatarUrl || undefined}
                    >
                      {profile?.fullName?.charAt(0)?.toUpperCase() || profile?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </Avatar>
                  </Badge>
                </IconButton>
              </Tooltip>
            </Stack>
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, p: { xs: 2, sm: 3, lg: 4 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <AnimatePresence mode="wait">
            <MotionBox
              key={location.pathname}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <Outlet />
            </MotionBox>
          </AnimatePresence>
        </Box>
      </Box>

      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={() => setProfileMenuAnchor(null)}
        PaperProps={{ sx: { minWidth: 220, borderRadius: 2, mt: 1 } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={600} noWrap>
            {profile?.fullName || profile?.username || 'Account user'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {profile?.email || 'identity@portal.com'}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => handleNavigate('/profile')}>
          <ListItemIcon>
            <ProfileIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={() => handleNavigate('/security')}>
          <ListItemIcon>
            <SecurityIcon fontSize="small" />
          </ListItemIcon>
          Security
        </MenuItem>
        <MenuItem onClick={() => handleNavigate('/sessions')}>
          <ListItemIcon>
            <SessionsIcon fontSize="small" />
          </ListItemIcon>
          Sessions
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </Box>
  );
}

