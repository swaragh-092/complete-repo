
// account-ui/src/components/Preferences.jsx


import {
  Box, Card, CardContent, Typography, FormControl, InputLabel,
  Select, MenuItem, Switch, FormControlLabel, Grid, Button,
  List, ListItem, ListItemText, ListItemIcon, Divider,
  RadioGroup, Radio, Slider, Chip
} from '@mui/material';
import {
  Palette as PaletteIcon, Language as LanguageIcon,
  Schedule as ScheduleIcon, Notifications as NotificationsIcon,
  ViewModule as ViewModuleIcon, Speed as SpeedIcon,
  Accessibility as AccessibilityIcon, Storage as StorageIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auth } from '@spidy092/auth-client';

function Preferences() {
  const queryClient = useQueryClient();

  // Fetch user preferences
  const { data: preferences = {} } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: () => auth.api.get('/account/preferences').then(res => res.data),
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: (data) => auth.api.put('/account/preferences', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-preferences']);
    }
  });

  const handleUpdate = (key, value) => {
    updatePreferencesMutation.mutate({
      ...preferences,
      [key]: value
    });
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  ];

  const timezones = [
    'UTC-12:00 - Baker Island',
    'UTC-08:00 - Pacific Time (US)',
    'UTC-05:00 - Eastern Time (US)',
    'UTC+00:00 - London (GMT)',
    'UTC+01:00 - Paris (CET)',
    'UTC+05:30 - India (IST)',
    'UTC+08:00 - Singapore (SGT)',
    'UTC+09:00 - Tokyo (JST)',
    'UTC+10:00 - Sydney (AEST)',
  ];

  return (
    <Box>
      {/* Appearance */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" display="flex" alignItems="center" gap={1} gutterBottom>
            <PaletteIcon />
            Appearance
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Theme</InputLabel>
                <Select
                  value={preferences.theme || 'system'}
                  onChange={(e) => handleUpdate('theme', e.target.value)}
                >
                  <MenuItem value="light">☀️ Light</MenuItem>
                  <MenuItem value="dark">🌙 Dark</MenuItem>
                  <MenuItem value="system">💻 System</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Color Scheme</InputLabel>
                <Select
                  value={preferences.colorScheme || 'blue'}
                  onChange={(e) => handleUpdate('colorScheme', e.target.value)}
                >
                  <MenuItem value="blue">🔵 Blue</MenuItem>
                  <MenuItem value="green">🟢 Green</MenuItem>
                  <MenuItem value="purple">🟣 Purple</MenuItem>
                  <MenuItem value="orange">🟠 Orange</MenuItem>
                  <MenuItem value="red">🔴 Red</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Display Density
            </Typography>
            <RadioGroup
              value={preferences.density || 'comfortable'}
              onChange={(e) => handleUpdate('density', e.target.value)}
              row
            >
              <FormControlLabel value="compact" control={<Radio />} label="Compact" />
              <FormControlLabel value="comfortable" control={<Radio />} label="Comfortable" />
              <FormControlLabel value="spacious" control={<Radio />} label="Spacious" />
            </RadioGroup>
          </Box>

          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.reducedMotion || false}
                  onChange={(e) => handleUpdate('reducedMotion', e.target.checked)}
                />
              }
              label="Reduce motion and animations"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Language & Region */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" display="flex" alignItems="center" gap={1} gutterBottom>
            <LanguageIcon />
            Language & Region
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  value={preferences.language || 'en'}
                  onChange={(e) => handleUpdate('language', e.target.value)}
                >
                  {languages.map((lang) => (
                    <MenuItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Time Zone</InputLabel>
                <Select
                  value={preferences.timezone || 'UTC+00:00'}
                  onChange={(e) => handleUpdate('timezone', e.target.value)}
                >
                  {timezones.map((tz) => (
                    <MenuItem key={tz} value={tz}>
                      {tz}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Date Format</InputLabel>
                <Select
                  value={preferences.dateFormat || 'MM/DD/YYYY'}
                  onChange={(e) => handleUpdate('dateFormat', e.target.value)}
                >
                  <MenuItem value="MM/DD/YYYY">MM/DD/YYYY (US)</MenuItem>
                  <MenuItem value="DD/MM/YYYY">DD/MM/YYYY (EU)</MenuItem>
                  <MenuItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Time Format</InputLabel>
                <Select
                  value={preferences.timeFormat || '12h'}
                  onChange={(e) => handleUpdate('timeFormat', e.target.value)}
                >
                  <MenuItem value="12h">12 Hour (AM/PM)</MenuItem>
                  <MenuItem value="24h">24 Hour</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Performance */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" display="flex" alignItems="center" gap={1} gutterBottom>
            <SpeedIcon />
            Performance
          </Typography>

          <List>
            <ListItem>
              <ListItemText
                primary="Auto-save frequency"
                secondary="How often to automatically save changes"
              />
              <Slider
                value={preferences.autoSaveInterval || 30}
                onChange={(e, value) => handleUpdate('autoSaveInterval', value)}
                min={10}
                max={300}
                step={10}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}s`}
                sx={{ width: 150, ml: 2 }}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Enable fast loading"
                secondary="Preload content for faster navigation"
              />
              <Switch
                checked={preferences.fastLoading !== false}
                onChange={(e) => handleUpdate('fastLoading', e.target.checked)}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Background sync"
                secondary="Keep data synchronized in the background"
              />
              <Switch
                checked={preferences.backgroundSync !== false}
                onChange={(e) => handleUpdate('backgroundSync', e.target.checked)}
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Accessibility */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" display="flex" alignItems="center" gap={1} gutterBottom>
            <AccessibilityIcon />
            Accessibility
          </Typography>

          <List>
            <ListItem>
              <ListItemText
                primary="High contrast mode"
                secondary="Increase contrast for better readability"
              />
              <Switch
                checked={preferences.highContrast || false}
                onChange={(e) => handleUpdate('highContrast', e.target.checked)}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Large text"
                secondary="Increase text size throughout the application"
              />
              <Switch
                checked={preferences.largeText || false}
                onChange={(e) => handleUpdate('largeText', e.target.checked)}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Screen reader support"
                secondary="Enhanced compatibility with screen readers"
              />
              <Switch
                checked={preferences.screenReader || false}
                onChange={(e) => handleUpdate('screenReader', e.target.checked)}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Keyboard navigation"
                secondary="Enhanced keyboard shortcuts and navigation"
              />
              <Switch
                checked={preferences.keyboardNavigation !== false}
                onChange={(e) => handleUpdate('keyboardNavigation', e.target.checked)}
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Data & Storage */}
      <Card>
        <CardContent>
          <Typography variant="h6" display="flex" alignItems="center" gap={1} gutterBottom>
            <StorageIcon />
            Data & Storage
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Box textAlign="center" p={2} bgcolor="grey.50" borderRadius={2}>
                <Typography variant="h4" color="primary">
                  {preferences.storageUsed || '2.3'} GB
                </Typography>
                <Typography variant="caption">Storage Used</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box textAlign="center" p={2} bgcolor="grey.50" borderRadius={2}>
                <Typography variant="h4" color="success.main">
                  {preferences.cacheSize || '156'} MB
                </Typography>
                <Typography variant="caption">Cache Size</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box textAlign="center" p={2} bgcolor="grey.50" borderRadius={2}>
                <Typography variant="h4" color="warning.main">
                  {preferences.offlineData || '45'} MB
                </Typography>
                <Typography variant="caption">Offline Data</Typography>
              </Box>
            </Grid>
          </Grid>

          <List>
            <ListItem>
              <ListItemText
                primary="Cache duration"
                secondary="How long to keep cached data"
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={preferences.cacheDuration || '7d'}
                  onChange={(e) => handleUpdate('cacheDuration', e.target.value)}
                >
                  <MenuItem value="1d">1 Day</MenuItem>
                  <MenuItem value="7d">1 Week</MenuItem>
                  <MenuItem value="30d">1 Month</MenuItem>
                  <MenuItem value="90d">3 Months</MenuItem>
                </Select>
              </FormControl>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Offline mode"
                secondary="Allow using the app without internet connection"
              />
              <Switch
                checked={preferences.offlineMode !== false}
                onChange={(e) => handleUpdate('offlineMode', e.target.checked)}
              />
            </ListItem>
          </List>

          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button variant="outlined" size="small">
              Clear Cache
            </Button>
            <Button variant="outlined" size="small">
              Clear Offline Data
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Preferences;