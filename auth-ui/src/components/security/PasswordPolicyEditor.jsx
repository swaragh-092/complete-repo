import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
  Alert,
  Box
} from '@mui/material';

function PasswordPolicyEditor() {
  const { setValue, watch } = useFormContext();
  const policyString = watch('passwordPolicy');

  const [policy, setPolicy] = useState({
    minLength: 8,
    requireUppercase: false,
    requireLowercase: false,
    requireDigit: false,
    requireSpecial: false,
    notUsername: false,
    notEmail: false,
    passwordHistory: 0,
    forceExpiredPasswordChange: 0
  });

  // Parse policy string when it changes
  useEffect(() => {
    if (!policyString) return;

    const newPolicy = {
      minLength: 8,
      requireUppercase: false,
      requireLowercase: false,
      requireDigit: false,
      requireSpecial: false,
      notUsername: false,
      notEmail: false,
      passwordHistory: 0,
      forceExpiredPasswordChange: 0
    };

    const matches = {
      length: policyString.match(/length\((\d+)\)/),
      upperCase: policyString.match(/upperCase\((\d+)\)/),
      lowerCase: policyString.match(/lowerCase\((\d+)\)/),
      digits: policyString.match(/digits\((\d+)\)/),
      specialChars: policyString.match(/specialChars\((\d+)\)/),
      notUsername: policyString.includes('notUsername'),
      notEmail: policyString.includes('notEmail'),
      passwordHistory: policyString.match(/passwordHistory\((\d+)\)/),
      forceExpiredPasswordChange: policyString.match(/forceExpiredPasswordChange\((\d+)\)/)
    };

    if (matches.length) newPolicy.minLength = parseInt(matches.length[1]);
    newPolicy.requireUppercase = matches.upperCase && parseInt(matches.upperCase[1]) > 0;
    newPolicy.requireLowercase = matches.lowerCase && parseInt(matches.lowerCase[1]) > 0;
    newPolicy.requireDigit = matches.digits && parseInt(matches.digits[1]) > 0;
    newPolicy.requireSpecial = matches.specialChars && parseInt(matches.specialChars[1]) > 0;
    newPolicy.notUsername = matches.notUsername;
    newPolicy.notEmail = matches.notEmail;
    if (matches.passwordHistory) newPolicy.passwordHistory = parseInt(matches.passwordHistory[1]);
    if (matches.forceExpiredPasswordChange) newPolicy.forceExpiredPasswordChange = parseInt(matches.forceExpiredPasswordChange[1]);

    setPolicy(newPolicy);
  }, [policyString]);

  // Update form value when local state changes
  const updatePolicyString = (newPolicy) => {
    const parts = [];
    parts.push(`length(${newPolicy.minLength})`);
    if (newPolicy.requireUppercase) parts.push('upperCase(1)');
    if (newPolicy.requireLowercase) parts.push('lowerCase(1)');
    if (newPolicy.requireDigit) parts.push('digits(1)');
    if (newPolicy.requireSpecial) parts.push('specialChars(1)');
    if (newPolicy.notUsername) parts.push('notUsername(undefined)');
    if (newPolicy.notEmail) parts.push('notEmail(undefined)');
    if (newPolicy.passwordHistory > 0) parts.push(`passwordHistory(${newPolicy.passwordHistory})`);
    if (newPolicy.forceExpiredPasswordChange > 0) parts.push(`forceExpiredPasswordChange(${newPolicy.forceExpiredPasswordChange})`);
    
    setValue('passwordPolicy', parts.join(' and '), { shouldDirty: true });
    setPolicy(newPolicy);
  };

  const handleChange = (field, value) => {
    updatePolicyString({ ...policy, [field]: value });
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="subtitle2" gutterBottom>Password Complexity</Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          label="Minimum Length"
          type="number"
          fullWidth
          value={policy.minLength}
          onChange={(e) => handleChange('minLength', parseInt(e.target.value))}
          inputProps={{ min: 1, max: 128 }}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          label="Password History"
          type="number"
          fullWidth
          value={policy.passwordHistory}
          onChange={(e) => handleChange('passwordHistory', parseInt(e.target.value))}
          helperText="Prevent reusing last N passwords"
          inputProps={{ min: 0 }}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          label="Force Expired Password Change"
          type="number"
          fullWidth
          value={policy.forceExpiredPasswordChange}
          onChange={(e) => handleChange('forceExpiredPasswordChange', parseInt(e.target.value))}
          helperText="Days before password expires"
          inputProps={{ min: 0 }}
        />
      </Grid>

      <Grid item xs={12}>
        <Box display="flex" flexDirection="column" gap={1}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={policy.requireUppercase}
                onChange={(e) => handleChange('requireUppercase', e.target.checked)}
              />
            }
            label="Require Uppercase (A-Z)"
          />
          <FormControlLabel
            control={
              <Checkbox 
                checked={policy.requireLowercase}
                onChange={(e) => handleChange('requireLowercase', e.target.checked)}
              />
            }
            label="Require Lowercase (a-z)"
          />
          <FormControlLabel
            control={
              <Checkbox 
                checked={policy.requireDigit}
                onChange={(e) => handleChange('requireDigit', e.target.checked)}
              />
            }
            label="Require Digit (0-9)"
          />
          <FormControlLabel
            control={
              <Checkbox 
                checked={policy.requireSpecial}
                onChange={(e) => handleChange('requireSpecial', e.target.checked)}
              />
            }
            label="Require Special Characters (!@#$%)"
          />
        </Box>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Restrictions</Typography>
        <Box display="flex" flexDirection="column" gap={1}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={policy.notUsername}
                onChange={(e) => handleChange('notUsername', e.target.checked)}
              />
            }
            label="Password Not Same as Username"
          />
          <FormControlLabel
            control={
              <Checkbox 
                checked={policy.notEmail}
                onChange={(e) => handleChange('notEmail', e.target.checked)}
              />
            }
            label="Password Not Same as Email"
          />
        </Box>
      </Grid>

      <Grid item xs={12}>
        <Alert severity="info" sx={{ mt: 2 }}>
          <strong>Generated Policy:</strong> {policyString}
        </Alert>
      </Grid>
    </Grid>
  );
}

export default PasswordPolicyEditor;
