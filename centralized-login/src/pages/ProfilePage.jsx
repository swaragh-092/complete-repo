import { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Drawer,
  Grid,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { motion } from 'framer-motion';
import { EditRounded as EditIcon } from '@mui/icons-material';
import { useProfile } from '../hooks/useProfile';
import LoadingSpinner from '../components/LoadingSpinner';
import ProfileEditForm from '../components/profile/ProfileEditForm';

const MotionCard = motion.create(Card);

export default function ProfilePage() {
  const { data: user, isPending } = useProfile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const metadata = useMemo(() => ({
    department: user?.metadata?.department || 'Not specified',
    designation: user?.metadata?.designation || 'Not specified',
    mobile: user?.metadata?.mobile || 'Not linked',
    gender: user?.metadata?.gender || 'Not specified',
    primaryOrg: user?.metadata?.primaryOrganization?.name || 'None assigned',
  }), [user]);

  if (isPending || !user) {
    return <LoadingSpinner message="Loading profile details…" />;
  }

  return (
    <Box component={motion.div} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Grid container spacing={3} alignItems="stretch">
        <Grid size={{ xs: 12, md: 6 }}>
          <MotionCard initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <CardHeader
              title="Personal details"
              action={
                <IconButton onClick={() => setDrawerOpen(true)} aria-label="Edit personal details">
                  <EditIcon />
                </IconButton>
              }
            />
            <CardContent>
              <DataRow label="Full name" value={user.fullName} />
              <DataRow label="Email" value={user.email} />
              <DataRow label="Username" value={user.username} />
              <DataRow label="Preferred roles" value={(user.roles || []).join(', ') || 'None'} />
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <MotionCard initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <CardHeader title="Organization" />
            <CardContent>
              <DataRow label="Primary organization" value={metadata.primaryOrg} />
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>Memberships</Typography>
              {user.memberships.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No org memberships assigned.</Typography>
              ) : (
                <Stack spacing={1.2}>
                  {user.memberships.map((membership) => (
                    <Box key={`${membership.orgId}-${membership.roleName}`}>
                      <Typography variant="body2" fontWeight={600}>{membership.orgName}</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip size="small" color="secondary" label={membership.roleName} />
                        <Typography variant="caption" color="text.secondary">{membership.roleDescription}</Typography>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <MotionCard initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <CardHeader title="Contact preferences" />
            <CardContent>
              <DataRow label="Mobile" value={metadata.mobile} />
              <DataRow label="Department" value={metadata.department} />
              <DataRow label="Designation" value={metadata.designation} />
              <DataRow label="Gender" value={metadata.gender} />
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <MotionCard initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <CardHeader title="Connected accounts" />
            <CardContent>
              {user.connectedAccounts.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No social providers connected.</Typography>
              ) : (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {user.connectedAccounts.map((account) => (
                    <Chip key={account.provider} label={account.provider} />
                  ))}
                </Stack>
              )}
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, p: 3 } }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={600}>Edit profile</Typography>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <EditIcon sx={{ transform: 'rotate(45deg)' }} />
          </IconButton>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <ProfileEditForm onClose={() => setDrawerOpen(false)} showContainer={false} />
      </Drawer>
    </Box>
  );
}

function DataRow({ label, value }) {
  return (
    <Stack spacing={0.5} sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={0.3}>
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Stack>
  );
}

