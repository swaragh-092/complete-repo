// auth-ui/src/components/organizations/OrganizationOverview.jsx
import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Avatar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent
} from '@mui/material';
import {
  People as MembersIcon,
  Person as PersonIcon,
  Groups as GroupsIcon,
  CalendarToday as CalendarIcon,
  Badge as BadgeIcon,
  Business as OrgIcon,
  Workspaces as WorkspacesIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

function StatCard({ icon: Icon, label, value, color = 'primary' }) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 3 }
      }}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          sx={{
            bgcolor: `${color}.light`,
            color: `${color}.dark`,
            width: 48,
            height: 48
          }}
        >
          <Icon />
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {value ?? '—'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function OrganizationOverview({ organization }) {
  if (!organization) return null;

  const {
    members = [],
    primary_users = [],
    member_count = 0,
    primary_user_count = 0,
    total_users = 0,
    created_at,
    updated_at,
    tenant_id,
    current_user_role,
    id
  } = organization;

  // Combine members + primary users for the preview, show first 5
  const allUsers = [
    ...members.map((m) => ({ ...m, type: 'member' })),
    ...primary_users.map((u) => ({ ...u, type: 'primary' }))
  ];
  const previewUsers = allUsers.slice(0, 5);

  return (
    <Box>
      {/* Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={MembersIcon}
            label="Organization Members"
            value={member_count}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={PersonIcon}
            label="Primary Users"
            value={primary_user_count}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={GroupsIcon}
            label="Total Users"
            value={total_users}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={BadgeIcon}
            label="Your Role"
            value={current_user_role || 'N/A'}
            color="info"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Users Preview */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Users ({allUsers.length})
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {allUsers.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                No users in this organization yet.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Department</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewUsers.map((user, idx) => (
                      <TableRow key={user.user_id || user.keycloak_id || idx} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontSize: '0.85rem' }}>
                              {(user.email || '?').charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {user.email}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {(user.keycloak_id || '').substring(0, 8)}...
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.type === 'primary' ? 'Primary' : 'Member'}
                            size="small"
                            color={user.type === 'primary' ? 'secondary' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.role?.name || (user.type === 'primary' ? 'Owner' : '—')}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {user.department || user.designation || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {allUsers.length > 5 && (
                      <TableRow>
                        <TableCell colSpan={4} sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Showing 5 of {allUsers.length} users — switch to the Members tab for the full list
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Organization Metadata */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Organization Info
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">ID</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                  {id}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Tenant ID</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {tenant_id || '—'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Created</Typography>
                <Typography variant="body2">
                  {created_at
                    ? `${new Date(created_at).toLocaleDateString()} (${formatDistanceToNow(new Date(created_at), { addSuffix: true })})`
                    : '—'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Last Updated</Typography>
                <Typography variant="body2">
                  {updated_at
                    ? `${new Date(updated_at).toLocaleDateString()} (${formatDistanceToNow(new Date(updated_at), { addSuffix: true })})`
                    : '—'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Your Role</Typography>
                <Chip
                  label={current_user_role || 'N/A'}
                  size="small"
                  color={current_user_role === 'Owner' ? 'warning' : 'primary'}
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
