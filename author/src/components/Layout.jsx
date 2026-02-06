/**
 * @fileoverview Responsive Layout Component
 * @description Modern responsive layout with MUI AppBar, Drawer (sidebar), and responsive behavior
 */

import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { auth } from '@spidy092/auth-client';
import {
  AppBar,
  Avatar,
  Box,
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
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Person as ProfileIcon,
  Business as OrgIcon,
  GroupAdd as InviteIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Brightness4,
  Brightness7,
} from '@mui/icons-material';

import { useOrganization } from '../context/OrganizationContext';
import { useWorkspace } from '../context/WorkspaceContext';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import CreateOrganizationModal from './organization/CreateOrganizationModal';


const drawerWidth = 280;

export default function Layout({ toggleColorMode, mode }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  
  const { currentOrganization, organizations, switchOrganization, loading: orgLoading } = useOrganization();
  const { currentWorkspace, hasWorkspace } = useWorkspace();
  const [orgMenuAnchor, setOrgMenuAnchor] = useState(null);
  const [createOrgModalOpen, setCreateOrgModalOpen] = useState(false);
  

  // Fetch user profile
  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await auth.api.get('/account/profile');
        // Extract from ResponseHandler wrapper
        const profileData = response.data?.data || response.data;
        setUser(profileData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  
  // Redirect if no organization selected
  useEffect(() => {
    if (!orgLoading && !currentOrganization) {
      navigate('/select-organization', { replace: true });
    }
  }, [currentOrganization, orgLoading, navigate]);
  

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const handleLogout = async () => {
    setUserMenuAnchor(null);
    try {
      await auth.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Invite Members', icon: <InviteIcon />, path: '/invite-members' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const getUserInitial = () => {
    const name = user?.firstName || user?.name || user?.username || user?.email || 'U';
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const drawerContent = (
    <>
      <Toolbar>
        <Typography variant="h6" fontWeight={700} color="primary">
          author
        </Typography>
      </Toolbar>
      <Divider />

      
      {/* Organization Info */}
      {currentOrganization && (
        <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1, m: 1.5 }}>
          <Typography variant="caption" color="text.secondary">Current Organization</Typography>
          <Typography variant="subtitle2" fontWeight={600}>{currentOrganization?.name || currentOrganization?.org_name}</Typography>
        </Box>
      )}
      

      <List sx={{ px: 1.5, flex: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={isActive(item.path)}
              onClick={() => handleNavigate(item.path)}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: 'white',
                  '& .MuiListItemIcon-root': { color: 'white' },
                  '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: isActive(item.path) ? 'inherit' : 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: isActive(item.path) ? 600 : 500 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">Logged in as</Typography>
        <Typography variant="body2" fontWeight={500}>{user?.firstName || user?.name || user?.email || 'User'}</Typography>
      </Box>
    </>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar>
          {/* Hamburger - Mobile only */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DashboardIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Typography variant="h6" fontWeight={700} sx={{ display: { xs: 'none', sm: 'block' } }}>
              author
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Right Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            
            {/* Organization Switcher */}
            <Tooltip title="Switch Organization">
              <IconButton onClick={(e) => setOrgMenuAnchor(e.currentTarget)}>
                <OrgIcon />
              </IconButton>
            </Tooltip>

            {/* Workspace Switcher */}
            {currentOrganization && (
              <Box sx={{ mx: 1 }}>
                <WorkspaceSwitcher variant="button" />
              </Box>
            )}
            

            {/* Theme Toggle */}
            {toggleColorMode && (
              <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
                <IconButton onClick={toggleColorMode}>
                  {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
              </Tooltip>
            )}

            {/* User Menu */}
            <Tooltip title="Account">
              <IconButton onClick={(e) => setUserMenuAnchor(e.currentTarget)}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '1rem' }}>
                  {getUserInitial()}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      
      {/* Organization Menu */}
      <Menu
        anchorEl={orgMenuAnchor}
        open={Boolean(orgMenuAnchor)}
        onClose={() => setOrgMenuAnchor(null)}
        PaperProps={{ sx: { minWidth: 250, borderRadius: 2, mt: 1 } }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">Switch Organization</Typography>
        </Box>
        <Divider />
        {organizations?.map((org, index) => (
          <MenuItem
            key={`org-${org.id || org.org_id}-${index}`}
            selected={(currentOrganization?.id || currentOrganization?.org_id) === (org.id || org.org_id)}
            onClick={() => { switchOrganization(org.id || org.org_id); setOrgMenuAnchor(null); }}
          >
            <ListItemIcon><OrgIcon fontSize="small" /></ListItemIcon>
            {org.name || org.org_name}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={() => { setOrgMenuAnchor(null); setCreateOrgModalOpen(true); }}>
          <ListItemIcon><OrgIcon fontSize="small" /></ListItemIcon>
          Create New Organization
        </MenuItem>
      </Menu>

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        open={createOrgModalOpen}
        onClose={() => setCreateOrgModalOpen(false)}
        onSuccess={(newOrg) => console.log('Created org:', newOrg?.name)}
      />
      

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={() => setUserMenuAnchor(null)}
        PaperProps={{ sx: { minWidth: 200, borderRadius: 2, mt: 1 } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={600}>{user?.firstName || user?.name || 'User'}</Typography>
          <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => { window.open(import.meta.env.VITE_ACCOUNT_UI_URL + '/profile', '_blank'); setUserMenuAnchor(null); }}>
          <ListItemIcon><ProfileIcon fontSize="small" /></ListItemIcon>
          My Profile
        </MenuItem>
        <MenuItem onClick={() => { navigate('/settings'); setUserMenuAnchor(null); }}>
          <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
          Sign Out
        </MenuItem>
      </Menu>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          minHeight: '100vh',
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
