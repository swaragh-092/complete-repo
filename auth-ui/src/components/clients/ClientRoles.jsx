import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useForm } from 'react-hook-form';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import roleService from '../../services/roleService';

function ClientRoles({ realmName, clientId }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Fetch Roles
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['client-roles', realmName, clientId],
    queryFn: () => roleService.getClientRoles(clientId, realmName)
  });

  // Create/Update Mutation
  const mutation = useMutation({
    mutationFn: (data) => {
      if (editingRole) {
        return roleService.updateClientRole(clientId, editingRole.name, data, realmName);
      }
      return roleService.createClientRole(clientId, data, realmName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['client-roles', realmName, clientId]);
      enqueueSnackbar(`Role ${editingRole ? 'updated' : 'created'} successfully`, { variant: 'success' });
      handleClose();
    },
    onError: (err) => {
      enqueueSnackbar(err.message || 'Operation failed', { variant: 'error' });
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (roleName) => roleService.deleteClientRole(clientId, roleName, realmName),
    onSuccess: () => {
      queryClient.invalidateQueries(['client-roles', realmName, clientId]);
      enqueueSnackbar('Role deleted successfully', { variant: 'success' });
    },
    onError: (err) => {
      enqueueSnackbar(err.message || 'Delete failed', { variant: 'error' });
    }
  });

  const handleOpen = (role = null) => {
    setEditingRole(role);
    if (role) {
      setValue('name', role.name);
      setValue('description', role.description);
    } else {
      reset();
    }
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setEditingRole(null);
    reset();
  };

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  if (isLoading) return <CircularProgress />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Client Roles</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
          size="small"
        >
          Add Role
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    No roles found for this client.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              roles.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((role) => (
                <TableRow key={role.id || role.name}>
                  <TableCell>{role.name}</TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpen(role)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => {
                          if (window.confirm(`Delete role ${role.name}?`)) {
                            deleteMutation.mutate(role.name);
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={roles.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <TextField
              label="Role Name"
              fullWidth
              margin="normal"
              {...register('name', { required: 'Role name is required' })}
              error={!!errors.name}
              helperText={errors.name?.message}
              disabled={!!editingRole} // Keycloak usually doesn't allow renaming roles easily via ID
            />
            <TextField
              label="Description"
              fullWidth
              margin="normal"
              multiline
              rows={3}
              {...register('description')}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default ClientRoles;
