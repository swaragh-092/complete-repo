import { useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  DevicesOtherRounded as DeviceIcon,
  DeleteRounded as DeleteIcon,
  ShieldRounded as ShieldIcon,
  RefreshRounded as RefreshIcon,
  CheckCircleRounded as CheckIcon,
  ReportProblemRounded as WarningIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import LoadingSpinner from '../components/LoadingSpinner';
import { useDevices } from '../hooks/useDevices';
import { useQueryClient } from '@tanstack/react-query';

const MotionCard = motion.create(Card);

const trustStatusCopy = {
  trusted: { label: 'Trusted', color: 'success' },
  pending: { label: 'Pending review', color: 'warning' },
  revoked: { label: 'Revoked', color: 'default' },
};

export default function TrustedDevicesPage() {
  const queryClient = useQueryClient();
  const {
    data: devices,
    isPending,
    error,
    trustDevice,
    revokeDevice,
    revokeAll,
    registerDevice,
    trusting,
    revoking,
    revokingAll,
    registering,
  } = useDevices();

  const [selectedDevice, setSelectedDevice] = useState(null);
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);

  const summary = useMemo(() => {
    const total = devices.length;
    const trusted = devices.filter((device) => device.trust_status === 'trusted').length;
    const pending = devices.filter((device) => device.trust_status === 'pending').length;
    const highRisk = devices.filter((device) => device.risk_level === 'HIGH').length;
    return { total, trusted, pending, highRisk };
  }, [devices]);

  const handleRegister = () => {
    registerDevice({
      screenWidth: window?.screen?.width ?? 0,
      screenHeight: window?.screen?.height ?? 0,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      colorDepth: window?.screen?.colorDepth ?? 24,
      location: null,
    });
  };

  if (isPending) {
    return <LoadingSpinner message="Fetching trusted devices…" />;
  }

  if (error) {
    return (
      <Alert severity="error" color="error">
        Unable to load trusted devices. Please refresh the page or try again later.
      </Alert>
    );
  }

  return (
    <Box component={motion.div} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <MetricCard title="Registered" value={summary.total} helper="Total devices" gradient />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard title="Trusted" value={summary.trusted} helper="Verified devices" color="success" />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard title="Pending" value={summary.pending} helper="Awaiting confirmation" color="warning" />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard title="Risk" value={summary.highRisk} helper="High risk logins" color={summary.highRisk > 0 ? 'error' : 'success'} />
        </Grid>
      </Grid>

      {summary.highRisk > 0 && (
        <Alert severity="warning" icon={<WarningIcon fontSize="inherit" />} sx={{ mb: 3 }}>
          We detected {summary.highRisk} high-risk device{s(summary.highRisk)}. Review and revoke unfamiliar devices immediately.
        </Alert>
      )}

      <MotionCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <CardHeader
          title="Trusted devices"
          subheader="Devices that have accessed your account"
          action={
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => queryClient.invalidateQueries({ queryKey: ['devices', 'trusted'] })}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<DeviceIcon />}
                onClick={handleRegister}
                disabled={registering}
              >
                {registering ? 'Registering…' : 'Register this device'}
              </Button>
            </Stack>
          }
        />
        <CardContent>
          {devices.length === 0 ? (
            <EmptyState message="No devices registered yet. We’ll automatically register this browser after your next login." />
          ) : (
            <Stack spacing={2.5}>
              {devices.map((device) => {
                const status = trustStatusCopy[device.trust_status] || trustStatusCopy.pending;
                const riskTone = device.risk_level === 'HIGH' ? 'error' : device.risk_level === 'MEDIUM' ? 'warning' : 'default';

                return (
                  <Box key={device.id} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} justifyContent="space-between">
                      <Stack spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }} direction={{ xs: 'column', sm: 'row' }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>{device.device_type?.[0]?.toUpperCase() || 'D'}</Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>{device.device_name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {device.browser} • {device.os} {device.os_version}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip label={status.label} color={status.color} size="small" />
                        <Chip label={device.location || 'Unknown location'} variant="outlined" size="small" />
                        <Chip label={formatDistanceToNow(new Date(device.last_used), { addSuffix: true })} variant="outlined" size="small" />
                        <Chip label={`${device.risk_level || 'LOW'} risk`} color={riskTone} size="small" variant={riskTone === 'default' ? 'outlined' : 'filled'} />
                      </Stack>
                    </Stack>
                    <Divider sx={{ my: 2 }} />
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                      <Typography variant="caption" color="text.secondary">
                        IP • {device.ip_address}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        {device.trust_status === 'pending' && (
                          <Button size="small" variant="contained" color="primary" startIcon={<CheckIcon />} onClick={() => trustDevice(device.id)} disabled={trusting}>
                            Approve
                          </Button>
                        )}
                        <Tooltip title="Revoke device">
                          <IconButton color="error" onClick={() => setSelectedDevice(device)} disabled={revoking}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </MotionCard>

      {devices.length > 0 && (
        <Alert severity="error" sx={{ mt: 4 }} icon={<ShieldIcon fontSize="inherit" />}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
            <Box>
              <Typography variant="subtitle2">Need to revoke everything?</Typography>
              <Typography variant="caption" color="text.secondary">
                If you suspect unauthorised access, revoke trust from all devices immediately.
              </Typography>
            </Box>
            <Button variant="contained" color="error" onClick={() => setConfirmRevokeAll(true)} disabled={revokingAll}>
              {revokingAll ? 'Revoking…' : 'Revoke all devices'}
            </Button>
          </Stack>
        </Alert>
      )}

      <Dialog open={Boolean(selectedDevice)} onClose={() => setSelectedDevice(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Revoke device access</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Are you sure you want to revoke trust for <strong>{selectedDevice?.device_name}</strong>?
          </Typography>
          <Typography variant="caption" color="text.secondary">
            The next time you sign in on this device you will need to complete the MFA flow again.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedDevice(null)}>Cancel</Button>
          <Button
            onClick={() => {
              if (selectedDevice) revokeDevice(selectedDevice.id);
              setSelectedDevice(null);
            }}
            color="error"
            variant="contained"
            disabled={revoking}
          >
            {revoking ? 'Revoking…' : 'Revoke device'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmRevokeAll} onClose={() => setConfirmRevokeAll(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Revoke all devices</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            This action will remove trust from every registered device. You will be signed out everywhere.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Continue only if you believe your account is at risk.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRevokeAll(false)}>Cancel</Button>
          <Button onClick={() => { revokeAll(); setConfirmRevokeAll(false); }} color="error" variant="contained" disabled={revokingAll}>
            {revokingAll ? 'Revoking…' : 'Revoke all'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function MetricCard({ title, value, helper, gradient = false, color = 'primary' }) {
  return (
    <MotionCard
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      sx={{
        height: '100%',
        background: gradient ? 'linear-gradient(135deg, rgba(37,99,235,0.16) 0%, rgba(124,58,237,0.14) 100%)' : undefined,
      }}
    >
      <CardContent>
        <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={0.4}>
          {title}
        </Typography>
        <Typography variant="h4" fontWeight={700} mt={0.5} color={`${color}.main`}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {helper}
        </Typography>
      </CardContent>
    </MotionCard>
  );
}

function EmptyState({ message }) {
  return (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <Typography variant="body2" color="text.secondary">{message}</Typography>
    </Box>
  );
}

function s(value) {
  return value === 1 ? '' : 's';
}
