import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Typography,
  Tooltip,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Security as RolesIcon,
  Brightness4,
  Brightness7,
  Notifications as NotificationsIcon,
  ExpandMore,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Header.jsx updated
export default function Header({ handleDrawerToggle, mode, toggleColorMode, user, handleLogout }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  // Removed internal auth error handling and query, assuming parent handles it or passes user.


  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          {/* Hamburger Menu - Mobile Only */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo / Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RolesIcon sx={{ color: 'white', fontSize: 18 }} />
            </Box>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                fontWeight: 700,
                fontSize: '1.1rem',
                background: mode === 'dark'
                  ? 'linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 100%)'
                  : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              Auth Admin
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Right side actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
            <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
              <IconButton onClick={toggleColorMode} size="small" sx={{ bgcolor: theme.palette.action.hover, '&:hover': { bgcolor: theme.palette.action.selected } }}>
                {mode === 'dark' ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Notifications">
              <IconButton size="small" sx={{ bgcolor: theme.palette.action.hover, '&:hover': { bgcolor: theme.palette.action.selected } }}>
                <NotificationsIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: { xs: 0.5, sm: 1 }, height: 24, alignSelf: 'center', display: { xs: 'none', sm: 'block' } }} />

            {/* User Menu */}
            {user && (
              <Box
                onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  cursor: 'pointer',
                  py: 0.5,
                  px: { xs: 0.5, sm: 1.5 },
                  borderRadius: 2,
                  transition: 'background 0.2s',
                  '&:hover': { bgcolor: theme.palette.action.hover }
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  }}
                >
                  {(user.email || user.username || 'U').charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                    {user.firstName || user.username?.split('@')[0] || 'User'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                    {user.email || 'admin'}
                  </Typography>
                </Box>
                <ExpandMore fontSize="small" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }} />
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* User Dropdown Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={() => setUserMenuAnchor(null)}
        PaperProps={{
          elevation: 0,
          sx: {
            mt: 1.5,
            minWidth: 200,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            '& .MuiMenuItem-root': { borderRadius: 1, mx: 1, my: 0.5, px: 2 }
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => { navigate('/account'); setUserMenuAnchor(null); }}>
          <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
          My Account
        </MenuItem>
        <MenuItem onClick={() => setUserMenuAnchor(null)}>
          <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
          Settings
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={() => { handleLogout(); setUserMenuAnchor(null); }} sx={{ color: 'error.main' }}>
          <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
}
