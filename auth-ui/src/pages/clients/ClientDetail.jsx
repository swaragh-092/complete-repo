import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  Skeleton,
  Breadcrumbs,
  Link,
  Divider,
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  Fade,
  IconButton
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Settings as SettingsIcon,
  VpnKey as VpnKeyIcon,
  Security as SecurityIcon,
  Map as MapIcon
} from '@mui/icons-material';

import clientService from '../../services/clientService';
import ClientMappers from '../../components/clients/ClientMappers';
import ClientRoles from '../../components/clients/ClientRoles';
import ClientSecret from '../../components/clients/ClientSecret';
import EmptyState from '../../components/EmptyState';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`client-tabpanel-${index}`}
      aria-labelledby={`client-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function ClientDetail() {
  const { realmName, clientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState(0);

  // Fetch Client Details
  const { data: client, isLoading, error } = useQuery({
    queryKey: ['client', realmName, clientId],
    queryFn: () => clientService.getClient(clientId, realmName)
  });

  const { control, handleSubmit, formState: { isDirty } } = useForm({
    values: client,
    mode: 'onChange'
  });

  // Update Client Mutation
  const updateMutation = useMutation({
    mutationFn: (data) => clientService.updateClient(clientId, realmName, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['client', realmName, clientId]);
      enqueueSnackbar('Client updated successfully', { variant: 'success' });
    },
    onError: (err) => {
      enqueueSnackbar(err.message || 'Failed to update client', { variant: 'error' });
    }
  });

  const onSubmit = (data) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={600} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <EmptyState
          type="error"
          title="Error loading client"
          message={error.message}
          actionLabel="Back to Clients"
          onAction={() => navigate(`/realms/${realmName}/clients`)}
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
          <Link 
            component="button" 
            color="inherit" 
            onClick={() => navigate(`/realms/${realmName}/clients`)}
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Clients
          </Link>
          <Typography color="text.primary">{client.clientId}</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box display="flex" alignItems="center" gap={2} mb={4}>
          <IconButton onClick={() => navigate(`/realms/${realmName}/clients`)} sx={{ bgcolor: 'background.paper', boxShadow: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight="700" color="text.primary">
              {client.clientId}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure client settings, credentials, and roles
            </Typography>
          </Box>
        </Box>

        <Paper sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 2 }} elevation={0}>
          <Tabs
            value={activeTab}
            onChange={(e, v) => setActiveTab(v)}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<SettingsIcon />} label="Settings" iconPosition="start" sx={{ minHeight: 64 }} />
            <Tab icon={<VpnKeyIcon />} label="Credentials" iconPosition="start" sx={{ minHeight: 64 }} />
            <Tab icon={<MapIcon />} label="Mappers" iconPosition="start" sx={{ minHeight: 64 }} />
            <Tab icon={<SecurityIcon />} label="Roles" iconPosition="start" sx={{ minHeight: 64 }} />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <Box sx={{ maxWidth: 1000 }}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>General Settings</Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Basic client configuration and identification.
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="clientId"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Client ID"
                          fullWidth
                          disabled
                          helperText="Unique identifier for this client"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="name"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Name"
                          fullWidth
                          helperText="Friendly name for display purposes"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="description"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Description"
                          fullWidth
                          multiline
                          rows={2}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="enabled"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Switch {...field} checked={field.value} />}
                          label="Enabled"
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>Access Settings</Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Configure how this client interacts with the authentication server.
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="rootUrl"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Root URL"
                          fullWidth
                          helperText="Root URL for this client, used to resolve relative URLs"
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="redirectUris"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Valid Redirect URIs"
                          fullWidth
                          multiline
                          rows={3}
                          value={Array.isArray(field.value) ? field.value.join('\n') : field.value}
                          onChange={(e) => field.onChange(e.target.value.split('\n'))}
                          helperText="One URI per line. Wildcards (*) allowed. Required for successful login."
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="webOrigins"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Web Origins"
                          fullWidth
                          multiline
                          rows={3}
                          value={Array.isArray(field.value) ? field.value.join('\n') : field.value}
                          onChange={(e) => field.onChange(e.target.value.split('\n'))}
                          helperText="Allowed CORS origins. One per line. + for all redirect URIs."
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button 
                      type="submit" 
                      variant="contained"
                      disabled={!isDirty || updateMutation.isPending}
                      size="large"
                      sx={{ mt: 2 }}
                    >
                      {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <ClientSecret realmName={realmName} clientId={client.id} />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <ClientMappers realmName={realmName} clientId={client.id} />
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <ClientRoles realmName={realmName} clientId={client.id} />
          </TabPanel>
        </Paper>
      </Box>
    </Fade>
  );
}

export default ClientDetail;
