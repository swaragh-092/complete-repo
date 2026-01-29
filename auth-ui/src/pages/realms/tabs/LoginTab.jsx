import React from 'react';
import { Controller } from 'react-hook-form';
import { Grid, Typography, FormControlLabel, Switch, Divider } from '@mui/material';

function LoginTab({ control, realm }) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>User Registration</Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="registrationAllowed"
          control={control}
          defaultValue={realm?.registrationAllowed ?? false}
          render={({ field }) => (
            <FormControlLabel
              control={<Switch {...field} checked={field.value} />}
              label="User Registration Enabled"
            />
          )}
        />
        <Typography variant="caption" color="text.secondary" sx={{ ml: 4, display: 'block' }}>
          Allow users to self-register
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="registrationEmailAsUsername"
          control={control}
          defaultValue={realm?.registrationEmailAsUsername ?? false}
          render={({ field }) => (
            <FormControlLabel
              control={<Switch {...field} checked={field.value} />}
              label="Email as Username"
            />
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="verifyEmail"
          control={control}
          defaultValue={realm?.verifyEmail ?? false}
          render={({ field }) => (
            <FormControlLabel
              control={<Switch {...field} checked={field.value} />}
              label="Verify Email"
            />
          )}
        />
        <Typography variant="caption" color="text.secondary" sx={{ ml: 4, display: 'block' }}>
          Require email verification on registration
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>Login Options</Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="loginWithEmailAllowed"
          control={control}
          defaultValue={realm?.loginWithEmailAllowed ?? true}
          render={({ field }) => (
            <FormControlLabel
              control={<Switch {...field} checked={field.value} />}
              label="Login with Email"
            />
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="duplicateEmailsAllowed"
          control={control}
          defaultValue={realm?.duplicateEmailsAllowed ?? false}
          render={({ field }) => (
            <FormControlLabel
              control={<Switch {...field} checked={field.value} />}
              label="Allow Duplicate Emails"
            />
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="resetPasswordAllowed"
          control={control}
          defaultValue={realm?.resetPasswordAllowed ?? false}
          render={({ field }) => (
            <FormControlLabel
              control={<Switch {...field} checked={field.value} />}
              label="Forgot Password Enabled"
            />
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="rememberMe"
          control={control}
          defaultValue={realm?.rememberMe ?? false}
          render={({ field }) => (
            <FormControlLabel
              control={<Switch {...field} checked={field.value} />}
              label="Remember Me"
            />
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="editUsernameAllowed"
          control={control}
          defaultValue={realm?.editUsernameAllowed ?? false}
          render={({ field }) => (
            <FormControlLabel
              control={<Switch {...field} checked={field.value} />}
              label="Edit Username Allowed"
            />
          )}
        />
      </Grid>
    </Grid>
  );
}

export default LoginTab;
