import { Controller, useFormContext } from 'react-hook-form';
import {
  Grid,
  TextField,
  MenuItem,
  Typography
} from '@mui/material';

function OTPSettings() {
  const { control } = useFormContext();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="subtitle2" gutterBottom>One-Time Password (OTP) Policy</Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Configure the algorithm and settings for Time-based One-Time Passwords (TOTP).
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="otpPolicyType"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="OTP Type"
              fullWidth
            >
              <MenuItem value="totp">Time-based (TOTP)</MenuItem>
              <MenuItem value="hotp">Counter-based (HOTP)</MenuItem>
            </TextField>
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="otpPolicyAlgorithm"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Hash Algorithm"
              fullWidth
            >
              <MenuItem value="HmacSHA1">SHA-1 (Recommended)</MenuItem>
              <MenuItem value="HmacSHA256">SHA-256</MenuItem>
              <MenuItem value="HmacSHA512">SHA-512</MenuItem>
            </TextField>
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="otpPolicyDigits"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Number of Digits"
              fullWidth
            >
              <MenuItem value={6}>6 Digits</MenuItem>
              <MenuItem value={8}>8 Digits</MenuItem>
            </TextField>
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="otpPolicyPeriod"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Token Period"
              type="number"
              fullWidth
              helperText="Seconds (usually 30)"
              InputProps={{ inputProps: { min: 1 } }}
            />
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="otpPolicyLookAheadWindow"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Look Ahead Window"
              type="number"
              fullWidth
              helperText="Prevent sync issues"
              InputProps={{ inputProps: { min: 0 } }}
            />
          )}
        />
      </Grid>
    </Grid>
  );
}

export default OTPSettings;
