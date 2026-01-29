
// admin-ui/src/components/realm/RealmClients.jsx

import { useState } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, FormControlLabel, Switch,
  Menu, MenuItem
} from '@mui/material';
import {
  Add as AddIcon, Apps as AppsIcon, MoreVert as MoreIcon,
  Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon,
  VpnKey as KeyIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import api, { extractData } from '../../services/api';

function RealmClients({ realmName }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [openCreate, setOpenCreate] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [formData, setFormData] = useState({
    clientId: '',
    name: '',
    description: '',
    enabled: true,
    publicClient: false,
    standardFlowEnabled: true,
    directAccessGrantsEnabled: true,
    serviceAccountsEnabled: false,
    redirectUris: ['']
  });

  // ✅ Updated to match /clients route with realm filter
  const { data: clients = [] } = useQuery({
    queryKey: ['realm-clients', realmName],
    queryFn: () => api.get(`/clients?realm=${realmName}`).then(extractData),
    enabled: !!realmName,
  });

  // ✅ Updated to match POST /clients route
  const createClientMutation = useMutation({
    mutationFn: (clientData) => api.post('/clients', { ...clientData, realm: realmName }),
    onSuccess: () => {
      queryClient.invalidateQueries(['realm-clients', realmName]);
      setOpenCreate(false);
      setFormData({
        clientId: '', name: '', description: '', enabled: true,
        publicClient: false, standardFlowEnabled: true,
        directAccessGrantsEnabled: true, serviceAccountsEnabled: false,
        redirectUris: ['']
      });
    },
    onError: (error) => {
      enqueueSnackbar(`Failed to create client: ${error.response?.data?.message || error.message}`, { variant: 'error' });
    }
  });

  // ✅ Updated to match DELETE /clients/:clientId route
  const deleteClientMutation = useMutation({
    mutationFn: (clientId) => api.delete(`/clients/${clientId}?realm=${realmName}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['realm-clients', realmName]);
      setAnchorEl(null);
    },
    onError: (error) => {
      enqueueSnackbar(`Failed to delete client: ${error.response?.data?.message || error.message}`, { variant: 'error' });
    }
  });

  // ✅ Added regenerate secret functionality
  const regenerateSecretMutation = useMutation({
    mutationFn: (clientId) => api.post(`/clients/${clientId}/regenerate-secret?realm=${realmName}`),
    onSuccess: (data) => {
      enqueueSnackbar(`New client secret: ${data.data.secret}`, { variant: 'success', autoHideDuration: 10000 });
      setAnchorEl(null);
    },
    onError: (error) => {
      enqueueSnackbar(`Failed to regenerate secret: ${error.response?.data?.message || error.message}`, { variant: 'error' });
    }
  });

  const handleCreateClient = () => {
    if (!formData.clientId) {
      enqueueSnackbar('Client ID is required', { variant: 'warning' });
      return;
    }
    createClientMutation.mutate(formData);
  };

  const handleMenuClick = (event, client) => {
    setAnchorEl(event.currentTarget);
    setSelectedClient(client);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedClient(null);
  };

  const handleDeleteClient = () => {
    if (selectedClient && confirm(`Are you sure you want to delete client ${selectedClient.clientId}?`)) {
      deleteClientMutation.mutate(selectedClient.clientId);
    }
  };

  const handleRegenerateSecret = () => {
    if (selectedClient && confirm(`Regenerate secret for ${selectedClient.clientId}?`)) {
      regenerateSecretMutation.mutate(selectedClient.clientId);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Clients in {realmName}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreate(true)}
        >
          Create Client
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Client ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Protocol</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>{client.clientId}</TableCell>
                <TableCell>{client.name || '-'}</TableCell>
                <TableCell>{client.description || '-'}</TableCell>
                <TableCell>{client.protocol || 'openid-connect'}</TableCell>
                <TableCell>
                  <Chip 
                    label={client.enabled ? 'Enabled' : 'Disabled'} 
                    color={client.enabled ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={client.publicClient ? 'Public' : 'Confidential'} 
                    color={client.publicClient ? 'info' : 'primary'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={(e) => handleMenuClick(e, client)}>
                    <MoreIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {clients.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No clients found in this realm
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Client Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleMenuClose}>
          <ViewIcon sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <EditIcon sx={{ mr: 1 }} /> Edit Client
        </MenuItem>
        {!selectedClient?.publicClient && (
          <MenuItem onClick={handleRegenerateSecret}>
            <KeyIcon sx={{ mr: 1 }} /> Regenerate Secret
          </MenuItem>
        )}
        <MenuItem onClick={handleDeleteClient} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} /> Delete Client
        </MenuItem>
      </Menu>

      {/* Create Client Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Client</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Client ID"
            fullWidth
            variant="outlined"
            value={formData.clientId}
            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Redirect URIs"
            fullWidth
            variant="outlined"
            value={formData.redirectUris[0]}
            onChange={(e) => setFormData({ ...formData, redirectUris: [e.target.value] })}
            placeholder="http://localhost:4000/auth/callback/clientKey*"
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              />
            }
            label="Enabled"
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.publicClient}
                onChange={(e) => setFormData({ ...formData, publicClient: e.target.checked })}
              />
            }
            label="Public Client"
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.standardFlowEnabled}
                onChange={(e) => setFormData({ ...formData, standardFlowEnabled: e.target.checked })}
              />
            }
            label="Standard Flow"
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.directAccessGrantsEnabled}
                onChange={(e) => setFormData({ ...formData, directAccessGrantsEnabled: e.target.checked })}
              />
            }
            label="Direct Access Grants"
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.serviceAccountsEnabled}
                onChange={(e) => setFormData({ ...formData, serviceAccountsEnabled: e.target.checked })}
              />
            }
            label="Service Accounts"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateClient} 
            variant="contained"
            disabled={createClientMutation.isLoading}
          >
            {createClientMutation.isLoading ? 'Creating...' : 'Create Client'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default RealmClients;