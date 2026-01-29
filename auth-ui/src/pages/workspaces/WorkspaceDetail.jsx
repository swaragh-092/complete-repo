import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Breadcrumbs,
  Link,
  CircularProgress,
  Alert,
  IconButton,
  Chip
} from '@mui/material';
import {
  Dashboard as OverviewIcon,
  People as MembersIcon,
  Email as InvitationsIcon,
  Settings as SettingsIcon,
  ArrowBack as BackIcon,
  Workspaces as WorkspaceIcon,
  Business as OrgIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import workspaceService from '../../services/workspaceService';
import api, { extractData } from '../../services/api';

// Tab Components
import WorkspaceMembers from './tabs/WorkspaceMembers';
import WorkspaceSettingsTab from './tabs/WorkspaceSettingsTab';
import InvitationsList from '../../components/workspaces/InvitationsList';
import WorkspaceOverview from './tabs/WorkspaceOverview';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function WorkspaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);

  // Fetch Workspace Details
  const { data: workspace, isLoading, error } = useQuery({
    queryKey: ['workspace', id],
    queryFn: () => workspaceService.getById(id),
    retry: 1
  });

  // Fetch Organization for Breadcrumbs (optional but nice)
  const { data: organization } = useQuery({
    queryKey: ['organization', workspace?.org_id],
    queryFn: () => api.get(`/organizations/${workspace.org_id}`).then(extractData),
    enabled: !!workspace?.org_id
  });

  if (isLoading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          Failed to load workspace: {error.message || 'Unknown error'}
        </Alert>
        <Button onClick={() => navigate('/')} sx={{ mt: 2 }} variant="outlined">
          Go Home
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <IconButton onClick={() => navigate(organization ? `/organizations/${organization.id}` : '/')} size="small">
            <BackIcon />
          </IconButton>
          <Breadcrumbs aria-label="breadcrumb">
            <Link 
              underline="hover" 
              color="inherit" 
              sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              onClick={() => navigate('/organizations')}
            >
              <OrgIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              Organizations
            </Link>
            {organization && (
              <Link
                underline="hover"
                color="inherit"
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/organizations/${organization.id}`)}
              >
                {organization.name}
              </Link>
            )}
            <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
              <WorkspaceIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              {workspace.name}
            </Typography>
          </Breadcrumbs>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h4" component="h1" fontWeight={600}>
                {workspace.name}
                </Typography>
                <Chip label={workspace.slug} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
            </Box>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 0 }}>
        <Tabs
          value={tabIndex}
          onChange={(e, v) => setTabIndex(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<OverviewIcon />} iconPosition="start" label="Overview" />
          <Tab icon={<MembersIcon />} iconPosition="start" label="Members" />
          <Tab icon={<InvitationsIcon />} iconPosition="start" label="Invitations" />
          <Tab icon={<SettingsIcon />} iconPosition="start" label="Settings" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabIndex} index={0}>
        <WorkspaceOverview workspace={workspace} />
      </TabPanel>

      <TabPanel value={tabIndex} index={1}>
        <WorkspaceMembers workspace={workspace} />
      </TabPanel>

      <TabPanel value={tabIndex} index={2}>
         <Box sx={{ maxWidth: 1000 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Pending Invitations</Typography>
            </Box>
            <InvitationsList workspaceId={id} />
         </Box>
      </TabPanel>

      <TabPanel value={tabIndex} index={3}>
        <WorkspaceSettingsTab workspace={workspace} />
      </TabPanel>
    </Box>
  );
}
