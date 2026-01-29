/**
 * @fileoverview Realms Management Page
 * @description Enterprise-grade realm management with validation and notifications
 */

import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useSnackbar } from 'notistack';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  IconButton,
  Chip,
  Card,
  CardContent,
  CardActions,
  Grid,
  Switch,
  FormControlLabel,
  Tooltip,
  Skeleton,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  Apps as AppsIcon,
  Security as SecurityIcon,
  Delete as DeleteIcon,
  TableChart as TableIcon,
  ViewModule as CardIcon,
  FileCopy as CloneIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Services and schemas
import realmService from '../services/realmService';
import { createRealmSchema } from '../schemas/realmSchema';

// Reusable components
import SearchFilter from '../components/SearchFilter';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import RealmCloneModal from '../components/realms/RealmCloneModal';

/**
 * Realms Management Page Component
 */
function Realms() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  
  // UI State
  const [openCreate, setOpenCreate] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [realmToDelete, setRealmToDelete] = useState(null);
  const [togglingRealm, setTogglingRealm] = useState(null);
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [realmToClone, setRealmToClone] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Form handling with React Hook Form + Yup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(createRealmSchema),
    defaultValues: {
      realm_name: '',
      display_name: ''
    }
  });

  // Fetch realms
  const { data: realms = [], isLoading, error } = useQuery({
    queryKey: ['realms'],
    queryFn: () => realmService.getAllRealms(),
    staleTime: 30000, // 30 seconds
    retry: 2,
  });



  // Filtered realms based on search
  const filteredRealms = useMemo(() => {
    if (!searchQuery) return realms;
    const query = searchQuery.toLowerCase();
    return realms.filter(realm =>
      realm.realm_name?.toLowerCase().includes(query) ||
      realm.display_name?.toLowerCase().includes(query)
    );
  }, [realms, searchQuery]);

  // Create realm mutation
  const createMutation = useMutation({
    mutationFn: (data) => realmService.createRealm(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['realms']);
      enqueueSnackbar('Realm created successfully', { variant: 'success' });
      reset();
      setOpenCreate(false);
    },
    onError: (error) => {
      const message = error?.response?.data?.error || error?.response?.data?.message || 'Failed to create realm';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  // Toggle realm enabled/disabled
  const toggleEnabledMutation = useMutation({
    mutationFn: async ({ realm_name, currentEnabled }) => {
      setTogglingRealm(realm_name);
      return await realmService.toggleRealmStatus(realm_name, !currentEnabled);
    },
    onSuccess: (_, { realm_name, currentEnabled }) => {
      queryClient.invalidateQueries(['realms']);
      enqueueSnackbar(
        `Realm "${realm_name}" ${!currentEnabled ? 'enabled' : 'disabled'} successfully`,
        { variant: 'success' }
      );
    },
    onError: (error) => {
      const message = error?.response?.data?.error || error?.response?.data?.message || 'Failed to toggle realm status';
      enqueueSnackbar(message, { variant: 'error' });
    },
    onSettled: () => {
      setTogglingRealm(null);
    },
  });

  // Delete realm mutation
  const deleteMutation = useMutation({
    mutationFn: (realmName) => realmService.deleteRealm(realmName),
    onSuccess: (_, realmName) => {
      queryClient.invalidateQueries(['realms']);
      enqueueSnackbar(`Realm "${realmName}" deleted successfully`, { variant: 'success' });
      setDeleteDialogOpen(false);
      setRealmToDelete(null);
    },
    onError: (error) => {
      const message = error?.response?.data?.error || error?.response?.data?.message || 'Failed to delete realm';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  // Handlers
  const handleNavigateToRealm = useCallback((realmName) => {
    if (!realmName) {
      console.error('Attempted to navigate with undefined realm name');
      enqueueSnackbar('Invalid realm name', { variant: 'error' });
      return;
    }
    navigate(`/realms/${realmName}`);
  }, [navigate, enqueueSnackbar]);

  const handleSearch = useCallback((value) => {
    setSearchQuery(value);
  }, []);

  const handleOpenCreate = useCallback(() => {
    reset();
    setOpenCreate(true);
  }, [reset]);

  const handleCloseCreate = useCallback(() => {
    setOpenCreate(false);
    reset();
  }, [reset]);

  const handleOpenDelete = useCallback((realm) => {
    setRealmToDelete(realm);
    setDeleteDialogOpen(true);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setRealmToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (realmToDelete?.realm_name) {
      deleteMutation.mutate(realmToDelete.realm_name);
    }
  }, [realmToDelete, deleteMutation]);

  const handleOpenClone = useCallback((realmName) => {
    setRealmToClone(realmName);
    setCloneModalOpen(true);
  }, []);

  const handleCloseClone = useCallback(() => {
    setCloneModalOpen(false);
    setRealmToClone(null);
  }, []);

  const onSubmit = useCallback((data) => {
    createMutation.mutate(data);
  }, [createMutation]);

  // Render realm card
  const renderRealmCard = useCallback((realm) => {
    if (!realm.realm_name) {
      console.warn('Realm missing realm_name:', realm);
      return null;
    }

    return (
      <Grid item xs={12} sm={6} md={4} key={realm.realm_name}>
        <Card
          sx={{
            height: '100%',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 3,
            }
          }}
          onClick={() => handleNavigateToRealm(realm.realm_name)}
        >
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" component="h2" noWrap title={realm.display_name}>
                {realm.display_name || 'Unnamed Realm'}
              </Typography>
              <Chip
                label={realm.enabled ? 'Active' : 'Disabled'}
                color={realm.enabled ? 'success' : 'default'}
                size="small"
              />
            </Box>

            <Typography color="text.secondary" gutterBottom variant="body2">
              {realm.realm_name}
            </Typography>

            <Box display="flex" alignItems="center" gap={2} mt={2}>
              <Tooltip title="Users">
                <Box display="flex" alignItems="center" gap={0.5}>
                  <PeopleIcon fontSize="small" color="action" />
                  <Typography variant="caption">Users</Typography>
                </Box>
              </Tooltip>
              <Tooltip title="Clients">
                <Box display="flex" alignItems="center" gap={0.5}>
                  <AppsIcon fontSize="small" color="action" />
                  <Typography variant="caption">Clients</Typography>
                </Box>
              </Tooltip>
              <Tooltip title="Roles">
                <Box display="flex" alignItems="center" gap={0.5}>
                  <SecurityIcon fontSize="small" color="action" />
                  <Typography variant="caption">Roles</Typography>
                </Box>
              </Tooltip>
            </Box>
          </CardContent>

          <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
            <Box display="flex" gap={0.5}>
              <Button
                size="small"
                startIcon={<SettingsIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigateToRealm(realm.realm_name);
                }}
              >
                Manage
              </Button>
              <Tooltip title="Clone Realm">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenClone(realm.realm_name);
                  }}
                  aria-label={`Clone ${realm.display_name}`}
                >
                  <CloneIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete realm">
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDelete(realm);
                  }}
                  aria-label={`Delete ${realm.display_name}`}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={realm.enabled}
                  disabled={togglingRealm === realm.realm_name}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleEnabledMutation.mutate({
                      realm_name: realm.realm_name,
                      currentEnabled: realm.enabled,
                    });
                  }}
                  size="small"
                />
              }
              label="Enabled"
              onClick={(e) => e.stopPropagation()}
            />
          </CardActions>
        </Card>
      </Grid>
    );
  }, [handleNavigateToRealm, handleOpenDelete, handleOpenClone, togglingRealm, toggleEnabledMutation]);

  // Render realm table
  const renderRealmTable = useCallback(() => (
    <TableContainer component={Paper}>
      <Table aria-label="Realms table">
        <TableHead>
          <TableRow>
            <TableCell><strong>Display Name</strong></TableCell>
            <TableCell><strong>Realm Name</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell align="right"><strong>Actions</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredRealms.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                <Typography color="text.secondary">No realms found</Typography>
              </TableCell>
            </TableRow>
          ) : (
            filteredRealms.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((realm) => {
              if (!realm.realm_name) {
                console.warn('Realm missing realm_name in table:', realm);
                return null;
              }

              return (
                <TableRow
                  key={realm.realm_name}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleNavigateToRealm(realm.realm_name)}
                >
                  <TableCell>
                    <Typography variant="subtitle2">
                      {realm.display_name || 'Unnamed Realm'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {realm.realm_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={realm.enabled ? 'Active' : 'Disabled'}
                      color={realm.enabled ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box display="flex" gap={1} justifyContent="flex-end" alignItems="center">
                      <Tooltip title="Manage Realm">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigateToRealm(realm.realm_name);
                          }}
                          aria-label={`Manage ${realm.display_name}`}
                        >
                          <SettingsIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Clone Realm">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenClone(realm.realm_name);
                          }}
                          aria-label={`Clone ${realm.display_name}`}
                        >
                          <CloneIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Realm">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDelete(realm);
                          }}
                          aria-label={`Delete ${realm.display_name}`}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                      <Switch
                        checked={realm.enabled}
                        disabled={togglingRealm === realm.realm_name}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleEnabledMutation.mutate({
                            realm_name: realm.realm_name,
                            currentEnabled: realm.enabled,
                          });
                        }}
                        size="small"
                        inputProps={{ 'aria-label': `Toggle ${realm.display_name}` }}
                      />
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={filteredRealms.length}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </TableContainer>
  ), [filteredRealms, handleNavigateToRealm, handleOpenDelete, handleOpenClone, togglingRealm, toggleEnabledMutation, page, rowsPerPage]);

  // Loading skeleton
  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="rectangular" width={120} height={36} />
        </Box>
        <Box mb={3}>
          <Skeleton variant="rectangular" width={250} height={40} />
        </Box>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {[1, 2, 3, 4].map((i) => (
                  <TableCell key={i}>
                    <Skeleton variant="text" />
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  {[1, 2, 3, 4].map((j) => (
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
          title="Failed to load realms"
          message={error?.message || 'An unexpected error occurred'}
          actionLabel="Try Again"
          onAction={() => queryClient.invalidateQueries(['realms'])}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, margin: '0 auto' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
          Realm Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
        >
          Create Realm
        </Button>
      </Box>

      {/* Search and View Toggle */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <SearchFilter
          onSearch={handleSearch}
          placeholder="Search realms..."
          initialValue={searchQuery}
        />
        <Box>
          <Tooltip title="Table View">
            <IconButton
              color={viewMode === 'table' ? 'primary' : 'default'}
              onClick={() => setViewMode('table')}
              aria-label="Table view"
            >
              <TableIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Card View">
            <IconButton
              color={viewMode === 'cards' ? 'primary' : 'default'}
              onClick={() => setViewMode('cards')}
              aria-label="Card view"
            >
              <CardIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Debug Info (remove in production) */}
      {realms.length > 0 && realms[0] && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Loaded {realms.length} realm(s). Sample: {realms[0].realm_name}
        </Alert>
      )}

      {/* Content */}
      {filteredRealms.length === 0 ? (
        searchQuery ? (
          <EmptyState
            type="search"
            title="No realms found"
            message={`No realms match "${searchQuery}"`}
          />
        ) : (
          <EmptyState
            title="No realms yet"
            message="Create your first realm to get started"
            actionLabel="Create Realm"
            onAction={handleOpenCreate}
          />
        )
      ) : viewMode === 'cards' ? (
        <>
          <Grid container spacing={3}>
            {filteredRealms.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(renderRealmCard)}
          </Grid>
          <TablePagination
            component="div"
            count={filteredRealms.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25]}
            sx={{ mt: 2 }}
          />
        </>
      ) : (
        renderRealmTable()
      )}

      {/* Create Realm Dialog */}
      <Dialog 
        open={openCreate} 
        onClose={handleCloseCreate} 
        maxWidth="sm" 
        fullWidth
        aria-labelledby="create-realm-dialog-title"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle id="create-realm-dialog-title">Create New Realm</DialogTitle>
          <DialogContent>
            <Controller
              name="realm_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  autoFocus
                  margin="dense"
                  label="Realm Name"
                  fullWidth
                  variant="outlined"
                  error={!!errors.realm_name}
                  helperText={errors.realm_name?.message || 'Lowercase alphanumeric with hyphens only'}
                  sx={{ mb: 2, mt: 1 }}
                />
              )}
            />
            <Controller
              name="display_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="dense"
                  label="Display Name"
                  fullWidth
                  variant="outlined"
                  error={!!errors.display_name}
                  helperText={errors.display_name?.message}
                />
              )}
            />
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
        title="Delete Realm"
        message={`Are you sure you want to delete "${realmToDelete?.display_name}"? This action cannot be undone and will remove all users, clients, and roles in this realm.`}
        danger
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />

      {/* Clone Realm Modal */}
      <RealmCloneModal
        open={cloneModalOpen}
        onClose={handleCloseClone}
        sourceRealm={realmToClone}
      />
    </Box>
  );
}

export default Realms;
