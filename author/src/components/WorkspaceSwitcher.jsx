/**
 * @fileoverview Workspace Switcher Component
 * @description Enterprise-grade dropdown for switching between workspaces
 * @version 1.0.0
 * 
 * Features:
 * - Current workspace display
 * - Workspace list with roles
 * - Create new workspace option
 * - Responsive design
 * - Keyboard navigation
 */

import { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
  Divider,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Workspaces as WorkspaceIcon,
  Add as AddIcon,
  Check as CheckIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';
import { useWorkspace, WORKSPACE_ROLES } from '../context/WorkspaceContext';
import CreateWorkspaceModal from './organization/CreateWorkspaceModal';

import { useOrganization } from '../context/OrganizationContext';


// ============================================================================
// Constants
// ============================================================================

/**
 * Role display configuration
 * @constant
 */
const ROLE_CONFIG = Object.freeze({
  [WORKSPACE_ROLES.VIEWER]: {
    label: 'Viewer',
    color: 'default'
  },
  [WORKSPACE_ROLES.EDITOR]: {
    label: 'Editor',
    color: 'primary'
  },
  [WORKSPACE_ROLES.ADMIN]: {
    label: 'Admin',
    color: 'secondary'
  }
});

// ============================================================================
// Component
// ============================================================================

/**
 * Workspace Switcher Component
 * Provides a dropdown menu for switching between workspaces
 * 
 * @param {Object} props - Component props
 * @param {boolean} [props.showCreateButton=true] - Whether to show create option
 * @param {string} [props.variant='button'] - Display variant: 'button' | 'compact'
 * @returns {JSX.Element}
 */
export default function WorkspaceSwitcher({ 
  showCreateButton = true,
  variant = 'button'
}) {
  const {
    workspaces,
    currentWorkspace,
    selectWorkspace,
    loading,
    isAdmin
  } = useWorkspace();

  
  const { currentOrganization } = useOrganization();
  

  const [anchorEl, setAnchorEl] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  
  const isOpen = Boolean(anchorEl);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectWorkspace = (workspace) => {
    selectWorkspace(workspace);
    handleClose();
  };

  const handleCreateClick = () => {
    handleClose();
    setCreateModalOpen(true);
  };

  const handleWorkspaceCreated = () => {
    setCreateModalOpen(false);
    // Workspace is auto-selected in context
  };

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const getRoleConfig = (role) => {
    return ROLE_CONFIG[role] || ROLE_CONFIG[WORKSPACE_ROLES.VIEWER];
  };

  // ============================================================================
  // Loading State
  // ============================================================================

  if (loading && workspaces.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2 }}>
        <CircularProgress size={16} />
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  // ============================================================================
  // Empty State
  // ============================================================================

  if (workspaces.length === 0 && !currentWorkspace) {
    return (
      <>
        <Tooltip title="Create your first workspace">
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setCreateModalOpen(true)}
            sx={{ 
              textTransform: 'none',
              borderRadius: 2
            }}
          >
            Create Workspace
          </Button>
        </Tooltip>
        
        <CreateWorkspaceModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreated={handleWorkspaceCreated}
          
          orgId={currentOrganization?.id}
          
        />
      </>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <>
      {/* Trigger Button */}
      <Tooltip title={currentWorkspace ? `Current: ${currentWorkspace.name}` : 'Select workspace'}>
        <Button
          onClick={handleOpen}
          variant={variant === 'compact' ? 'text' : 'outlined'}
          size="small"
          startIcon={<WorkspaceIcon />}
          endIcon={<ArrowDownIcon />}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            minWidth: variant === 'compact' ? 'auto' : 160,
            maxWidth: 200,
            justifyContent: 'space-between',
            '& .MuiButton-startIcon': {
              mr: variant === 'compact' ? 0 : 1
            }
          }}
        >
          {variant !== 'compact' && (
            <Typography
              variant="body2"
              noWrap
              sx={{ 
                flex: 1, 
                textAlign: 'left',
                fontWeight: 500
              }}
            >
              {currentWorkspace?.name || 'Select Workspace'}
            </Typography>
          )}
        </Button>
      </Tooltip>

      {/* Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        PaperProps={{
          sx: {
            minWidth: 280,
            maxWidth: 320,
            maxHeight: 400
          }
        }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            YOUR WORKSPACES
          </Typography>
        </Box>

        <Divider />

        {/* Workspace List */}
        {workspaces.map((workspace) => {
          const isSelected = currentWorkspace?.id === workspace.id;
          const roleConfig = getRoleConfig(workspace.role);

          return (
            <MenuItem
              key={workspace.id}
              onClick={() => handleSelectWorkspace(workspace)}
              selected={isSelected}
              sx={{
                py: 1.5,
                '&.Mui-selected': {
                  bgcolor: 'action.selected'
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {isSelected ? (
                  <CheckIcon color="primary" fontSize="small" />
                ) : (
                  <WorkspaceIcon color="action" fontSize="small" />
                )}
              </ListItemIcon>
              
              <ListItemText
                primary={
                  <Typography variant="body2" fontWeight={isSelected ? 600 : 400} noWrap>
                    {workspace.name}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {workspace.slug}
                  </Typography>
                }
              />
              
              <Chip
                label={roleConfig.label}
                size="small"
                variant="outlined"
                color={roleConfig.color}
                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
              />
            </MenuItem>
          );
        })}

        {/* Create New Option */}
        {showCreateButton && [
            <Divider key="create-divider" sx={{ my: 1 }} />,
            
            <MenuItem 
              key="create-button"
              onClick={handleCreateClick}
              sx={{ 
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText'
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <AddIcon color="primary" fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Typography variant="body2" fontWeight={500}>
                    Create New Workspace
                  </Typography>
                }
              />
            </MenuItem>
        ]}
      </Menu>

      {/* Create Modal */}
      <CreateWorkspaceModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleWorkspaceCreated}
        
        orgId={currentOrganization?.id}
        
      />
    </>
  );
}

// ============================================================================
// Exports
// ============================================================================

export { ROLE_CONFIG };
