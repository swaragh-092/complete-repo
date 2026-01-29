import React from 'react';
import { Controller } from 'react-hook-form';
import { 
  Accordion, AccordionSummary, AccordionDetails, Typography, Alert, 
  Grid, TextField, FormControlLabel, Checkbox, Switch, InputAdornment, 
  Box, Card, CardContent 
} from '@mui/material';
import { 
  ExpandMore, Lock, Warning, Verified, 
  AdminPanelSettings as Security 
} from '@mui/icons-material';
import { buildPasswordPolicy } from '../../../utils/policyUtils';

function SecurityTab({ control, realm, passwordPolicy, updatePasswordPolicy, bruteForceEnabled }) {
  return (
    <>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography><Lock sx={{ mr: 1, verticalAlign: 'middle' }} /> Password Policy</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
            <strong>Superadmin Control:</strong> Changes to password policy will affect all users and force password resets on next login.
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Minimum Length"
                type="number"
                fullWidth
                value={passwordPolicy.minLength}
                onChange={(e) => updatePasswordPolicy({ minLength: parseInt(e.target.value) })}
                inputProps={{ min: 4, max: 32 }}
                helperText="Minimum password length (4-32 characters)"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Password History"
                type="number"
                fullWidth
                value={passwordPolicy.passwordHistory}
                onChange={(e) => updatePasswordPolicy({ passwordHistory: parseInt(e.target.value) })}
                inputProps={{ min: 0, max: 12 }}
                helperText="Prevent reusing last N passwords"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Character Requirements</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={passwordPolicy.requireUppercase}
                    onChange={(e) => updatePasswordPolicy({ requireUppercase: e.target.checked })}
                  />
                }
                label="Require Uppercase (A-Z)"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={passwordPolicy.requireLowercase}
                    onChange={(e) => updatePasswordPolicy({ requireLowercase: e.target.checked })}
                  />
                }
                label="Require Lowercase (a-z)"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={passwordPolicy.requireDigit}
                    onChange={(e) => updatePasswordPolicy({ requireDigit: e.target.checked })}
                  />
                }
                label="Require Digits (0-9)"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={passwordPolicy.requireSpecial}
                    onChange={(e) => updatePasswordPolicy({ requireSpecial: e.target.checked })}
                  />
                }
                label="Require Special Characters"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Restrictions</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={passwordPolicy.notUsername}
                    onChange={(e) => updatePasswordPolicy({ notUsername: e.target.checked })}
                  />
                }
                label="Password Not Same as Username"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={passwordPolicy.notEmail}
                    onChange={(e) => updatePasswordPolicy({ notEmail: e.target.checked })}
                  />
                }
                label="Password Not Same as Email"
              />
            </Grid>

            <Grid item xs={12}>
              <Alert severity="info">
                Current Policy: {buildPasswordPolicy(passwordPolicy)}
              </Alert>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography><Security sx={{ mr: 1, verticalAlign: 'middle' }} /> Brute Force Detection</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="bruteForceProtected"
                control={control}
                defaultValue={realm?.bruteForceProtected ?? false}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} />}
                    label="Enable Brute Force Protection"
                  />
                )}
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 1 }}>
                Protect against password guessing attacks
              </Typography>
            </Grid>

            {bruteForceEnabled && (
              <>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="failureFactor"
                    control={control}
                    defaultValue={realm?.failureFactor || 30}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Max Login Failures"
                        type="number"
                        fullWidth
                        helperText="Failures before lockout"
                        inputProps={{ min: 1 }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="maxFailureWaitSeconds"
                    control={control}
                    defaultValue={realm?.maxFailureWaitSeconds || 900}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Wait After Failure"
                        type="number"
                        fullWidth
                        InputProps={{ endAdornment: <InputAdornment position="end">seconds</InputAdornment> }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="minimumQuickLoginWaitSeconds"
                    control={control}
                    defaultValue={realm?.minimumQuickLoginWaitSeconds || 60}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Quick Login Check"
                        type="number"
                        fullWidth
                        InputProps={{ endAdornment: <InputAdornment position="end">seconds</InputAdornment> }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="waitIncrementSeconds"
                    control={control}
                    defaultValue={realm?.waitIncrementSeconds || 60}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Wait Increment"
                        type="number"
                        fullWidth
                        InputProps={{ endAdornment: <InputAdornment position="end">seconds</InputAdornment> }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="permanentLockout"
                    control={control}
                    defaultValue={realm?.permanentLockout ?? false}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography>Permanent Lockout</Typography>
                            <Warning color="error" fontSize="small" />
                          </Box>
                        }
                      />
                    )}
                  />
                  <Typography variant="caption" color="error" sx={{ ml: 4, display: 'block' }}>
                    ⚠️ Locked accounts cannot be unlocked automatically
                  </Typography>
                </Grid>
              </>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography><Verified sx={{ mr: 1, verticalAlign: 'middle' }} /> OTP Policy (Read-Only)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Alert severity="info" sx={{ mb: 2 }}>
            OTP policy can be modified through advanced Keycloak admin console
          </Alert>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>Type</Typography>
                  <Typography variant="h6">{realm?.otpPolicyType || 'TOTP'}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>Algorithm</Typography>
                  <Typography variant="h6">{realm?.otpPolicyAlgorithm || 'HmacSHA1'}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>Digits</Typography>
                  <Typography variant="h6">{realm?.otpPolicyDigits || 6}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </>
  );
}

export default SecurityTab;
