// auth-ui/src/pages/OrganizationDetail.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Breadcrumbs,
  Link,
  Chip,
  IconButton,
  Skeleton,
  Alert
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Business as OrgIcon,
  Workspaces as WorkspacesIcon,
  People as MembersIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import api, { extractData } from '../services/api';

// Tab Components
import OrganizationWorkspaces from '../components/organizations/OrganizationWorkspaces';
import OrganizationMembers from '../components/organizations/OrganizationMembers';
import OrganizationSettings from '../components/organizations/OrganizationSettings';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function OrganizationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);

  // Fetch organization details
  const { data: organization, isLoading, error } = useQuery({
    queryKey: ['organization', id],
    queryFn: () => api.get(`/organizations/${id}`).then(extractData),
    enabled: !!id
  });

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={300} height={40} />
        <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load organization: {error.message}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/organizations')}>
          <BackIcon />
        </IconButton>
        <Box>
          <Breadcrumbs>
            <Link
              underline="hover"
              color="inherit"
              sx={{ cursor: 'pointer' }}
              onClick={() => navigate('/organizations')}
            >
              Organizations
            </Link>
            <Typography color="text.primary">{organization?.name}</Typography>
          </Breadcrumbs>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <OrgIcon color="primary" />
            <Typography variant="h4" component="h1">
              {organization?.name}
            </Typography>
            {organization?.tenant_id && (
              <Chip label={organization.tenant_id} size="small" variant="outlined" />
            )}
          </Box>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tabIndex}
          onChange={(e, newValue) => setTabIndex(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<WorkspacesIcon />} iconPosition="start" label="Workspaces" />
          <Tab icon={<MembersIcon />} iconPosition="start" label="Members" />
          <Tab icon={<SettingsIcon />} iconPosition="start" label="Settings" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabIndex} index={0}>
        <OrganizationWorkspaces 
          orgId={id} 
          orgName={organization?.name} 
          currentUserRole={organization?.current_user_role} 
        />
      </TabPanel>
      <TabPanel value={tabIndex} index={1}>
        <OrganizationMembers 
          orgId={id}
          orgName={organization?.name}
        />
      </TabPanel>
      <TabPanel value={tabIndex} index={2}>
        <OrganizationSettings 
          organization={organization}
        />
      </TabPanel>
    </Box>
  );
}
