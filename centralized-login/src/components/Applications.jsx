
// account-ui/src/components/Applications.jsx

import {
  Box, Card, CardContent, Typography, Grid, List, ListItem,
  ListItemText, ListItemAvatar, Avatar, Chip, Button
} from '@mui/material';
import { Apps as AppsIcon, Launch as LaunchIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import {auth} from '@spidy092/auth-client';
let api = auth.api;
function Applications() {
  // Fetch user's connected applications
  const { data: applications = [] } = useQuery({
    queryKey: ['user-applications'],
    queryFn: () => api.get('/account/applications').then(res => res.data)
  });

  const handleOpenApp = (app) => {
    if (app.redirectUris && app.redirectUris[0]) {
      window.open(app.redirectUris[0], '_blank');
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Connected Applications
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          These are the applications connected to your account. You can access them directly from here.
        </Typography>

        <Grid container spacing={2}>
          {applications.map((app) => (
            <Grid item xs={12} md={6} key={app.clientId}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      <AppsIcon />
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="h6">
                        {app.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {app.clientId}
                      </Typography>
                    </Box>
                    <Chip 
                      label={app.enabled ? 'Active' : 'Disabled'}
                      color={app.enabled ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" paragraph>
                    {app.description || 'No description available'}
                  </Typography>

                  <Box display="flex" gap={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<LaunchIcon />}
                      onClick={() => handleOpenApp(app)}
                      disabled={!app.enabled}
                    >
                      Open App
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {applications.length === 0 && (
            <Grid item xs={12}>
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">
                  No connected applications found
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
}

export default Applications;
