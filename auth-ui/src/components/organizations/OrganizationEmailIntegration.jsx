import React, { useState } from 'react';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import { Settings as SettingsIcon, Email as EmailIcon } from '@mui/icons-material';
import EmailSettings from '../../pages/email/EmailSettings';
import EmailTemplates from '../../pages/email/EmailTemplates';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      style={{ display: value !== index ? 'none' : undefined }}
      {...other}
    >
      <Box sx={{ py: 3 }}>{children}</Box>
    </div>
  );
}

export default function OrganizationEmailIntegration({ orgId }) {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Box>
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tabIndex}
          onChange={(e, newValue) => setTabIndex(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<SettingsIcon />} iconPosition="start" label="SMTP Provider Config" />
          <Tab icon={<EmailIcon />} iconPosition="start" label="Email Templates" />
        </Tabs>
      </Paper>

      <TabPanel value={tabIndex} index={0}>
        <EmailSettings orgId={orgId} />
      </TabPanel>
      <TabPanel value={tabIndex} index={1}>
        <EmailTemplates orgId={orgId} />
      </TabPanel>
    </Box>
  );
}
