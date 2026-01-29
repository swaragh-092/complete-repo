import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  Typography,
  Divider,
  Alert
} from '@mui/material';

function IdentityProviderEditForm({ initialData, onSubmit, loading }) {
  const { control, handleSubmit, formState: { errors, isDirty } } = useForm({
    defaultValues: initialData || {
      alias: '',
      displayName: '',
      providerId: 'oidc',
      enabled: true,
      config: {
        clientId: '',
        clientSecret: '',
        authorizationUrl: '',
        tokenUrl: '',
        userInfoUrl: '',
        issuer: ''
      }
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>General Settings</Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="alias"
            control={control}
            rules={{ required: 'Alias is required' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Alias"
                fullWidth
                disabled // Alias cannot be changed
                helperText="Unique identifier for this provider"
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="displayName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Display Name"
                fullWidth
                helperText="Friendly name shown to users"
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="enabled"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch {...field} checked={field.value} />}
                label="Enabled"
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>OIDC Configuration</Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="config.clientId"
            control={control}
            rules={{ required: 'Client ID is required' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Client ID"
                fullWidth
                error={!!errors.config?.clientId}
                helperText={errors.config?.clientId?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="config.clientSecret"
            control={control}
            rules={{ required: 'Client Secret is required' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Client Secret"
                type="password"
                fullWidth
                error={!!errors.config?.clientSecret}
                helperText={errors.config?.clientSecret?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="config.issuer"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Issuer URL"
                fullWidth
                helperText="OIDC Issuer URL (optional)"
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="config.authorizationUrl"
            control={control}
            rules={{ required: 'Authorization URL is required' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Authorization URL"
                fullWidth
                error={!!errors.config?.authorizationUrl}
                helperText={errors.config?.authorizationUrl?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="config.tokenUrl"
            control={control}
            rules={{ required: 'Token URL is required' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Token URL"
                fullWidth
                error={!!errors.config?.tokenUrl}
                helperText={errors.config?.tokenUrl?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="config.userInfoUrl"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="User Info URL"
                fullWidth
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
            <Button
              type="submit"
              variant="contained"
              disabled={!isDirty || loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </form>
  );
}

export default IdentityProviderEditForm;
