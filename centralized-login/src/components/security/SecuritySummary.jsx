import { Card, CardContent, Typography, Grid } from '@mui/material';
import { useSecurity } from '../../hooks/useSecurity';
import { useDevices } from '../../hooks/useDevices';

export default function SecuritySummary() {
  const { status } = useSecurity();
  const { data: devices = [] } = useDevices();

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Security Overview</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">Two-Factor Auth</Typography>
            <Typography variant="h5">{status.data?.enabled ? 'Enabled' : 'Disabled'}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">Trusted Devices</Typography>
            <Typography variant="h5">{devices.length}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">Last Password Change</Typography>
            <Typography variant="h5">
              {status.data?.lastPasswordChange ? 
                new Date(status.data.lastPasswordChange).toLocaleDateString() : 'Unknown'}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
