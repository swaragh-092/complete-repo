import React from 'react';
import { Controller } from 'react-hook-form';
import { 
  Box, Card, CardContent, Typography, Grid, TextField, 
  FormControl, InputLabel, Select, MenuItem, FormHelperText, 
  FormControlLabel, Switch, Alert 
} from '@mui/material';
import { Warning } from '@mui/icons-material';

function GeneralTab({ control, errors, realm }) {
  return (
    <Box sx={{ maxWidth: 900 }}>
      {/* Basic Information Card */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Basic Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Controller
                name="displayName"
                control={control}
                defaultValue={realm?.display_name || realm?.displayName || ''}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Display Name"
                    fullWidth
                    size="small"
                    error={!!errors.displayName}
                    helperText={errors.displayName?.message || 'Friendly name shown to users'}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                label="Realm Name" 
                value={realm?.realm_name || realm?.realm || ''} 
                fullWidth 
                size="small"
                disabled 
                helperText="Realm identifier (cannot be changed)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                label="Realm ID" 
                value={realm?.id || ''} 
                fullWidth 
                size="small"
                disabled 
                helperText="Unique identifier"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Security Settings Card */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Security Settings
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>SSL Required</InputLabel>
                <Controller
                  name="sslRequired"
                  control={control}
                  defaultValue={realm?.sslRequired || 'external'}
                  render={({ field }) => (
                    <Select {...field} label="SSL Required">
                      <MenuItem value="none">None (Not Recommended)</MenuItem>
                      <MenuItem value="external">External Requests</MenuItem>
                      <MenuItem value="all">All Requests (Recommended)</MenuItem>
                    </Select>
                  )}
                />
                <FormHelperText sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Warning fontSize="small" color="warning" />
                  Critical setting - affects security
                </FormHelperText>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Realm Status Card */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Realm Status
          </Typography>
          <Controller
            name="enabled"
            control={control}
            defaultValue={realm?.enabled ?? true}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch {...field} checked={field.value} color="success" />}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography fontWeight={500}>Realm Enabled</Typography>
                    {!field.value && <Warning color="warning" fontSize="small" />}
                  </Box>
                }
              />
            )}
          />
          <Alert severity="warning" variant="outlined" sx={{ mt: 2 }}>
            Disabling the realm will prevent all users from authenticating
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
}

export default GeneralTab;
