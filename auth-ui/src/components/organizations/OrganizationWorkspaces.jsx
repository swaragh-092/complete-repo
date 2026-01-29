// auth-ui/src/components/organizations/OrganizationWorkspaces.jsx
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Skeleton
} from '@mui/material';
import {
  Add as AddIcon,
  Settings as SettingsIcon,
  Workspaces as WorkspaceIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api, { extractData } from '../../services/api';
import CreateWorkspaceModal from '../workspaces/CreateWorkspaceModal';

export default function OrganizationWorkspaces({ orgId, orgName, currentUserRole }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // In Admin Panel (auth-ui), superadmins always have permission to create workspaces
  // The role check is more relevant for client apps. Here we default to true.
  const roleNormalized = (currentUserRole || '').toLowerCase();
  const canCreateWorkspace = true; // Admin panel is for superadmins

  // Fetch workspaces for this organization
  const { data: workspaces = [], isLoading, error } = useQuery({
    queryKey: ['workspaces', { org_id: orgId }],
    queryFn: () => api.get(`/workspaces`, { params: { org_id: orgId } }).then(extractData),
    enabled: !!orgId
  });

  const handleWorkspaceCreated = () => {
    queryClient.invalidateQueries(['workspaces', { org_id: orgId }]);
    setCreateModalOpen(false);
  };

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={200} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load workspaces: {error.message}</Alert>;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Workspaces in {orgName}
        </Typography>
        {canCreateWorkspace && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Workspace
          </Button>
        )}
      </Box>

      {/* Table */}
      {workspaces.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <WorkspaceIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No workspaces yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {canCreateWorkspace 
              ? 'Create your first workspace for this organization.' 
              : 'No workspaces found. Contact an organization admin to create one.'}
          </Typography>
          {canCreateWorkspace && (
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setCreateModalOpen(true)}>
              Create Workspace
            </Button>
          )}
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Members</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workspaces.map((item) => {
                // Handle both direct workspace and membership wrapper
                const workspace = item.workspace || item;
                return (
                  <TableRow key={workspace.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WorkspaceIcon color="primary" fontSize="small" />
                        <Typography fontWeight={500}>{workspace.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={workspace.slug} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{workspace.member_count || item.member_count || 0}</TableCell>
                    <TableCell>
                      {workspace.created_at && formatDistanceToNow(new Date(workspace.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Manage Workspace">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/workspaces/${workspace.id}`)}
                          color="primary"
                        >
                          <LaunchIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Modal - Pass forcedOrgId for Admin context */}
      <CreateWorkspaceModal
        open={createModalOpen}
        onClose={handleWorkspaceCreated}
        forcedOrgId={orgId}
      />
    </Box>
  );
}
