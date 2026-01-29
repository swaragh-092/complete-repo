import { Box, Card, CardContent, Typography, Button, Alert } from '@mui/material';
import { useSecurity } from '../../hooks/useSecurity';
import SecurityIcon from '@mui/icons-material/Security';

export default function TwoFactorSection() {
  const { status, startSetup, checkConfigured, disable } = useSecurity();
  const enabled = status.data?.enabled ?? false;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <SecurityIcon color={enabled ? 'success' : 'disabled'} fontSize="large" />
          <Typography variant="h6">Two-Factor Authentication</Typography>
        </Box>

        {enabled ? (
          <>
            <Alert severity="success" sx={{ mb: 2 }}>2FA is enabled on your account.</Alert>
            <Button color="error" variant="outlined" onClick={() => disable.mutate()}>
              Disable 2FA
            </Button>
          </>
        ) : (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              2FA adds an extra layer of security. You’ll be redirected to Keycloak for setup.
            </Alert>
            <Box display="flex" gap={1}>
              <Button variant="contained" onClick={() => startSetup.mutate()}>
                Enable 2FA
              </Button>
              <Button variant="outlined" onClick={() => checkConfigured.mutate()}>
                Check Configuration
              </Button>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
