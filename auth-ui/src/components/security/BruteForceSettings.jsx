import { Controller, useFormContext } from 'react-hook-form';
import {
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  Typography,
  InputAdornment,
  Alert
} from '@mui/material';

function BruteForceSettings() {
  const { control, watch } = useFormContext();
  const enabled = watch('bruteForceProtected');

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Controller
          name="bruteForceProtected"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Switch {...field} checked={field.value} />}
              label="Enable Brute Force Protection"
            />
          )}
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
          Protect against password guessing attacks by locking accounts after failed attempts.
        </Typography>
      </Grid>

      {enabled && (
        <>
          <Grid item xs={12} md={6}>
            <Controller
              name="failureFactor"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Max Login Failures"
                  type="number"
                  fullWidth
                  helperText="Failures before lockout"
                  InputProps={{ inputProps: { min: 1 } }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="waitIncrementSeconds"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Wait Increment"
                  type="number"
                  fullWidth
                  InputProps={{ 
                    endAdornment: <InputAdornment position="end">seconds</InputAdornment>,
                    inputProps: { min: 1 }
                  }}
                  helperText="Time added to lockout for each failure"
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="quickLoginCheckMilliSeconds"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Quick Login Check"
                  type="number"
                  fullWidth
                  InputProps={{ 
                    endAdornment: <InputAdornment position="end">ms</InputAdornment>,
                    inputProps: { min: 1 }
                  }}
                  helperText="Min time between login attempts"
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="minimumQuickLoginWaitSeconds"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Min Quick Login Wait"
                  type="number"
                  fullWidth
                  InputProps={{ 
                    endAdornment: <InputAdornment position="end">seconds</InputAdornment>,
                    inputProps: { min: 1 }
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="maxFailureWaitSeconds"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Max Wait"
                  type="number"
                  fullWidth
                  InputProps={{ 
                    endAdornment: <InputAdornment position="end">seconds</InputAdornment>,
                    inputProps: { min: 1 }
                  }}
                  helperText="Maximum lockout duration"
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="maxDeltaTimeSeconds"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Failure Reset Time"
                  type="number"
                  fullWidth
                  InputProps={{ 
                    endAdornment: <InputAdornment position="end">seconds</InputAdornment>,
                    inputProps: { min: 1 }
                  }}
                  helperText="Time after which failure count resets"
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name="permanentLockout"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch {...field} checked={field.value} />}
                  label="Permanent Lockout"
                />
              )}
            />
            <Alert severity="warning" sx={{ mt: 1 }}>
              If enabled, accounts will be locked indefinitely after max failures and must be unlocked by an admin.
            </Alert>
          </Grid>
        </>
      )}
    </Grid>
  );
}

export default BruteForceSettings;
