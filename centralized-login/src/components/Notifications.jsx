
// account-ui/src/components/Notifications.jsx


import {
  Box, Card, CardContent, Typography, Switch, FormControlLabel,
  List, ListItem, ListItemText, ListItemIcon, Divider, Grid,
  Button, Alert, Chip, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Notifications as NotificationsIcon, Email as EmailIcon,
  Sms as SmsIcon, Security as SecurityIcon, Apps as AppsIcon,
  Update as UpdateIcon, Campaign as MarketingIcon,
  VolumeOff as VolumeOffIcon, Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auth } from '@spidy092/auth-client';

function Notifications() {
  const queryClient = useQueryClient();

  // Fetch notification preferences
  const { data: preferences = {} } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => auth.api.get('/account/notifications').then(res => res.data),
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: (data) => auth.api.put('/account/notifications', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['notification-preferences']);
    }
  });

  const handleToggle = (key, value) => {
    updatePreferencesMutation.mutate({
      ...preferences,
      [key]: value
    });
  };

  const notificationCategories = [
    {
      title: 'Security & Account',
      icon: <SecurityIcon />,
      description: 'Important security updates and account changes',
      settings: [
        {
          key: 'securityAlerts',
          label: 'Security alerts',
          description: 'Suspicious sign-ins and security events',
          email: preferences.securityAlerts?.email !== false,
          push: preferences.securityAlerts?.push !== false,
          critical: true
        },
        {
          key: 'loginNotifications',
          label: 'New sign-ins',
          description: 'When someone signs into your account',
          email: preferences.loginNotifications?.email !== false,
          push: preferences.loginNotifications?.push !== false
        },
        {
          key: 'passwordChanges',
          label: 'Password changes',
          description: 'When your password is changed',
          email: preferences.passwordChanges?.email !== false,
          push: preferences.passwordChanges?.push !== false,
          critical: true
        }
      ]
    },
    {
      title: 'Applications & Services',
      icon: <AppsIcon />,
      description: 'Updates about connected apps and services',
      settings: [
        {
          key: 'appUpdates',
          label: 'App updates',
          description: 'New features and updates in connected apps',
          email: preferences.appUpdates?.email !== false,
          push: preferences.appUpdates?.push !== false
        },
        {
          key: 'serviceStatus',
          label: 'Service status',
          description: 'Maintenance and downtime notifications',
          email: preferences.serviceStatus?.email !== false,
          push: preferences.serviceStatus?.push !== false
        }
      ]
    },
    {
      title: 'Marketing & Tips',
      icon: <MarketingIcon />,
      description: 'Product updates and helpful tips',
      settings: [
        {
          key: 'productUpdates',
          label: 'Product updates',
          description: 'New features and product announcements',
          email: preferences.productUpdates?.email || false,
          push: preferences.productUpdates?.push || false
        },
        {
          key: 'tips',
          label: 'Tips and tutorials',
          description: 'Helpful guides and best practices',
          email: preferences.tips?.email || false,
          push: preferences.tips?.push || false
        },
        {
          key: 'newsletter',
          label: 'Newsletter',
          description: 'Monthly newsletter with updates',
          email: preferences.newsletter?.email || false,
          push: false
        }
      ]
    }
  ];

  return (
    <Box>
      {/* Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" display="flex" alignItems="center" gap={1}>
              <NotificationsIcon />
              Notification Preferences
            </Typography>
            <Button
              variant="outlined"
              startIcon={<VolumeOffIcon />}
              onClick={() => handleToggle('allNotifications', false)}
              size="small"
            >
              Disable All
            </Button>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            Choose how you want to be notified about account activity and updates. 
            Critical security notifications cannot be disabled.
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Email Frequency</InputLabel>
                <Select
                  value={preferences.emailFrequency || 'immediate'}
                  onChange={(e) => handleToggle('emailFrequency', e.target.value)}
                >
                  <MenuItem value="immediate">Immediate</MenuItem>
                  <MenuItem value="daily">Daily Digest</MenuItem>
                  <MenuItem value="weekly">Weekly Summary</MenuItem>
                  <MenuItem value="never">Never</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Quiet Hours</InputLabel>
                <Select
                  value={preferences.quietHours || 'none'}
                  onChange={(e) => handleToggle('quietHours', e.target.value)}
                >
                  <MenuItem value="none">No quiet hours</MenuItem>
                  <MenuItem value="evening">6 PM - 9 AM</MenuItem>
                  <MenuItem value="night">10 PM - 8 AM</MenuItem>
                  <MenuItem value="weekend">Weekends only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Notification Categories */}
      {notificationCategories.map((category, categoryIndex) => (
        <Card key={categoryIndex} sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" display="flex" alignItems="center" gap={1} gutterBottom>
              {category.icon}
              {category.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {category.description}
            </Typography>

            <List>
              {category.settings.map((setting, settingIndex) => (
                <Box key={settingIndex}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          {setting.label}
                          {setting.critical && (
                            <Chip label="Required" size="small" color="error" />
                          )}
                        </Box>
                      }
                      secondary={setting.description}
                    />
                    <Box display="flex" gap={2}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={setting.email}
                            onChange={(e) => handleToggle(setting.key, {
                              ...preferences[setting.key],
                              email: e.target.checked
                            })}
                            disabled={setting.critical && setting.email}
                          />
                        }
                        label={<EmailIcon />}
                      />
                      {setting.push !== undefined && (
                        <FormControlLabel
                          control={
                            <Switch
                              checked={setting.push}
                              onChange={(e) => handleToggle(setting.key, {
                                ...preferences[setting.key],
                                push: e.target.checked
                              })}
                              disabled={setting.critical && setting.push}
                            />
                          }
                          label={<NotificationsIcon />}
                        />
                      )}
                    </Box>
                  </ListItem>
                  {settingIndex < category.settings.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </CardContent>
        </Card>
      ))}

      {/* Contact Preferences */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Contact Information
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Make sure your contact information is up to date to receive important notifications.
          </Typography>

          <List>
            <ListItem>
              <ListItemIcon>
                <EmailIcon />
              </ListItemIcon>
              <ListItemText
                primary="Email Address"
                secondary={preferences.contactEmail || "Not set"}
              />
              <Button variant="outlined" size="small">
                Update
              </Button>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon>
                <SmsIcon />
              </ListItemIcon>
              <ListItemText
                primary="Phone Number"
                secondary={preferences.contactPhone || "Not set"}
              />
              <Button variant="outlined" size="small">
                Add Phone
              </Button>
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Notifications;
