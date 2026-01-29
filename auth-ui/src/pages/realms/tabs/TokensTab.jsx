import React from 'react';
import { Controller } from 'react-hook-form';
import { 
  Box, Card, CardContent, Typography, Grid, TextField, InputAdornment 
} from '@mui/material';
import { Schedule } from '@mui/icons-material';

function TokensTab({ control, realm }) {
  return (
    <Box sx={{ maxWidth: 900 }}>
      {/* Access Tokens Card */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Schedule fontSize="small" /> Access Tokens
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Controller
                name="accessTokenLifespan"
                control={control}
                defaultValue={realm?.accessTokenLifespan || 300}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Access Token Lifespan"
                    type="number"
                    fullWidth
                    size="small"
                    InputProps={{ endAdornment: <InputAdornment position="end">seconds</InputAdornment> }}
                    helperText="How long access tokens are valid"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="accessCodeLifespan"
                control={control}
                defaultValue={realm?.accessCodeLifespan || 60}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Access Code Lifespan"
                    type="number"
                    fullWidth
                    size="small"
                    InputProps={{ endAdornment: <InputAdornment position="end">seconds</InputAdornment> }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="accessCodeLifespanUserAction"
                control={control}
                defaultValue={realm?.accessCodeLifespanUserAction || 300}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="User Action Lifespan"
                    type="number"
                    fullWidth
                    size="small"
                    InputProps={{ endAdornment: <InputAdornment position="end">seconds</InputAdornment> }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="accessCodeLifespanLogin"
                control={control}
                defaultValue={realm?.accessCodeLifespanLogin || 1800}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Login Lifespan"
                    type="number"
                    fullWidth
                    size="small"
                    InputProps={{ endAdornment: <InputAdornment position="end">seconds</InputAdornment> }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* SSO Session Card */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            SSO Session
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Controller
                name="ssoSessionIdleTimeout"
                control={control}
                defaultValue={realm?.ssoSessionIdleTimeout || 1800}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="SSO Session Idle"
                    type="number"
                    fullWidth
                    size="small"
                    InputProps={{ endAdornment: <InputAdornment position="end">seconds</InputAdornment> }}
                    helperText="Max idle time before session expires"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="ssoSessionMaxLifespan"
                control={control}
                defaultValue={realm?.ssoSessionMaxLifespan || 36000}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="SSO Session Max"
                    type="number"
                    fullWidth
                    size="small"
                    InputProps={{ endAdornment: <InputAdornment position="end">seconds</InputAdornment> }}
                    helperText="Maximum session length"
                  />
                )}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Offline Session Card */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Offline Session
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Controller
                name="offlineSessionIdleTimeout"
                control={control}
                defaultValue={realm?.offlineSessionIdleTimeout || 2592000}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Offline Session Idle"
                    type="number"
                    fullWidth
                    size="small"
                    InputProps={{ endAdornment: <InputAdornment position="end">seconds</InputAdornment> }}
                    helperText="Idle timeout for offline sessions"
                  />
                )}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

export default TokensTab;
