import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, FormProvider } from 'react-hook-form';
import { useSnackbar } from 'notistack';
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
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Security as SecurityIcon,
  Password as PasswordIcon,
  Lock as LockIcon,
  Fingerprint as FingerprintIcon
} from '@mui/icons-material';

import realmService from '../../services/realmService';
import BruteForceSettings from '../../components/security/BruteForceSettings';
import PasswordPolicyEditor from '../../components/security/PasswordPolicyEditor';
import OTPSettings from '../../components/security/OTPSettings';
import WebAuthnSettings from '../../components/security/WebAuthnSettings';
import EmptyState from '../../components/EmptyState';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`security-tabpanel-${index}`}
      aria-labelledby={`security-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function SecurityConfig() {
  const { realmName } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState(0);

  // Fetch Realm Security Config
  const { data: realm, isLoading, error } = useQuery({
    queryKey: ['realm-security', realmName],
    queryFn: () => realmService.getRealm(realmName)
  });

  const methods = useForm({
    values: realm,
    mode: 'onChange'
  });

  const { handleSubmit, formState: { isDirty, isSubmitting } } = methods;

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (data) => realmService.updateRealm(realmName, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['realm-security', realmName]);
      queryClient.invalidateQueries(['realm', realmName]);
      enqueueSnackbar('Security settings updated successfully', { variant: 'success' });
    },
    onError: (err) => {
      enqueueSnackbar(err.message || 'Failed to update security settings', { variant: 'error' });
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
          title="Error loading security settings"
          message={error.message}
          actionLabel="Back to Realm"
          onAction={() => navigate(`/realms/${realmName}`)}
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
        <Typography color="text.primary">Security</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/realms/${realmName}`)}>
            Back
          </Button>
          <Typography variant="h4">Security Configuration</Typography>
        </Box>
        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={!isDirty || isSubmitting || updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      {/* Content */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<LockIcon />} label="Brute Force" iconPosition="start" />
          <Tab icon={<PasswordIcon />} label="Password Policy" iconPosition="start" />
          <Tab icon={<SecurityIcon />} label="OTP Policy" iconPosition="start" />
          <Tab icon={<FingerprintIcon />} label="WebAuthn" iconPosition="start" />
        </Tabs>
        <Divider />

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <TabPanel value={activeTab} index={0}>
              <BruteForceSettings />
            </TabPanel>
            <TabPanel value={activeTab} index={1}>
              <PasswordPolicyEditor />
            </TabPanel>
            <TabPanel value={activeTab} index={2}>
              <OTPSettings />
            </TabPanel>
            <TabPanel value={activeTab} index={3}>
              <WebAuthnSettings />
            </TabPanel>
          </form>
        </FormProvider>
      </Paper>
    </Box>
  );
}

export default SecurityConfig;
