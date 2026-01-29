import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Box,
  Paper,
  Typography,
  Button,
  Skeleton,
  Breadcrumbs,
  Link
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

import idpService from '../../services/idpService';
import IdentityProviderEditForm from '../../components/identity-providers/IdentityProviderEditForm';
import EmptyState from '../../components/EmptyState';

function IdentityProviderDetail() {
  const { realmName, alias } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  // Fetch IdP Details
  const { data: idp, isLoading, error } = useQuery({
    queryKey: ['identity-provider', realmName, alias],
    queryFn: () => idpService.getIdentityProvider(realmName, alias)
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (data) => idpService.updateIdentityProvider(realmName, alias, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['identity-provider', realmName, alias]);
      queryClient.invalidateQueries(['identity-providers', realmName]);
      enqueueSnackbar('Identity provider updated successfully', { variant: 'success' });
    },
    onError: (err) => {
      enqueueSnackbar(err.message || 'Failed to update identity provider', { variant: 'error' });
    }
  });

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <EmptyState
          type="error"
          title="Error loading provider"
          message={error.message}
          actionLabel="Back to List"
          onAction={() => navigate(`/realms/${realmName}/identity-providers`)}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link 
          component="button" 
          color="inherit" 
          onClick={() => navigate(`/realms/${realmName}`)}
        >
          {realmName}
        </Link>
        <Link 
          component="button" 
          color="inherit" 
          onClick={() => navigate(`/realms/${realmName}/identity-providers`)}
        >
          Identity Providers
        </Link>
        <Typography color="text.primary">{alias}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/realms/${realmName}/identity-providers`)}>
          Back
        </Button>
        <Typography variant="h4">
          Edit {idp.displayName || alias}
        </Typography>
      </Box>

      {/* Edit Form */}
      <Paper sx={{ p: 3 }}>
        <IdentityProviderEditForm
          initialData={idp}
          onSubmit={(data) => updateMutation.mutate(data)}
          loading={updateMutation.isPending}
        />
      </Paper>
    </Box>
  );
}

export default IdentityProviderDetail;
