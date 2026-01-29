import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  TextField,
  Typography,
  Grid,
  FormControlLabel,
  Switch,
  MenuItem
} from '@mui/material';

const steps = ['Basic Info', 'Configuration', 'Review'];

function IdentityProviderCreateWizard({ open, onClose, onSubmit, loading }) {
  const [activeStep, setActiveStep] = useState(0);
  const { control, watch, trigger } = useForm({
    defaultValues: {
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

  const formData = watch();

  const handleNext = async () => {
    const isValid = await trigger();
    if (isValid) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleFinish = () => {
    onSubmit(formData);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="alias"
                control={control}
                rules={{ 
                  required: 'Alias is required',
                  pattern: {
                    value: /^[a-z0-9-]+$/,
                    message: 'Lowercase alphanumeric and hyphens only'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Alias"
                    fullWidth
                    helperText="Unique identifier (e.g., google, github)"
                    error={!!control._formState.errors.alias}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
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
                name="providerId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Provider Type"
                    fullWidth
                  >
                    <MenuItem value="oidc">OpenID Connect v1.0</MenuItem>
                    <MenuItem value="saml">SAML v2.0</MenuItem>
                    <MenuItem value="keycloak-oidc">Keycloak OIDC</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="config.clientId"
                control={control}
                rules={{ required: 'Client ID is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Client ID"
                    fullWidth
                    required
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
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
                    required
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="config.authorizationUrl"
                control={control}
                rules={{ required: 'Authorization URL is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Authorization URL"
                    fullWidth
                    required
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="config.tokenUrl"
                control={control}
                rules={{ required: 'Token URL is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Token URL"
                    fullWidth
                    required
                  />
                )}
              />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom>Review Configuration</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography color="text.secondary">Alias:</Typography>
                <Typography>{formData.alias}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography color="text.secondary">Type:</Typography>
                <Typography>{formData.providerId}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography color="text.secondary">Client ID:</Typography>
                <Typography>{formData.config.clientId}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="enabled"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Enable this provider immediately"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Identity Provider</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {renderStepContent(activeStep)}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        <Button
          disabled={activeStep === 0 || loading}
          onClick={handleBack}
          sx={{ mr: 1 }}
        >
          Back
        </Button>
        {activeStep === steps.length - 1 ? (
          <Button onClick={handleFinish} variant="contained" disabled={loading}>
            {loading ? 'Creating...' : 'Create Provider'}
          </Button>
        ) : (
          <Button onClick={handleNext} variant="contained">
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default IdentityProviderCreateWizard;
