// components/security/SecurityOverviewCard.jsx
// Extracted from SecuritySettings.jsx - Security score and status display

import {
  Box, Card, CardContent, Typography, Grid, Paper, LinearProgress
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Shield as ShieldIcon,
  Smartphone as SmartphoneIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

/**
 * Get color based on security score
 */
export function getSecurityScoreColor(score) {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'error';
}

/**
 * Get text label for security score
 */
export function getSecurityScoreText(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}

/**
 * Security overview card with score and status indicators
 */
export function SecurityOverviewCard({ security }) {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Security Overview
        </Typography>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color={getSecurityScoreColor(security.securityScore)}>
                {security.securityScore}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Security Score - {getSecurityScoreText(security.securityScore)}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={security.securityScore}
                color={getSecurityScoreColor(security.securityScore)}
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={9}>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <CheckCircleIcon color={security.emailVerified ? 'success' : 'disabled'} />
                  <Typography variant="body2">Email Verified</Typography>
                  <Typography variant="h6">{security.emailVerified ? 'YES' : 'NO'}</Typography>
                </Paper>
              </Grid>

              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <ShieldIcon color={security.twoFactorEnabled ? 'success' : 'disabled'} />
                  <Typography variant="body2">2FA Status</Typography>
                  <Typography variant="h6">{security.twoFactorEnabled ? 'ON' : 'OFF'}</Typography>
                </Paper>
              </Grid>

              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <SmartphoneIcon color="primary" />
                  <Typography variant="body2">Active Sessions</Typography>
                  <Typography variant="h6">{security.activeSessions || 0}</Typography>
                </Paper>
              </Grid>

              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <WarningIcon color={security.failedLoginAttempts > 0 ? 'warning' : 'success'} />
                  <Typography variant="body2">Failed Logins</Typography>
                  <Typography variant="h6">{security.failedLoginAttempts || 0}</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default SecurityOverviewCard;
