// Author: Gururaj
// Created: 12th March 2026
// Description: Shows all assign-pending checklist tasks for the current user's
//              departments. Members can take tasks; leads can assign to others.
// Version: 1.0.0

import { useState } from "react";
import { Box, Chip, CircularProgress, useTheme } from "@mui/material";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import Heading from "../../../../components/Heading";
import DataTable from "../../../../components/tools/Datatable";
import BACKEND_ENDPOINT from "../../../../util/urls";
import { colorCodes } from "../../../../theme";
import AssignChecklistTaskDialog from "./AssignChecklistTaskDialog";

const statusColor = {
  lead: "success",
  member: "primary",
  viewer: "default",
};

export default function AvailableChecklistTasks({ onAssigned }) {
  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);

  const [refresh, setRefresh] = useState(true);
  const [assignDialog, setAssignDialog] = useState({ open: false, task: null });

  const handleOpenAssign = (task) => {
    setAssignDialog({ open: true, task });
  };

  const handleAssignSuccess = () => {
    setAssignDialog({ open: false, task: null });
    setRefresh(true);
    if (onAssigned) onAssigned();
  };

  const columns = [
    {
      field: "title",
      headerName: "Task",
      flex: 1.2,
    },
    {
      field: "project_id",
      headerName: "Project",
      flex: 1,
      renderCell: (params) => params.row.project?.name || params.row.project_id,
    },
    {
      field: "department_id",
      headerName: "Department",
      flex: 1,
      renderCell: (params) => params.row.department_details?.name || params.row.department_id,
    },
    {
      field: "checklist_id",
      headerName: "Checklist Item",
      flex: 1,
      renderCell: (params) => params.row.checklist?.title || "—",
    },
    {
      field: "priority",
      headerName: "Priority",
      flex: 0.7,
      renderCell: (params) => {
        const colorMap = {
          critical: "error",
          high: "warning",
          medium: "info",
          low: "default",
        };
        return <Chip label={params.row.priority} size="small" color={colorMap[params.row.priority] || "default"} />;
      },
    },
    {
      field: "my_role",
      headerName: "Your Role",
      flex: 0.7,
      renderCell: (params) => (params.row.my_role ? <Chip label={params.row.my_role} size="small" color={statusColor[params.row.my_role] || "default"} variant="outlined" /> : "—"),
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 120,
      flex: 0.5,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap="6px">
          <Box title={params.row.my_role === "lead" ? "Assign to department member" : "Take this task"}>
            <AssignmentIndIcon
              onClick={() => handleOpenAssign(params.row)}
              sx={{
                cursor: "pointer",
                color: params.row.my_role === "lead" ? colors.primary?.main || colors.primary?.dark : colors.text?.dark,
                "&:hover": { color: colors.secondary?.dark || colors.primary?.dark },
              }}
            />
          </Box>
        </Box>
      ),
    },
  ];

  return (
    <Box m="20px">
      <Heading title="Available Checklist Tasks" subtitle="Assign-pending tasks from your department checklists" level={2} />

      <DataTable columns={columns} fetchEndpoint={BACKEND_ENDPOINT.available_checklist_tasks} refresh={refresh} setRefresh={setRefresh} defaultPageSize={10} />

      <AssignChecklistTaskDialog open={assignDialog.open} task={assignDialog.task} onClose={() => setAssignDialog({ open: false, task: null })} onSuccess={handleAssignSuccess} />
    </Box>
  );
}
