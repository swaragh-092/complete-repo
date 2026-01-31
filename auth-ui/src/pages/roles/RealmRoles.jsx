import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  CircularProgress,
  Breadcrumbs,
  Link,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import roleService from '../../services/roleService';
import EmptyState from '../../components/EmptyState';
import SearchFilter from '../../components/SearchFilter';

function RealmRoles() {
  const { realmName } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');

  // Fetch Roles
  const { data: roles = [], isLoading, error } = useQuery({
    queryKey: ['realm-roles', realmName],
    queryFn: () => roleService.getRealmRoles(realmName)
  });

  // Client-side search filtering
  const filteredRoles = roles.filter(role =>
    role.name?.toLowerCase().includes(search.toLowerCase()) ||
    role.description?.toLowerCase().includes(search.toLowerCase())
  );

  // Handle search change
  const handleSearch = (value) => {
    setSearch(value);
    setPage(0); // Reset to first page on search
  };

  // Create/Update Mutation
  const mutation = useMutation({
    mutationFn: (data) => {
      if (editingRole) {
        return roleService.updateRealmRole(editingRole.name, data, realmName);
      }
      return roleService.createRealmRole(data, realmName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['realm-roles', realmName]);
      enqueueSnackbar(`Role ${editingRole ? 'updated' : 'created'} successfully`, { variant: 'success' });
      handleClose();
    },
    onError: (err) => {
      enqueueSnackbar(err.message || 'Operation failed', { variant: 'error' });
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (roleName) => roleService.deleteRealmRole(roleName, realmName),
    onSuccess: () => {
      queryClient.invalidateQueries(['realm-roles', realmName]);
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

  if (isLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <EmptyState
          type="error"
          title="Error loading roles"
          message={error.message}
          actionLabel="Retry"
          onAction={() => queryClient.invalidateQueries(['realm-roles', realmName])}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, margin: '0 auto' }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link 
          component="button" 
          color="inherit" 
          onClick={() => navigate(`/realms/${realmName}`)}
        >
          {realmName}
        </Link>
        <Typography color="text.primary">Realm Roles</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/realms/${realmName}`)}>
            Back
          </Button>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>Realm Roles</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Create Role
        </Button>
      </Box>

      {/* Search */}
      <Paper sx={{ mb: 3, p: 2 }} elevation={0}>
        <SearchFilter
          onSearch={handleSearch}
          placeholder="Search roles by name or description..."
          initialValue={search}
        />
      </Paper>

      {/* List */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Composite</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRoles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <EmptyState
                    title="No Realm Roles"
                    message={search ? `No roles match "${search}"` : 'Create roles to assign permissions to users.'}
                    actionLabel={search ? undefined : 'Create Role'}
                    onAction={search ? undefined : () => handleOpen()}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredRoles.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((role) => (
                <TableRow key={role.id || role.name} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <SecurityIcon color="action" fontSize="small" />
                      <Typography variant="subtitle2">{role.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>
                    {role.composite ? (
                      <Chip label="Composite" size="small" color="info" variant="outlined" />
                    ) : (
                      <Chip label="Simple" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton onClick={() => handleOpen(role)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        color="error" 
                        onClick={() => {
                          if (window.confirm(`Delete role ${role.name}? This action cannot be undone.`)) {
                            deleteMutation.mutate(role.name);
                          }
                        }}
                      >
                        <DeleteIcon />
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
          count={filteredRoles.length}
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

export default RealmRoles;
