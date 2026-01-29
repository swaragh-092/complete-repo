import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Tooltip,
  Skeleton
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

import idpService from '../../services/idpService';
import IdentityProviderCreateWizard from '../../components/identity-providers/IdentityProviderCreateWizard';
import IdentityProviderDeleteDialog from '../../components/identity-providers/IdentityProviderDeleteDialog';
import EmptyState from '../../components/EmptyState';

function IdentityProvidersList() {
  const { realmName } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Fetch IdPs
  const { data: idps = [], isLoading, error } = useQuery({
    queryKey: ['identity-providers', realmName],
    queryFn: () => idpService.getIdentityProviders(realmName)
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data) => idpService.createIdentityProvider(realmName, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['identity-providers', realmName]);
      enqueueSnackbar('Identity provider created successfully', { variant: 'success' });
      setCreateOpen(false);
    },
    onError: (err) => {
      enqueueSnackbar(err.message || 'Failed to create identity provider', { variant: 'error' });
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (alias) => idpService.deleteIdentityProvider(realmName, alias),
    onSuccess: () => {
      queryClient.invalidateQueries(['identity-providers', realmName]);
      enqueueSnackbar('Identity provider deleted successfully', { variant: 'success' });
      setDeleteData(null);
    },
    onError: (err) => {
      enqueueSnackbar(err.message || 'Failed to delete identity provider', { variant: 'error' });
    }
  });

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <EmptyState
          type="error"
          title="Error loading providers"
          message={error.message}
          actionLabel="Retry"
          onAction={() => queryClient.invalidateQueries(['identity-providers', realmName])}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, margin: '0 auto' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/realms/${realmName}`)}>
            Back
          </Button>
          <Typography variant="h4">Identity Providers</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateOpen(true)}
        >
          Add Provider
        </Button>
      </Box>

      {/* List */}
      {idps.length === 0 ? (
        <EmptyState
          title="No Identity Providers"
          message="Configure social login or external IdPs for this realm."
          actionLabel="Add Provider"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Alias</TableCell>
                <TableCell>Provider ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {idps.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((idp) => (
                <TableRow key={idp.internalId || idp.alias} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{idp.alias}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {idp.displayName}
                    </Typography>
                  </TableCell>
                  <TableCell>{idp.providerId}</TableCell>
                  <TableCell>
                    <Chip
                      label={idp.enabled ? 'Enabled' : 'Disabled'}
                      color={idp.enabled ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton
                        onClick={() => navigate(`/realms/${realmName}/identity-providers/${idp.alias}`)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        color="error"
                        onClick={() => setDeleteData(idp)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={idps.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </TableContainer>
      )}

      {/* Create Wizard */}
      <IdentityProviderCreateWizard
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        loading={createMutation.isPending}
      />

      {/* Delete Dialog */}
      <IdentityProviderDeleteDialog
        open={!!deleteData}
        alias={deleteData?.alias}
        onClose={() => setDeleteData(null)}
        onConfirm={() => deleteMutation.mutate(deleteData.alias)}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
}

export default IdentityProvidersList;
