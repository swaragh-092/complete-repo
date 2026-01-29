import React, { useState } from 'react';
import { 
  Box, 
  FormControl, 
  Select, 
  MenuItem, 
  Typography, 
  colors, 
  Divider,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import { Add as AddIcon, Workspaces as WorkspaceIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { useWorkspace } from '../../context/WorkspaceContext';
import CreateWorkspaceModal from './CreateWorkspaceModal';
import { useNavigate } from 'react-router-dom';

export default function WorkspaceSwitcher() {
  const { workspaces, currentWorkspace, selectWorkspace } = useWorkspace();
  const [openModal, setOpenModal] = useState(false);

  const selectedValue = currentWorkspace?.workspace?.id || '';

  const handleChange = (event) => {
    const value = event.target.value;
    if (value === 'create_new') {
      setOpenModal(true);
    } else {
      const selected = workspaces.find(w => w.workspace.id === value);
      selectWorkspace(selected);
    }
  };

  const navigate = useNavigate();

  if (workspaces.length === 0) {
      // Show simple create button if no workspaces
      return (
          <>
            <Box sx={{ p: 2 }}>
                <Button 
                    variant="outlined" 
                    fullWidth 
                    startIcon={<AddIcon />} 
                    onClick={() => setOpenModal(true)}
                    size="small"
                >
                    Create Workspace
                </Button>
            </Box>
            <CreateWorkspaceModal open={openModal} onClose={() => setOpenModal(false)} />
          </>
      )
  }

  return (
    <>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <FormControl fullWidth size="small">
          <Select
            value={selectedValue}
            onChange={handleChange}
            displayEmpty
            renderValue={(selected) => {
              if (!selected) {
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WorkspaceIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">Select Workspace</Typography>
                  </Box>
                );
              }
              const workspace = workspaces.find(w => w.workspace.id === selected)?.workspace;
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WorkspaceIcon fontSize="small" sx={{ color: 'primary.main' }} />
                  <Typography variant="body2" fontWeight={600}>{workspace?.name}</Typography>
                </Box>
              );
            }}
            sx={{
              bgcolor: 'background.paper',
              '& .MuiSelect-select': { py: 1 }
            }}
          >
            <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', color: 'text.secondary' }}>
              YOUR WORKSPACES
            </Typography>
            
            {workspaces.map((m) => (
              <MenuItem key={m.workspace.id} value={m.workspace.id}>
                {m.workspace.name} ({m.role})
              </MenuItem>
            ))}

            <Divider sx={{ my: 1 }} />
            
            <MenuItem value="create_new" sx={{ color: 'primary.main' }}>
              <AddIcon fontSize="small" sx={{ mr: 1 }} />
              Create New...
            </MenuItem>
          </Select>
        </FormControl>

        {currentWorkspace && (
             <Tooltip title="Workspace Settings">
                 <IconButton 
                    size="small" 
                    onClick={() => navigate(`/workspaces/${currentWorkspace.workspace.id}/settings`)}
                 >
                     <SettingsIcon fontSize="small" />
                 </IconButton>
             </Tooltip>
        )}
      </Box>

      <CreateWorkspaceModal open={openModal} onClose={() => setOpenModal(false)} />
    </>
  );
}
