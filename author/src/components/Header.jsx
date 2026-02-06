/**
 * @fileoverview Header Component (MUI Version)
 * @description Application header with user menu - matches centalized-login patterns
 * @matches centalized-login MUI styling
 */

import { useState, useEffect } from 'react';
import { auth, useAuth } from '@spidy092/auth-client';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout,
  Dashboard as DashboardIcon,
  Settings,
} from '@mui/icons-material';

import { useOrganization } from '../context/OrganizationContext';


export default function Header({ onMenuClick }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  
  const [orgAnchorEl, setOrgAnchorEl] = useState(null);
  const { currentOrganization, organizations, switchOrganization } = useOrganization();
  

  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  
  const handleOrgMenuOpen = (event) => {
    setOrgAnchorEl(event.currentTarget);
  };

  const handleOrgMenuClose = () => {
    setOrgAnchorEl(null);
  };

  const handleOrgSwitch = (orgId) => {
    switchOrganization(orgId);
    handleOrgMenuClose();
  };
  

  // ✅ Logout - matches centalized-login pattern
  const handleSignOut = async () => {
    handleUserMenuClose();
    try {
      console.log('🚪 Logging out...');
      auth.clearToken();
      auth.clearRefreshToken();
      await auth.logout();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      navigate('/login');
    }
  };

  const getUserInitial = () => {
    const name = user?.firstName || user?.name || user?.username || user?.email || 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <AppBar 
      position="fixed" 
      color="inherit" 
      elevation={1}
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        {/* Menu Button */}
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        {/* App Title */}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          author
        </Typography>

        
        {/* Organization Switcher */}
        <Chip
          icon={<DashboardIcon />}
          label={currentOrganization?.name || 'Select Organization'}
          onClick={handleOrgMenuOpen}
          variant="outlined"
          sx={{ mr: 2 }}
        />
        <Menu
          anchorEl={orgAnchorEl}
          open={Boolean(orgAnchorEl)}
          onClose={handleOrgMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', color: 'text.secondary' }}>
            Switch Organization
          </Typography>
          <Divider />
          {organizations.map((org) => (
            <MenuItem
              key={org.id || org.org_id}
              onClick={() => handleOrgSwitch(org.id || org.org_id)}
              selected={(currentOrganization?.id || currentOrganization?.org_id) === (org.id || org.org_id)}
            >
              {org.name || org.org_name}
            </MenuItem>
          ))}
          <Divider />
          <MenuItem onClick={() => { handleOrgMenuClose(); navigate('/create-organization'); }}>
            <ListItemIcon>+</ListItemIcon>
            <ListItemText>Create New Organization</ListItemText>
          </MenuItem>
        </Menu>
        

        {/* User Menu */}
        <IconButton onClick={handleUserMenuOpen} sx={{ p: 0 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {getUserInitial()}
          </Avatar>
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleUserMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              minWidth: 200,
              mt: 1,
            }
          }}
        >
          {/* User Info */}
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {user?.name || user?.preferred_username || 'User'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
          <Divider />

          {/* Profile Link */}
          <MenuItem 
            onClick={() => { 
              handleUserMenuClose(); 
              window.open(import.meta.env.VITE_ACCOUNT_UI_URL + '/profile', '_blank');
            }}
          >
            <ListItemIcon>
              <AccountCircle fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Profile</ListItemText>
          </MenuItem>

          <MenuItem 
            onClick={() => { 
              handleUserMenuClose(); 
              window.open(import.meta.env.VITE_ACCOUNT_UI_URL + '/settings', '_blank');
            }}
          >
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            <ListItemText>Settings</ListItemText>
          </MenuItem>

          <Divider />

          {/* Sign Out */}
          <MenuItem onClick={handleSignOut} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <Logout fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Sign Out</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
