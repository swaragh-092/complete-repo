import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Typography, 
  Collapse, 
  Alert, 
  Toolbar,
  useTheme,
  useMediaQuery 
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Apps as ClientsIcon,
  Domain as RealmsIcon,
  History as AuditIcon,
  Security as RolesIcon,
  Assignment as RequestsIcon,
  Business as OrganizationIcon,
  VpnKey as PermissionIcon,
  GroupWork as MembershipIcon,
  Person as AccountIcon,
  ExpandLess,
  ExpandMore,
  Storage as DatabaseIcon,
  Widgets as AppsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import WorkspaceSwitcher from '../workspaces/WorkspaceSwitcher';

const drawerWidth = 280;

// Navigation Data
const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Account', icon: <AccountIcon />, path: '/account' }
];

const keycloakItems = [
  { text: 'Realms', icon: <RealmsIcon />, path: '/realms' },
  { text: 'Clients', icon: <ClientsIcon />, path: '/clients' },
  { text: 'Applications', icon: <AppsIcon />, path: '/applications' },
  { text: 'Client Requests', icon: <RequestsIcon />, path: '/client-requests' },
  { text: 'Audit Logs', icon: <AuditIcon />, path: '/audit-logs' }
];

const databaseItems = [
  { text: 'Organizations', icon: <OrganizationIcon />, path: '/organizations' },
  { text: 'Database Roles', icon: <RolesIcon />, path: '/database-roles' },
  { text: 'Permissions', icon: <PermissionIcon />, path: '/permissions' },
  { text: 'Memberships', icon: <MembershipIcon />, path: '/memberships' },
  { text: 'Onboarding', icon: <MembershipIcon />, path: '/onboarding' }
];

export default function Sidebar({ mobileOpen, handleDrawerToggle, error, onCloseError }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [keycloakMenuOpen, setKeycloakMenuOpen] = useState(false);
  const [databaseMenuOpen, setDatabaseMenuOpen] = useState(false);

  // Auto-expand menus based on active route
  useEffect(() => {
    const path = location.pathname;
    if (keycloakItems.some(item => path.startsWith(item.path))) {
      setKeycloakMenuOpen(true);
    }
    if (databaseItems.some(item => path.startsWith(item.path))) {
      setDatabaseMenuOpen(true);
    }
  }, [location.pathname]);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) {
      handleDrawerToggle();
    }
  };

  const drawerContent = (
    <>
      <Toolbar />
      {error && (
        <Alert severity="error" onClose={onCloseError} sx={{ m: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}
      <Box sx={{ px: 2, py: 2, overflowY: 'auto', height: '100%' }}>
        {/* Workspace Switcher - REMOVED: Workspaces should be created from Organization Detail page */}
        {/* <WorkspaceSwitcher /> */}
        
        {/* Main Menu Items */}
        <List sx={{ p: 0 }}>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => handleNavigate(item.path)}
              selected={isActive(item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                py: 1,
                transition: 'all 0.2s',
                '&.Mui-selected': {
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                  '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' },
                  '& .MuiListItemIcon-root': { color: 'white' },
                },
                '&:not(.Mui-selected):hover': { bgcolor: theme.palette.action.hover }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: isActive(item.path) ? 'inherit' : theme.palette.text.secondary }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: isActive(item.path) ? 600 : 500, fontSize: '0.875rem' }} />
            </ListItem>
          ))}
        </List>

        {/* Keycloak Management Section */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="caption" sx={{ px: 1.5, py: 1, display: 'block', color: theme.palette.text.secondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
            Keycloak
          </Typography>
          <List sx={{ p: 0 }}>
            <ListItem button onClick={() => setKeycloakMenuOpen(!keycloakMenuOpen)} sx={{ borderRadius: 2, mb: 0.5, py: 1, '&:hover': { bgcolor: theme.palette.action.hover } }}>
              <ListItemIcon sx={{ minWidth: 36, color: theme.palette.text.secondary }}><RealmsIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Management" primaryTypographyProps={{ fontWeight: 500, fontSize: '0.875rem' }} />
              {keycloakMenuOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            </ListItem>
            <Collapse in={keycloakMenuOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding sx={{ pl: 1 }}>
                {keycloakItems.map((item) => (
                  <ListItem
                    button
                    key={item.text}
                    onClick={() => handleNavigate(item.path)}
                    selected={isActive(item.path)}
                    sx={{
                      py: 0.75, pl: 3, borderRadius: 2, mb: 0.25, transition: 'all 0.2s',
                      '&.Mui-selected': {
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        color: 'white',
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)',
                        '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' },
                        '& .MuiListItemIcon-root': { color: 'white' },
                      },
                      '&:not(.Mui-selected):hover': { bgcolor: theme.palette.action.hover }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32, color: isActive(item.path) ? 'inherit' : theme.palette.text.secondary }}>
                      {React.cloneElement(item.icon, { fontSize: 'small' })}
                    </ListItemIcon>
                    <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: isActive(item.path) ? 600 : 400, fontSize: '0.8rem' }} />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </List>
        </Box>

        {/* Database Management Section */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" sx={{ px: 1.5, py: 1, display: 'block', color: theme.palette.text.secondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
            Database
          </Typography>
          <List sx={{ p: 0 }}>
            <ListItem button onClick={() => setDatabaseMenuOpen(!databaseMenuOpen)} sx={{ borderRadius: 2, mb: 0.5, py: 1, '&:hover': { bgcolor: theme.palette.action.hover } }}>
              <ListItemIcon sx={{ minWidth: 36, color: theme.palette.text.secondary }}><DatabaseIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Management" primaryTypographyProps={{ fontWeight: 500, fontSize: '0.875rem' }} />
              {databaseMenuOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            </ListItem>
            <Collapse in={databaseMenuOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding sx={{ pl: 1 }}>
                {databaseItems.map((item) => (
                  <ListItem
                    button
                    key={item.text}
                    onClick={() => handleNavigate(item.path)}
                    selected={isActive(item.path)}
                    sx={{
                      py: 0.75, pl: 3, borderRadius: 2, mb: 0.25, transition: 'all 0.2s',
                      '&.Mui-selected': {
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        color: 'white',
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)',
                        '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' },
                        '& .MuiListItemIcon-root': { color: 'white' },
                      },
                      '&:not(.Mui-selected):hover': { bgcolor: theme.palette.action.hover }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32, color: isActive(item.path) ? 'inherit' : theme.palette.text.secondary }}>
                      {React.cloneElement(item.icon, { fontSize: 'small' })}
                    </ListItemIcon>
                    <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: isActive(item.path) ? 600 : 400, fontSize: '0.8rem' }} />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </List>
        </Box>
      </Box>
    </>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
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
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
