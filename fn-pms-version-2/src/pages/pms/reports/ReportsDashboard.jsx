// Author: Copilot
// Created: 18th Mar 2026
// Updated: 30th Mar 2026
// Description: Project Reporting Dashboard — tabbed with work-log reports
// Version: 2.0.0

import React, { useState, useMemo } from "react";
import { Box, Grid, Tab, Tabs, Typography, MenuItem, TextField } from "@mui/material";
import { useParams } from "react-router-dom";
import { IssueDistributionChart, BurndownChart, VelocityChart, WorkLogOverview, DailyWorkReport, ProjectWorkReport, DepartmentWorkReport } from "../../../features/reports";
import { useWorkspace } from "../../../context/WorkspaceContext";

// ---------------------------------------------------------------------------
// Tab panel helper
// ---------------------------------------------------------------------------
function TabPanel({ children, value, index }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 2 }}>{children}</Box>;
}

// ---------------------------------------------------------------------------
// Main dashboard
// ---------------------------------------------------------------------------
const ReportsDashboard = () => {
  const { projectId } = useParams();
  const { workspaces, currentWorkspace } = useWorkspace();

  const [activeTab, setActiveTab] = useState(0);
  const [selectedDeptId, setSelectedDeptId] = useState("");

  // Build department options from workspaces (each workspace = a department)
  const departmentOptions = useMemo(() => {
    if (!workspaces?.length) return [];
    return workspaces.map((ws) => ({ value: ws.id, label: ws.name }));
  }, [workspaces]);

  // Default selected department once options load
  React.useEffect(() => {
    if (!selectedDeptId && currentWorkspace?.id) {
      setSelectedDeptId(currentWorkspace.id);
    } else if (!selectedDeptId && departmentOptions.length > 0) {
      setSelectedDeptId(departmentOptions[0].value);
    }
  }, [currentWorkspace, departmentOptions, selectedDeptId]);

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Reports
      </Typography>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: "divider", mb: 1 }}>
        <Tab label="Overview" />
        <Tab label="Daily" />
        <Tab label="Project" />
        <Tab label="Department" />
        <Tab label="Sprint Charts" />
      </Tabs>

      {/* ── Overview ────────────────────────────────────────────────── */}
      <TabPanel value={activeTab} index={0}>
        <WorkLogOverview />
      </TabPanel>

      {/* ── Daily ───────────────────────────────────────────────────── */}
      <TabPanel value={activeTab} index={1}>
        <DailyWorkReport />
      </TabPanel>

      {/* ── Project ─────────────────────────────────────────────────── */}
      <TabPanel value={activeTab} index={2}>
        <ProjectWorkReport projectId={projectId} />
      </TabPanel>

      {/* ── Department ──────────────────────────────────────────────── */}
      <TabPanel value={activeTab} index={3}>
        <Box mb={2} maxWidth={320}>
          <TextField select fullWidth size="small" label="Department" value={selectedDeptId} onChange={(e) => setSelectedDeptId(e.target.value)}>
            {departmentOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        {selectedDeptId && <DepartmentWorkReport departmentId={selectedDeptId} />}
      </TabPanel>

      {/* ── Sprint Charts ────────────────────────────────────────────── */}
      <TabPanel value={activeTab} index={4}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <BurndownChart projectId={projectId} />
          </Grid>
          <Grid item xs={12} md={4}>
            <IssueDistributionChart projectId={projectId} />
          </Grid>
          <Grid item xs={12}>
            <VelocityChart projectId={projectId} />
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default ReportsDashboard;
