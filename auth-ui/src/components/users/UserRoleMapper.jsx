import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  CircularProgress
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import roleService from '../../services/roleService';
import userService from '../../services/userService';

function UserRoleMapper({ realmName, userId }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);

  // Fetch assigned roles
  const { data: assignedRoles = [], isLoading: loadingAssigned } = useQuery({
    queryKey: ['user-roles', realmName, userId],
    queryFn: () => userService.getUserRealmRoles(userId, realmName)
  });

  // Fetch all available roles
  const { data: allRoles = [] } = useQuery({
    queryKey: ['realm-roles', realmName],
    queryFn: () => roleService.getRealmRoles(realmName)
  });

  // Filter available roles (exclude assigned)
  const availableRoles = allRoles.filter(
    role => !assignedRoles.some(ar => ar.name === role.name)
  );

  // Add Roles Mutation
  const addMutation = useMutation({
    mutationFn: (roles) => userService.assignRealmRoles(userId, roles, realmName),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-roles', realmName, userId]);
      enqueueSnackbar('Roles assigned successfully', { variant: 'success' });
      setOpen(false);
      setSelectedRoles([]);
    },
    onError: (err) => {
      enqueueSnackbar(err.message || 'Failed to assign roles', { variant: 'error' });
    }
  });

  // Remove Role Mutation
  const removeMutation = useMutation({
    mutationFn: (roles) => userService.removeRealmRoles(userId, roles, realmName),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-roles', realmName, userId]);
      enqueueSnackbar('Role removed successfully', { variant: 'success' });
    },
    onError: (err) => {
      enqueueSnackbar(err.message || 'Failed to remove role', { variant: 'error' });
    }
  });

  const handleAddRoles = () => {
    addMutation.mutate(selectedRoles);
  };

  if (loadingAssigned) return <CircularProgress />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Realm Roles</Typography>
        <Button 
          startIcon={<AddIcon />} 
          variant="outlined" 
          onClick={() => setOpen(true)}
        >
          Assign Role
        </Button>
      </Box>

      <List dense>
        {assignedRoles.length === 0 ? (
          <Typography color="text.secondary">No roles assigned</Typography>
        ) : (
          assignedRoles.map((role) => (
            <ListItem key={role.id || role.name}>
              <ListItemText 
                primary={role.name} 
                secondary={role.description} 
              />
              <ListItemSecondaryAction>
                <IconButton 
                  edge="end" 
                  onClick={() => removeMutation.mutate([role.name])}
                  disabled={removeMutation.isPending}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))
        )}
      </List>

      {/* Assign Roles Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Roles</DialogTitle>
        <DialogContent>
          <List>
            {availableRoles.length === 0 ? (
              <Typography sx={{ p: 2 }}>No available roles to assign</Typography>
            ) : (
              availableRoles.map((role) => (
                <ListItem key={role.id || role.name} button onClick={() => {
                  if (selectedRoles.includes(role.name)) {
                    setSelectedRoles(prev => prev.filter(r => r !== role.name));
                  } else {
                    setSelectedRoles(prev => [...prev, role.name]);
                  }
                }}>
                  <Checkbox 
                    checked={selectedRoles.includes(role.name)}
                    tabIndex={-1}
                    disableRipple
                  />
                  <ListItemText primary={role.name} secondary={role.description} />
                </ListItem>
              ))
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddRoles} 
            variant="contained" 
            disabled={selectedRoles.length === 0 || addMutation.isPending}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UserRoleMapper;
