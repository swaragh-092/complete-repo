import { Controller, useFormContext } from 'react-hook-form';
import {
  Grid,
  TextField,
  MenuItem,
  Typography,
  FormControlLabel,
  Checkbox
} from '@mui/material';

function WebAuthnSettings() {
  const { control } = useFormContext();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="subtitle2" gutterBottom>WebAuthn / Passwordless Policy</Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Configure settings for hardware security keys and biometric authentication.
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="webAuthnPolicyRpEntityName"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="RP Entity Name"
              fullWidth
              helperText="Human-readable name for the Relying Party"
            />
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="webAuthnPolicySignatureAlgorithms"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Signature Algorithms"
              fullWidth
              helperText="Comma-separated list (e.g., ES256, RS256)"
            />
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="webAuthnPolicyAttestationConveyancePreference"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Attestation Preference"
              fullWidth
            >
              <MenuItem value="none">None</MenuItem>
              <MenuItem value="indirect">Indirect</MenuItem>
              <MenuItem value="direct">Direct</MenuItem>
            </TextField>
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="webAuthnPolicyAuthenticatorAttachment"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Authenticator Attachment"
              fullWidth
            >
              <MenuItem value="platform">Platform (TouchID, Windows Hello)</MenuItem>
              <MenuItem value="cross-platform">Cross-Platform (YubiKey)</MenuItem>
              <MenuItem value="">Both</MenuItem>
            </TextField>
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="webAuthnPolicyRequireResidentKey"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Require Resident Key"
              fullWidth
            >
              <MenuItem value="Yes">Yes</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </TextField>
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="webAuthnPolicyUserVerificationRequirement"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="User Verification"
              fullWidth
            >
              <MenuItem value="required">Required</MenuItem>
              <MenuItem value="preferred">Preferred</MenuItem>
              <MenuItem value="discouraged">Discouraged</MenuItem>
            </TextField>
          )}
        />
      </Grid>

      <Grid item xs={12}>
        <Controller
          name="webAuthnPolicyAvoidSameAuthenticatorRegister"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Checkbox {...field} checked={field.value} />}
              label="Avoid Registering Same Authenticator Twice"
            />
          )}
        />
      </Grid>
    </Grid>
  );
}

export default WebAuthnSettings;
