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
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import roleService from '../../services/roleService';
import userService from '../../services/userService';
import clientService from '../../services/clientService';

function UserClientRoleMapper({ realmName, userId }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);

  // Fetch Clients
  const { data: clients = [] } = useQuery({
    queryKey: ['clients', realmName],
    queryFn: () => clientService.getAllClients({ realm: realmName }),
    select: (data) => data.data || data
  });

  // Fetch Assigned Client Roles (for selected client)
  const { data: assignedRoles = [], isLoading: loadingAssigned } = useQuery({
    queryKey: ['user-client-roles', realmName, userId, selectedClient],
    queryFn: () => userService.getUserClientRoles(userId, selectedClient, realmName),
    enabled: !!selectedClient
  });

  // Fetch Available Client Roles (for selected client)
  const { data: allRoles = [] } = useQuery({
    queryKey: ['client-roles', realmName, selectedClient],
    queryFn: () => roleService.getClientRoles(selectedClient, realmName),
    enabled: !!selectedClient
  });

  // Filter available roles
  const availableRoles = allRoles.filter(
    role => !assignedRoles.some(ar => ar.name === role.name)
  );

  // Add Roles Mutation
  const addMutation = useMutation({
    mutationFn: (roles) => userService.assignClientRoles(userId, selectedClient, roles, realmName),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-client-roles', realmName, userId, selectedClient]);
      enqueueSnackbar('Client roles assigned successfully', { variant: 'success' });
      setOpen(false);
      setSelectedRoles([]);
    },
    onError: (err) => {
      enqueueSnackbar(err.message || 'Failed to assign client roles', { variant: 'error' });
    }
  });

  // Remove Role Mutation
  const removeMutation = useMutation({
    mutationFn: (roles) => userService.removeClientRoles(userId, selectedClient, roles, realmName),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-client-roles', realmName, userId, selectedClient]);
      enqueueSnackbar('Client role removed successfully', { variant: 'success' });
    },
    onError: (err) => {
      enqueueSnackbar(err.message || 'Failed to remove client role', { variant: 'error' });
    }
  });

  const handleAddRoles = () => {
    addMutation.mutate(selectedRoles);
  };

  return (
    <Box mt={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Client Roles</Typography>
        <Box display="flex" gap={2}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Select Client</InputLabel>
                <Select
                    value={selectedClient}
                    label="Select Client"
                    onChange={(e) => setSelectedClient(e.target.value)}
                >
                    {clients.map((client) => (
                        <MenuItem key={client.id} value={client.id}>
                            {client.clientId}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <Button 
            startIcon={<AddIcon />} 
            variant="outlined" 
            onClick={() => setOpen(true)}
            disabled={!selectedClient}
            >
            Assign Role
            </Button>
        </Box>
      </Box>

      {!selectedClient ? (
          <Typography color="text.secondary">Please select a client to view roles</Typography>
      ) : loadingAssigned ? (
          <CircularProgress />
      ) : (
        <List dense>
            {assignedRoles.length === 0 ? (
            <Typography color="text.secondary">No roles assigned for this client</Typography>
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
      )}

      {/* Assign Roles Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Client Roles</DialogTitle>
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

export default UserClientRoleMapper;
