import React from 'react';
import { 
  Alert, Grid, Typography, TextField, Divider, FormControlLabel, Switch, 
  List, ListItem, ListItemText 
} from '@mui/material';
import { Warning } from '@mui/icons-material';

function SMTPTab({ smtpConfig, setSmtpConfig }) {
  return (
    <>
      <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
        <strong>SMTP Configuration:</strong> Incorrect settings may prevent email delivery. Test thoroughly after changes.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>SMTP Server Settings</Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label="SMTP Host"
            fullWidth
            value={smtpConfig.host}
            onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
            helperText="e.g., smtp.gmail.com"
            placeholder="smtp.example.com"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label="SMTP Port"
            type="number"
            fullWidth
            value={smtpConfig.port}
            onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
            helperText="587 (TLS) or 465 (SSL)"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label="From Address"
            type="email"
            fullWidth
            value={smtpConfig.from}
            onChange={(e) => setSmtpConfig({ ...smtpConfig, from: e.target.value })}
            helperText="Sender email address"
            placeholder="noreply@example.com"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label="From Display Name"
            fullWidth
            value={smtpConfig.fromDisplayName}
            onChange={(e) => setSmtpConfig({ ...smtpConfig, fromDisplayName: e.target.value })}
            helperText="Sender display name"
            placeholder="My Application"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label="Reply To"
            type="email"
            fullWidth
            value={smtpConfig.replyTo}
            onChange={(e) => setSmtpConfig({ ...smtpConfig, replyTo: e.target.value })}
            helperText="Optional reply-to address"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label="Reply To Display Name"
            fullWidth
            value={smtpConfig.replyToDisplayName}
            onChange={(e) => setSmtpConfig({ ...smtpConfig, replyToDisplayName: e.target.value })}
            helperText="Optional reply-to name"
          />
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Authentication</Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label="Username"
            fullWidth
            value={smtpConfig.user}
            onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
            helperText="SMTP authentication username"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={smtpConfig.password}
            onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
            helperText="Leave blank to keep existing"
            placeholder="••••••••"
          />
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Security Options</Typography>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControlLabel
            control={
              <Switch 
                checked={smtpConfig.auth}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, auth: e.target.checked })}
              />
            }
            label="Enable Authentication"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControlLabel
            control={
              <Switch 
                checked={smtpConfig.starttls}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, starttls: e.target.checked })}
              />
            }
            label="Enable STARTTLS"
          />
          <Typography variant="caption" color="text.secondary" display="block">
            Recommended for port 587
          </Typography>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControlLabel
            control={
              <Switch 
                checked={smtpConfig.ssl}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, ssl: e.target.checked })}
              />
            }
            label="Enable SSL"
          />
          <Typography variant="caption" color="text.secondary" display="block">
            For port 465
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Alert severity="info">
            <strong>Quick Setup Examples:</strong>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Gmail" 
                  secondary="Host: smtp.gmail.com | Port: 587 | STARTTLS: On | Auth: Required"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Outlook/Office365" 
                  secondary="Host: smtp.office365.com | Port: 587 | STARTTLS: On | Auth: Required"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="SendGrid" 
                  secondary="Host: smtp.sendgrid.net | Port: 587 | STARTTLS: On | Username: apikey"
                />
              </ListItem>
            </List>
          </Alert>
        </Grid>
      </Grid>
    </>
  );
}

export default SMTPTab;
