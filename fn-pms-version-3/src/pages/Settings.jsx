// Author: Gururaj
// Created: 19th Jun 2025
// Description: Settings page with tabs for organisation settings, role management, and member management.
// Version: 1.0.0
// Modified:

/**
 * Settings Page
 *
 * Organization settings, role management, and member management
 */

import { useState, useEffect } from "react";
import { auth } from "@spidy092/auth-client";
import { Box, Tabs, Tab, Paper, Typography, TextField, Button, Card, CardContent, Alert } from "@mui/material";
import { Security as SecurityIcon, Group as GroupIcon, Settings as SettingsIcon, Business as BusinessIcon } from "@mui/icons-material";
import RoleManager from "../components/organization/RoleManager";
import OrganizationManager from "../components/organization/OrganizationManager";
import { useOrganization } from "../context/OrganizationContext";

function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`settings-tabpanel-${index}`} aria-labelledby={`settings-tab-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState(0);
  const [user, setUser] = useState(null);
  const { currentOrganization, organizations } = useOrganization();
  const [orgName, setOrgName] = useState(currentOrganization?.name || "");
  const [orgDescription, setOrgDescription] = useState(currentOrganization?.description || "");
  const [saveSuccess, setSaveSuccess] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await auth.api.get("/account/profile");
        setUser(response.data?.data || response.data);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    }
    fetchUser();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSaveSuccess(null);
  };

  const handleSaveOrganization = async () => {
    try {
      const orgId = currentOrganization?.id || currentOrganization?.org_id;
      if (!orgId) throw new Error("No organization selected");

      // Call auth-service to update the organization name and description
      await auth.api.put(`/account/organizations/${orgId}`, {
        name: orgName,
        description: orgDescription,
      });

      setSaveSuccess("Organization settings saved successfully");
    } catch (error) {
      console.error("Failed to save organization:", error);
      setSaveSuccess(null);
    }
  };

  return (
    <Box p={2}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        <SettingsIcon sx={{ mr: 1, verticalAlign: "middle" }} />
        Settings
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab icon={<SecurityIcon />} iconPosition="start" label="Roles & Permissions" />
          <Tab icon={<GroupIcon />} iconPosition="start" label="Members" />
          <Tab icon={<BusinessIcon />} iconPosition="start" label="Organization" />
        </Tabs>
      </Paper>

      <TabPanel value={activeTab} index={0}>
        <RoleManager />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <OrganizationManager currentOrg={currentOrganization} organizations={organizations} user={user} organizationModel={import.meta.env.VITE_ORGANIZATION_MODEL || "multi"} />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Organization Settings
            </Typography>

            {saveSuccess && (
              <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaveSuccess(null)}>
                {saveSuccess}
              </Alert>
            )}

            {currentOrganization ? (
              <Box>
                <TextField fullWidth label="Organization Name" value={orgName} onChange={(e) => setOrgName(e.target.value)} sx={{ mb: 2 }} />
                <TextField fullWidth label="Description" multiline rows={3} value={orgDescription} onChange={(e) => setOrgDescription(e.target.value)} placeholder="Organization description" sx={{ mb: 2 }} />
                <TextField fullWidth label="Organization ID" value={currentOrganization.id || currentOrganization.org_id || ""} disabled sx={{ mb: 2 }} />
                <TextField fullWidth label="Tenant ID" value={currentOrganization.tenant_id || ""} disabled sx={{ mb: 3 }} />
                <Button variant="contained" onClick={handleSaveOrganization}>
                  Save Changes
                </Button>
              </Box>
            ) : (
              <Alert severity="info">No organization selected. Please select an organization from the sidebar.</Alert>
            )}
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
}
