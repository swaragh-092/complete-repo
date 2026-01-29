
// account-ui/src/components/PrivacySettings.jsx

import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Switch, FormControlLabel,
  List, ListItem, ListItemText, ListItemIcon, Divider, Grid,
  Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  LinearProgress, Chip, Paper
} from '@mui/material';
import {
  LockPerson as PrivacyIcon, Download as DownloadIcon,
  Delete as DeleteIcon, Visibility as VisibilityIcon,
  Share as ShareIcon, Analytics as AnalyticsIcon,
  Cookie as CookieIcon, LocationOn as LocationIcon,
  Warning as WarningIcon, CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auth } from '@spidy092/auth-client';

function PrivacySettings() {
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Fetch privacy settings
  const { data: privacy = {} } = useQuery({
    queryKey: ['privacy-settings'],
    queryFn: () => auth.api.get('/account/privacy').then(res => res.data),
  });

  // Fetch data usage info
  const { data: dataUsage = {} } = useQuery({
    queryKey: ['data-usage'],
    queryFn: () => auth.api.get('/account/data-usage').then(res => res.data),
  });

  // Update privacy settings mutation
  const updatePrivacyMutation = useMutation({
    mutationFn: (data) => auth.api.put('/account/privacy', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['privacy-settings']);
    }
  });

  // Export data mutation
  const exportDataMutation = useMutation({
    mutationFn: () => auth.api.post('/account/export-data'),
    onSuccess: (response) => {
      // Simulate progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setExportProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          // Download file
          const link = document.createElement('a');
          link.href = response.data.downloadUrl;
          link.download = 'account-data.zip';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setExportDialogOpen(false);
          setExportProgress(0);
        }
      }, 500);
    }
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: () => auth.api.delete('/account/delete'),
    onSuccess: () => {
      auth.logout();
    }
  });

  const handleToggle = (key, value) => {
    updatePrivacyMutation.mutate({
      ...privacy,
      [key]: value
    });
  };

  const privacyControls = [
    {
      title: 'Data Collection',
      icon: <AnalyticsIcon />,
      settings: [
        {
          key: 'analytics',
          label: 'Usage Analytics',
          description: 'Help us improve by sharing anonymous usage data',
          value: privacy.analytics !== false
        },
        {
          key: 'performance',
          label: 'Performance Monitoring',
          description: 'Monitor app performance to fix issues faster',
          value: privacy.performance !== false
        },
        {
          key: 'crashReporting',
          label: 'Crash Reporting',
          description: 'Automatically send crash reports to help us fix bugs',
          value: privacy.crashReporting !== false
        }
      ]
    },
    {
      title: 'Personalization',
      icon: <VisibilityIcon />,
      settings: [
        {
          key: 'recommendations',
          label: 'Personalized Recommendations',
          description: 'Show recommendations based on your usage patterns',
          value: privacy.recommendations !== false
        },
        {
          key: 'targetedContent',
          label: 'Targeted Content',
          description: 'Show content tailored to your interests',
          value: privacy.targetedContent !== false
        }
      ]
    },
    {
      title: 'Third-Party Sharing',
      icon: <ShareIcon />,
      settings: [
        {
          key: 'partnerSharing',
          label: 'Partner Integration',
          description: 'Share data with trusted partners to enhance features',
          value: privacy.partnerSharing || false
        },
        {
          key: 'marketingPartners',
          label: 'Marketing Partners',
          description: 'Allow marketing partners to show relevant offers',
          value: privacy.marketingPartners || false
        }
      ]
    },
    {
      title: 'Location & Tracking',
      icon: <LocationIcon />,
      settings: [
        {
          key: 'locationTracking',
          label: 'Location Services',
          description: 'Use your location to provide relevant features',
          value: privacy.locationTracking || false
        },
        {
          key: 'crossDeviceTracking',
          label: 'Cross-Device Tracking',
          description: 'Link your activity across different devices',
          value: privacy.crossDeviceTracking || false
        }
      ]
    }
  ];

  return (
    <Box>
      {/* Privacy Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" display="flex" alignItems="center" gap={1} gutterBottom>
            <PrivacyIcon />
            Privacy & Data Control
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            You have full control over your personal data. Review and adjust these settings to match your privacy preferences.
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main">
                  {dataUsage.totalDataPoints || 0}
                </Typography>
                <Typography variant="caption">Data Points Collected</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {dataUsage.sharedPartners || 0}
                </Typography>
                <Typography variant="caption">Third-Party Partners</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {dataUsage.retentionDays || 365}
                </Typography>
                <Typography variant="caption">Days Data Retained</Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Privacy Controls */}
      {privacyControls.map((section, sectionIndex) => (
        <Card key={sectionIndex} sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" display="flex" alignItems="center" gap={1} gutterBottom>
              {section.icon}
              {section.title}
            </Typography>

            <List>
              {section.settings.map((setting, settingIndex) => (
                <Box key={settingIndex}>
                  <ListItem>
                    <ListItemText
                      primary={setting.label}
                      secondary={setting.description}
                    />
                    <Switch
                      checked={setting.value}
                      onChange={(e) => handleToggle(setting.key, e.target.checked)}
                    />
                  </ListItem>
                  {settingIndex < section.settings.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </CardContent>
        </Card>
      ))}

      {/* Data Management */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Data Management
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Take control of your personal data with these tools.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => setExportDialogOpen(true)}
                sx={{ p: 2, justifyContent: 'flex-start' }}
              >
                <Box textAlign="left">
                  <Typography variant="subtitle2" display="block">
                    Download Your Data
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Get a copy of all your personal data
                  </Typography>
                </Box>
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
                sx={{ p: 2, justifyContent: 'flex-start' }}
              >
                <Box textAlign="left">
                  <Typography variant="subtitle2" display="block">
                    Delete Account
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Permanently delete your account and data
                  </Typography>
                </Box>
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Legal Information */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Legal Information
          </Typography>
          <List>
            <ListItem button>
              <ListItemText
                primary="Privacy Policy"
                secondary="Learn how we collect and use your data"
              />
            </ListItem>
            <Divider />
            <ListItem button>
              <ListItemText
                primary="Terms of Service"
                secondary="Our terms and conditions"
              />
            </ListItem>
            <Divider />
            <ListItem button>
              <ListItemText
                primary="Cookie Policy"
                secondary="How we use cookies and similar technologies"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Export Data Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Export Your Data</DialogTitle>
        <DialogContent>
          {exportProgress > 0 ? (
            <Box>
              <Typography gutterBottom>
                Preparing your data export...
              </Typography>
              <LinearProgress variant="determinate" value={exportProgress} sx={{ mb: 2 }} />
              <Typography variant="caption" color="text.secondary">
                {exportProgress}% complete
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography paragraph>
                We'll create a downloadable file containing all your personal data, including:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                  <ListItemText primary="Profile information" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                  <ListItemText primary="Account settings" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                  <ListItemText primary="Activity logs" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                  <ListItemText primary="Connected applications" />
                </ListItem>
              </List>
              <Alert severity="info" sx={{ mt: 2 }}>
                The export process may take a few minutes. You'll receive an email when it's ready.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)} disabled={exportProgress > 0}>
            Cancel
          </Button>
          <Button 
            onClick={() => exportDataMutation.mutate()}
            variant="contained"
            disabled={exportDataMutation.isLoading || exportProgress > 0}
          >
            {exportProgress > 0 ? 'Exporting...' : 'Start Export'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle color="error">Delete Account</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              This action cannot be undone
            </Typography>
            Deleting your account will permanently remove all your data and cannot be reversed.
          </Alert>

          <Typography paragraph>
            Before you delete your account, consider:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><WarningIcon color="warning" /></ListItemIcon>
              <ListItemText primary="Download your data if you want to keep it" />
            </ListItem>
            <ListItem>
              <ListItemIcon><WarningIcon color="warning" /></ListItemIcon>
              <ListItemText primary="You'll lose access to all connected applications" />
            </ListItem>
            <ListItem>
              <ListItemIcon><WarningIcon color="warning" /></ListItemIcon>
              <ListItemText primary="This action is permanent and irreversible" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Keep Account
          </Button>
          <Button 
            onClick={() => deleteAccountMutation.mutate()}
            color="error"
            variant="contained"
            disabled={deleteAccountMutation.isLoading}
          >
            {deleteAccountMutation.isLoading ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PrivacySettings;
