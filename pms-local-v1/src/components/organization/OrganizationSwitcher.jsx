/**
 * @fileoverview Organization Switcher
 * @description MUI-based dropdown for switching between organizations
 * Includes option to create new organization via modal
 */

import { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Add as AddIcon,
  CheckCircle as CheckIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';
import authConfig from '../../config/authConfig';
import CreateOrganizationModal from './CreateOrganizationModal';
import { useOrganization } from '../../context/OrganizationContext';

export default function OrganizationSwitcher() {
  const theme = useTheme();
  const { 
    organizations, 
    currentOrganization, 
    switchOrganization,
    organizationCount 
  } = useOrganization();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const open = Boolean(anchorEl);

  // Check for single org mode
  const isSingleOrgMode = authConfig.organizationModel === 'single';

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSwitch = (orgId) => {
    switchOrganization(orgId);
    handleClose();
  };

  const handleCreateClick = () => {
    handleClose();
    setCreateModalOpen(true);
  };

  const handleCreateSuccess = (newOrg) => {
    console.log('✅ New organization created:', newOrg?.name);
  };

  // Don't render if single org mode and only one org
  if (isSingleOrgMode && organizationCount <= 1) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleClick}
        endIcon={<ArrowDownIcon />}
        sx={{
          textTransform: 'none',
          color: 'text.primary',
          backgroundColor: alpha(theme.palette.primary.main, 0.08),
          borderRadius: 2,
          px: 2,
          py: 1,
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.15),
          },
        }}
      >
        <BusinessIcon sx={{ mr: 1, fontSize: 20, color: theme.palette.primary.main }} />
        <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 150 }}>
          {currentOrganization?.name || 'Select Organization'}
        </Typography>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 8,
          sx: {
            minWidth: 280,
            maxWidth: 320,
            borderRadius: 2,
            mt: 1,
            border: theme.palette.mode === 'dark' 
              ? `1px solid ${alpha(theme.palette.divider, 0.2)}`
              : 'none',
          },
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
            Switch Organization
          </Typography>
        </Box>

        {/* Organization List */}
        {organizations.map((org) => {
          const isActive = currentOrganization?.id === org.id;
          
          return (
            <MenuItem
              key={org.id}
              onClick={() => handleSwitch(org.id)}
              selected={isActive}
              sx={{
                py: 1.5,
                px: 2,
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              <ListItemIcon>
                <BusinessIcon 
                  fontSize="small" 
                  sx={{ 
                    color: isActive ? theme.palette.primary.main : 'text.secondary' 
                  }} 
                />
              </ListItemIcon>
              <ListItemText 
                primary={org.name}
                secondary={org.role?.name || (org.isPrimary ? 'Owner' : 'Member')}
                primaryTypographyProps={{ fontWeight: isActive ? 600 : 400 }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
              {isActive && (
                <CheckIcon fontSize="small" sx={{ color: theme.palette.primary.main, ml: 1 }} />
              )}
              {org.isPrimary && (
                <Chip 
                  label="Primary" 
                  size="small" 
                  sx={{ 
                    ml: 1, 
                    height: 20,
                    fontSize: '0.65rem',
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                    color: theme.palette.success.main,
                  }} 
                />
              )}
            </MenuItem>
          );
        })}

        {/* Divider and Create Option */}
        <Divider sx={{ my: 1 }} />
        
        <MenuItem 
          onClick={handleCreateClick}
          sx={{ 
            py: 1.5, 
            px: 2,
            color: theme.palette.primary.main,
          }}
        >
          <ListItemIcon>
            <AddIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
          </ListItemIcon>
          <ListItemText 
            primary="Create New Organization"
            primaryTypographyProps={{ fontWeight: 500 }}
          />
        </MenuItem>
      </Menu>

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}