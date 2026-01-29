/**
 * @fileoverview Clients Management Page
 * @description Enterprise-grade client management with validation and notifications
 */

import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useSnackbar } from 'notistack';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  TableContainer,
  Paper,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Typography,
  MenuItem,
  TableSortLabel,
  Skeleton,
  Chip,
  IconButton,
  Tooltip,
  Fade,
  Breadcrumbs,
  Link,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Apps as AppsIcon
} from '@mui/icons-material';
import PropTypes from 'prop-types';

// Services and schemas
import clientService from '../services/clientService';
import realmService from '../services/realmService';
import { createClientSchema } from '../schemas/clientSchema';

// Reusable components
import SearchFilter from '../components/SearchFilter';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';

/**
 * Clients Management Page Component
 */
function Clients() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  // Pagination and sorting state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('clientId');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Dialog state
  const [openCreate, setOpenCreate] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);

  // Form handling with React Hook Form + Yup
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(createClientSchema),
    defaultValues: {
      client_key: '',
      client_id: '',
      client_secret: '',
      callback_url: '',
      requires_tenant: false,
      tenant_id: '',
      realm: ''
    }
  });

  const requiresTenant = watch('requires_tenant');

  const { realmName } = useParams();

  // Fetch clients with pagination - only when realmName is available
  const { data, isLoading, error } = useQuery({
    queryKey: ['clients', page, rowsPerPage, search, sortBy, sortOrder, realmName],
    queryFn: () =>
      clientService.getAllClients({
        page: page + 1,
        limit: rowsPerPage,
        search,
        sortBy,
        sortOrder,
        realm: realmName
      }),
    enabled: !!realmName, // Only fetch when realmName exists
    placeholderData: (previousData) => previousData
  });

  // Fetch realms for selector
  const { data: realms = [] } = useQuery({
    queryKey: ['realms'],
    queryFn: () => realmService.getAllRealms()
  });

  // Create client mutation
  const createMutation = useMutation({
    mutationFn: (data) => clientService.createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
      enqueueSnackbar('Client created successfully', { variant: 'success' });
      handleCloseCreate();
    },
    onError: (error) => {
      const message = error?.response?.data?.error || error?.response?.data?.message || 'Failed to create client';
      enqueueSnackbar(message, { variant: 'error' });
    }
  });

  // Delete client mutation
  const deleteMutation = useMutation({
    mutationFn: ({ clientId, realm }) => clientService.deleteClient(clientId, realm),
    onSuccess: (_, { clientId }) => {
      queryClient.invalidateQueries(['clients']);
      enqueueSnackbar(`Client "${clientId}" deleted successfully`, { variant: 'success' });
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    },
    onError: (error) => {
      const message = error?.response?.data?.error || error?.response?.data?.message || 'Failed to delete client';
      enqueueSnackbar(message, { variant: 'error' });
    }
  });

  // Handlers
  const handleSort = useCallback((column) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  }, [sortBy]);

  const handleSearch = useCallback((value) => {
    setSearch(value);
    setPage(0);
  }, []);

  const handleOpenCreate = useCallback(() => {
    reset();
    setOpenCreate(true);
  }, [reset]);

  const handleCloseCreate = useCallback(() => {
    setOpenCreate(false);
    reset();
  }, [reset]);

  const handleOpenDelete = useCallback((client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setClientToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (clientToDelete) {
      deleteMutation.mutate({
        clientId: clientToDelete.clientId,
        realm: clientToDelete.realm
      });
    }
  }, [clientToDelete, deleteMutation]);

  const onSubmit = useCallback((formData) => {
    createMutation.mutate(formData);
  }, [createMutation]);

  // Extract data
  const clients = useMemo(() => data?.rows || [], [data]);
  const totalCount = useMemo(() => data?.count || 0, [data]);

  // No realm selected - show message
  if (!realmName) {
    return (
      <Box sx={{ p: 3 }}>
        <EmptyState
          type="info"
          title="No Realm Selected"
          message="Please select a realm first to view its clients."
          actionLabel="Go to Realms"
          onAction={() => navigate('/realms')}
        />
      </Box>
    );
  }

  // Loading skeleton
  if (isLoading && !data) {
    return (
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Skeleton variant="text" width={150} height={40} />
          <Skeleton variant="rectangular" width={120} height={36} />
        </Box>
        <Box mb={2}>
          <Skeleton variant="rectangular" width={250} height={40} />
        </Box>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableCell key={i}>
                    <Skeleton variant="text" />
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  {[1, 2, 3, 4, 5].map((j) => (
                    <TableCell key={j}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <EmptyState
          type="error"
          title="Failed to load clients"
          message={error?.message || 'An unexpected error occurred'}
          actionLabel="Try Again"
          onAction={() => queryClient.invalidateQueries(['clients'])}
        />
      </Box>
    );
  }

  return (
    <Fade in={true} timeout={500}>
      <Box sx={{ p: 3, maxWidth: 1600, margin: '0 auto' }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link 
            component="button" 
            color="inherit" 
            onClick={() => navigate(`/realms/${realmName}`)}
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            {realmName}
          </Link>
          <Typography color="text.primary">Clients</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => navigate(`/realms/${realmName}`)} sx={{ bgcolor: 'background.paper', boxShadow: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h4" fontWeight="700" color="text.primary">
                Clients
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage applications and services allowed to access this realm
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{ px: 3 }}
          >
            Create Client
          </Button>
        </Box>

        {/* Search */}
        <Paper sx={{ mb: 3, p: 2 }} elevation={0}>
          <SearchFilter
            onSearch={handleSearch}
            placeholder="Search clients by name, ID, or realm..."
            initialValue={search}
          />
        </Paper>

        {/* Table */}
        {clients.length === 0 ? (
          search ? (
            <EmptyState
              type="search"
              title="No clients found"
              message={`No clients match "${search}"`}
            />
          ) : (
            <EmptyState
              title="No clients yet"
              message="Create your first client to get started"
              actionLabel="Create Client"
              onAction={handleOpenCreate}
            />
          )
        ) : (
          <Paper elevation={0} sx={{ overflow: 'hidden', border: 1, borderColor: 'divider', borderRadius: 2 }}>
            <TableContainer>
              <Table aria-label="Clients table">
                <TableHead sx={{ bgcolor: 'background.default' }}>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'name'}
                        direction={sortBy === 'name' ? sortOrder : 'asc'}
                        onClick={() => handleSort('name')}
                      >
                        Client Name
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'clientId'}
                        direction={sortBy === 'clientId' ? sortOrder : 'asc'}
                        onClick={() => handleSort('clientId')}
                      >
                        Client ID
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Realm</TableCell>
                    <TableCell>Tenant ID</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.clientId} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.main' }}>
                            <AppsIcon />
                          </Avatar>
                          <Box>
                            <Link 
                              component="button"
                              onClick={() => navigate(`/realms/${realmName}/clients/${client.clientId}`)}
                              sx={{ fontWeight: 600, textDecoration: 'none', color: 'text.primary', '&:hover': { color: 'primary.main' } }}
                            >
                              {client.name || client.clientId}
                            </Link>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'action.hover', px: 1, py: 0.5, borderRadius: 1, display: 'inline-block' }}>
                          {client.clientId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={client.realm}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{client.tenant_id || '-'}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Delete Client">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenDelete(client)}
                            aria-label={`Delete ${client.clientId}`}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Paper>
        )}

        {/* Create Dialog */}
        <Dialog
          open={openCreate}
          onClose={handleCloseCreate}
          maxWidth="sm"
          fullWidth
          aria-labelledby="create-client-dialog-title"
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogTitle id="create-client-dialog-title">Create Client</DialogTitle>
            <DialogContent>
              <Controller
                name="client_key"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Client Key"
                    fullWidth
                    margin="normal"
                    error={!!errors.client_key}
                    helperText={errors.client_key?.message}
                  />
                )}
              />
              <Controller
                name="client_id"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Client ID"
                    fullWidth
                    margin="normal"
                    error={!!errors.client_id}
                    helperText={errors.client_id?.message}
                  />
                )}
              />
              <Controller
                name="client_secret"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Client Secret"
                    type="password"
                    fullWidth
                    margin="normal"
                    error={!!errors.client_secret}
                    helperText={errors.client_secret?.message}
                  />
                )}
              />
              <Controller
                name="callback_url"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Callback URL"
                    fullWidth
                    margin="normal"
                    error={!!errors.callback_url}
                    helperText={errors.callback_url?.message || 'e.g., https://yourapp.com/callback'}
                  />
                )}
              />
              <Controller
                name="realm"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Realm"
                    select
                    fullWidth
                    margin="normal"
                    error={!!errors.realm}
                    helperText={errors.realm?.message}
                  >
                    {realms.map((realm) => (
                      <MenuItem key={realm.realm_name} value={realm.realm_name}>
                        {realm.display_name || realm.realm_name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              <Controller
                name="requires_tenant"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label="Requires Tenant"
                    sx={{ mt: 1 }}
                  />
                )}
              />

              {requiresTenant && (
                <Controller
                  name="tenant_id"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Tenant ID"
                      fullWidth
                      margin="normal"
                      error={!!errors.tenant_id}
                      helperText={errors.tenant_id?.message}
                    />
                  )}
                />
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={handleCloseCreate} disabled={isSubmitting || createMutation.isPending}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting || createMutation.isPending}
                startIcon={createMutation.isPending ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onClose={handleCloseDelete}
          onConfirm={handleConfirmDelete}
          title="Delete Client"
          message={`Are you sure you want to delete client "${clientToDelete?.clientId}"? This action cannot be undone.`}
          danger
          confirmText="Delete"
          loading={deleteMutation.isPending}
        />
      </Box>
    </Fade>
  );
}

export default Clients;
