// Author: Copilot
// Created: 18th Mar 2026
// Description: Issue List Component with DataGrid and Filters
// Version: 1.0.0

import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Paper, TextField, MenuItem, Select, FormControl, InputLabel, Alert, Chip, ToggleButtonGroup, ToggleButton } from "@mui/material";
import { ViewList, ViewWeek } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { format } from "date-fns";
import { useIssues, useWorkflow } from "../hooks/useIssues";
import KanbanBoard from "./KanbanBoard";

const IssueList = ({ projectId: propProjectId }) => {
  const params = useParams();
  const projectId = propProjectId || params.projectId;
  const navigate = useNavigate();

  // State for filters and view mode
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState("list");

  // Queries
  const { data: issuesData, isLoading: issuesLoading, error: issuesError } = useIssues(projectId, { status_id: statusFilter });

  const { data: workflowData } = useWorkflow(projectId);

  // Derived data
  const issues = useMemo(() => {
    // Check if data is paginated response
    if (issuesData?.data?.data) return issuesData.data.data;
    if (Array.isArray(issuesData?.data)) return issuesData.data;
    if (Array.isArray(issuesData)) return issuesData;
    return [];
  }, [issuesData]);

  const statuses = useMemo(() => {
    if (workflowData?.data) {
      // If workflow data structure is { workflow: { statuses: [...] } } or similar
      // Adjust based on actual API response.
      // Assuming workflowData.data returns array of statuses or workflow object with statuses
      if (Array.isArray(workflowData.data)) return workflowData.data;
      if (workflowData.data.statuses) return workflowData.data.statuses;
    }
    return [];
  }, [workflowData]);

  // DataGrid Columns
  const columns = [
    {
      field: "title",
      headerName: "Title",
      flex: 1,
      minWidth: 200,
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      valueGetter: (value, row) => row.issueStatus?.name || value || "Unknown",
      renderCell: (params) => <Chip label={params.value} size="small" color={["done", "completed", "closed"].includes(params.value.toLowerCase()) ? "success" : ["in_progress", "doing"].includes(params.value.toLowerCase()) ? "primary" : "default"} />,
    },
    {
      field: "priority",
      headerName: "Priority",
      width: 120,
      renderCell: (params) => {
        const priority = params.value || "medium";
        const color = priority === "high" || priority === "critical" ? "error" : priority === "medium" ? "warning" : "info";
        return (
          <Typography variant="body2" color={color} sx={{ textTransform: "capitalize" }}>
            {priority}
          </Typography>
        );
      },
    },
    {
      field: "assignee",
      headerName: "Assignee",
      width: 180,
      valueGetter: (value, row) => row.assignee?.user?.username || "Unassigned",
    },
    {
      field: "created_at",
      headerName: "Created",
      width: 150,
      valueFormatter: (value) => (value ? format(new Date(value), "dd MMM yyyy") : ""),
    },
  ];

  if (!projectId) {
    return <Alert severity="warning">No Project ID found in URL. Please select a project.</Alert>;
  }

  return (
    <Paper sx={{ p: 2, height: 600, width: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
        <Typography variant="h5" component="h1">
          Issue List
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Status Filter */}
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel id="status-filter-label">Filter by Status</InputLabel>
            <Select 
              labelId="status-filter-label" 
              value={statusFilter} 
              label="Filter by Status" 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">
                <em>All Statuses</em>
              </MenuItem>
              {statuses.map((status) => (
                <MenuItem key={status.id} value={status.id}>
                  {status.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* View Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newView) => {
              if (newView !== null) {
                setViewMode(newView);
              }
            }}
            aria-label="view mode"
            size="small"
          >
            <ToggleButton value="list" aria-label="list view">
              <ViewList />
            </ToggleButton>
            <ToggleButton value="board" aria-label="board view">
              <ViewWeek />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {issuesError ? (
        <Alert severity="error">Error loading issues: {issuesError.message}</Alert>
      ) : (
        viewMode === "list" ? (
          <DataGrid
            rows={issues}
            columns={columns}
            loading={issuesLoading}
            getRowId={(row) => row.id}
            onRowClick={(params) => navigate(`/projects/${projectId}/issues/${params.id}`)}
            sx={{ cursor: "pointer" }}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 },
              },
            }}
            pageSizeOptions={[5, 10, 25]}
          />
        ) : (
          <Box sx={{ height: '100%', overflow: 'hidden' }}>
            <KanbanBoard projectId={projectId} />
          </Box>
        )
      )}
    </Paper>
  );
};

export default IssueList;
