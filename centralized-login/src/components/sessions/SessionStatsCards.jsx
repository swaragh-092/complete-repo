// components/sessions/SessionStatsCards.jsx
// Extracted from Sessions.jsx - Presentational component for session statistics

import { Card, CardContent, Typography, Grid } from '@mui/material';

/**
 * Displays session statistics in a card grid layout
 * @param {Object} stats - Session statistics object
 * @param {number} stats.active - Number of active sessions
 * @param {number} stats.devices - Number of device types
 * @param {number} stats.clients - Number of connected applications
 * @param {number} stats.suspicious - Number of suspicious sessions
 */
export function SessionStatsCards({ stats }) {
  return (
    <Grid container spacing={3} mb={4}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Active Sessions
            </Typography>
            <Typography variant="h4" component="div">
              {stats.active}
            </Typography>
            <Typography variant="body2">
              Across {stats.clients} applications
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Device Types
            </Typography>
            <Typography variant="h4" component="div">
              {stats.devices}
            </Typography>
            <Typography variant="body2">
              Different device categories
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Applications
            </Typography>
            <Typography variant="h4" component="div">
              {stats.clients}
            </Typography>
            <Typography variant="body2">
              Connected services
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Alerts
            </Typography>
            <Typography variant="h4" component="div" color={stats.suspicious > 0 ? 'error.main' : 'success.main'}>
              {stats.suspicious}
            </Typography>
            <Typography variant="body2">
              {stats.suspicious > 0 ? 'Suspicious sessions' : 'All secure'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default SessionStatsCards;
