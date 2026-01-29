import { useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Drawer,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { EditRounded as EditIcon, VerifiedUserRounded as VerifiedIcon, ShieldRounded as ShieldIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useProfile } from '../hooks/useProfile';
import { useDevices } from '../hooks/useDevices';
import { useSecurity } from '../hooks/useSecurity';
import { useAudit } from '../hooks/useAudit';
import LoadingSpinner from '../components/LoadingSpinner';
import AuditTrend from '../components/AuditTrend';
import ProfileEditForm from '../components/profile/ProfileEditForm';

const MotionCard = motion.create(Card);

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (index = 0) => ({ opacity: 1, y: 0, transition: { delay: index * 0.05 } }),
};

function formatDate(value, withTime = false) {
  if (!value) return 'Not available';
  const date = new Date(value);
  return withTime ? date.toLocaleString() : date.toLocaleDateString();
}

export default function IdentityDashboard() {
  const { data: user, isPending } = useProfile();
  const { data: devices = [] } = useDevices();
  const { status } = useSecurity();
  const { loginHistory, loginHistoryQuery, sessionStats } = useAudit({ loginLimit: 12 });
  const [isEditDrawerOpen, setEditDrawerOpen] = useState(false);

  const permissionMatrix = useMemo(() => {
    if (!user?.permissionDetails) return [];
    const grouped = user.permissionDetails.reduce((acc, permission) => {
      const resource = permission.resource || 'global';
      const entry = acc.get(resource) || { resource, actions: new Set() };
      entry.actions.add(permission.action || permission.name);
      acc.set(resource, entry);
      return acc;
    }, new Map());
    return Array.from(grouped.values()).map(({ resource, actions }) => ({
      resource,
      actions: Array.from(actions).sort(),
    }));
  }, [user]);

  if (isPending || !user) {
    return <LoadingSpinner message="Refreshing your identity overview…" />;
  }

  const cards = [
    {
      title: 'Identity summary',
      content: (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
          <Avatar
            src={user.avatarUrl || undefined}
            alt={user.fullName}
            sx={{ width: 84, height: 84, fontSize: 36 }}
          >
            {user.fullName?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Typography variant="h6" noWrap>{user.fullName || user.username}</Typography>
            <Typography variant="body2" color="text.secondary" noWrap>{user.email}</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" mt={1.5}>
              <Chip size="small" color={user.enabled ? 'success' : 'default'} label={user.enabled ? 'Active' : 'Disabled'} />
              <Chip size="small" color={user.emailVerified ? 'primary' : 'warning'} label={user.emailVerified ? 'Email verified' : 'Email pending'} />
              <Chip size="small" icon={<ShieldIcon fontSize="inherit" />} label={`MFA ${user.totpEnabled ? 'enabled' : 'disabled'}`} color={user.totpEnabled ? 'success' : 'warning'} />
              <Chip size="small" label={`Last login ${formatDate(user.lastLogin || user.metadata?.last_login)}`} />
            </Stack>
          </Box>
          <Box>
            <Button variant="contained" startIcon={<EditIcon />} onClick={() => setEditDrawerOpen(true)}>
              Edit profile
            </Button>
          </Box>
        </Stack>
      ),
    },
    {
      title: 'Security posture',
      content: (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricTile label="Trusted devices" value={devices.length} helper="Across all browsers" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricTile label="Active sessions" value={sessionStats?.activeSessions ?? 0} helper="Real-time activity" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricTile label="Unique apps" value={sessionStats?.uniqueClients ?? 0} helper="Connected tenants" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricTile label="Last password update" value={formatDate(status.data?.lastPasswordChange)} helper="Change every 90 days" dense />
          </Grid>
        </Grid>
      ),
    },
  ];

  return (
    <Box component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
      <Grid container spacing={3} mb={1}>
        {cards.map((card, index) => (
          <Grid item xs={12} key={card.title}>
            <MotionCard variants={cardVariants} initial="hidden" animate="visible" custom={index}>
              <CardHeader title={card.title} />
              <CardContent>{card.content}</CardContent>
            </MotionCard>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} alignItems="stretch">
        <Grid item xs={12} lg={7}>
          <MotionCard variants={cardVariants} initial="hidden" animate="visible" custom={2} sx={{ height: '100%' }}>
            <CardHeader
              title="Organization memberships"
              action={<Chip size="small" color="primary" label={`${user.memberships.length} memberships`} />}
            />
            <CardContent>
              {user.memberships.length === 0 ? (
                <EmptyState message="You are not assigned to any organization yet." />
              ) : (
                <Stack spacing={2}>
                  {user.memberships.map((membership) => (
                    <Box key={`${membership.orgId}-${membership.roleName}`}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>{membership.orgName}</Typography>
                          <Typography variant="body2" color="text.secondary">{membership.roleDescription || 'Member access'}</Typography>
                        </Box>
                        <Chip icon={<VerifiedIcon fontSize="inherit" />} label={membership.roleName} color="secondary" size="small" />
                      </Stack>
                      <Divider sx={{ my: 1.5 }} />
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {(membership.permissions || []).map((permission) => (
                          <Chip key={`${membership.id}-${permission.name}`} size="small" variant="outlined" label={permission.name} />
                        ))}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid item xs={12} lg={5}>
          <MotionCard variants={cardVariants} initial="hidden" animate="visible" custom={3} sx={{ height: '100%' }}>
            <CardHeader title="Login activity" subheader="Rolling 14-day insight" />
            <CardContent sx={{ minHeight: 240 }}>
              {loginHistoryQuery.isPending ? (
                <LoadingSpinner message="Loading activity…" compact />
              ) : (
                <AuditTrend history={loginHistory} />
              )}
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid item xs={12}>
          <MotionCard variants={cardVariants} initial="hidden" animate="visible" custom={4}>
            <CardHeader title="Permission matrix" subheader="Effective access across resources" />
            <CardContent>
              {permissionMatrix.length === 0 ? (
                <EmptyState message="No permissions assigned yet." />
              ) : (
                <Stack spacing={1.5}>
                  {permissionMatrix.map((entry) => (
                    <Box key={entry.resource} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                      <Typography variant="subtitle2" minWidth={160} fontWeight={600} textTransform="capitalize">
                        {entry.resource}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {entry.actions.map((action) => (
                          <Chip key={action} label={action} size="small" variant="outlined" />
                        ))}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>

      <Drawer
        anchor="right"
        open={isEditDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, p: 3 } }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight={600}>
            Update profile
          </Typography>
          <Tooltip title="Close">
            <IconButton onClick={() => setEditDrawerOpen(false)}>
              <EditIcon sx={{ transform: 'rotate(45deg)' }} />
            </IconButton>
          </Tooltip>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <ProfileEditForm onClose={() => setEditDrawerOpen(false)} showContainer={false} />
      </Drawer>
    </Box>
  );
}

function MetricTile({ label, value, helper, dense = false }) {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      <Typography variant={dense ? 'subtitle1' : 'h4'} fontWeight={dense ? 500 : 700}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {helper}
      </Typography>
    </Box>
  );
}

function EmptyState({ message }) {
  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}

