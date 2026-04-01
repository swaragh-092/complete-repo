// Author: Gururaj
// Created: 14th Oct 2025
// Description: Project members list showing member roles with edit-role functionality.
// Version: 1.0.0
// Modified:

import { useEffect, useState } from "react";
import { Box, Chip, CircularProgress, ToggleButton, ToggleButtonGroup, useTheme } from "@mui/material";
import Heading from "../../../../components/Heading";
import DoButton from "../../../../components/button/DoButton";
import DataTable from "../../../../components/tools/Datatable";
import AddMembersDialog from "./AddMembersDialog";
import BACKEND_ENDPOINT from "../../../../util/urls";
import backendRequest from "../../../../util/request";
import { showToast } from "../../../../util/feedback/ToastService";
import { showConfirmDialog } from "../../../../util/feedback/ConfirmService";
import { colorCodes } from "../../../../theme";
import EditIcon from "@mui/icons-material/ModeEditOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import EditMemberRoleDialog from "./EditMemberRoleDialog";
import { useWorkspace } from "../../../../context/WorkspaceContext";

const groupByUserId = (rows) =>
  Object.values(
    rows.reduce((acc, m) => {
      const key = m.user_id;
      if (!acc[key]) {
        acc[key] = { id: key, user_details: m.user_details, departments: [] };
      }
      acc[key].departments.push(m.department_details?.name || m.department_id || "Unknown");
      return acc;
    }, {}),
  );

export default function ProjectMembersList({ projectId, setTaskRefresher = () => {} }) {
  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);
  const { currentWorkspace } = useWorkspace();

  const [refresh, setRefresher] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingIds, setEditingIds] = useState([]);
  const [editDialog, setEditDialog] = useState({ open: false, member: null });

  // toggle: "all" = all members grouped uniquely (read-only); "current" = currentWorkspace dept (with actions)
  const [viewMode, setViewMode] = useState("all");

  // Refresh the "current" view whenever the top-right workspace selector changes
  useEffect(() => {
    if (viewMode === "current" && currentWorkspace?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRefresher(true);
    }
  }, [currentWorkspace?.id]);

  const handleViewModeChange = (_, newMode) => {
    if (!newMode) return; // prevent deselecting both
    setViewMode(newMode);
    setRefresher(true);
  };

  const handleDeleteMember = async (memberId) => {
    setEditingIds((prev) => [...prev, memberId]);
    const response = await deleteMemberRequest(memberId);
    if (response.success) {
      setRefresher(true);
      setTaskRefresher(true);
    }
    setEditingIds((prev) => prev.filter((id) => id !== memberId));
  };

  // Columns for the "All Departments" DataGrid (grouped, read-only)
  const allDeptColumns = [
    {
      field: "user_details",
      headerName: "User",
      flex: 1,
      renderCell: (params) => {
        const name = params.row.user_details?.name;
        const email = params.row.user_details?.email;
        return (
          <Box>
            <Box fontWeight={600}>{name || params.row.id}</Box>
            {email && (
              <Box fontSize="0.82em" color="text.secondary">
                {email}
              </Box>
            )}
          </Box>
        );
      },
    },
    {
      field: "departments",
      headerName: "Departments",
      flex: 2,
      sortable: false,
      renderCell: (params) => (
        <Box display="flex" gap={0.5} flexWrap="wrap" py={0.5}>
          {params.row.departments.map((d, i) => (
            <Chip key={i} label={d} size="small" variant="outlined" />
          ))}
        </Box>
      ),
    },
  ];

  // Columns for the "Current Department" DataTable (per-row actions)
  const deptColumns = [
    {
      field: "user_id",
      headerName: "User",
      flex: 1,
      renderCell: (params) => {
        const name = params.row.user_details?.name;
        const email = params.row.user_details?.email;
        if (name) {
          return (
            <Box>
              <Box fontWeight={600}>{name}</Box>
              {email && (
                <Box fontSize="0.85em" color="text.secondary">
                  {email}
                </Box>
              )}
            </Box>
          );
        }
        return params.row.user_id || "N/A";
      },
    },
    {
      field: "department_id",
      headerName: "Department",
      flex: 1,
      renderCell: (params) => params.row.department_details?.name || params.row.department_id || "N/A",
    },
    { field: "project_role", headerName: "Project Role", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 100,
      flex: 0.2,
      sortable: false,
      renderCell: (params) => {
        const isEditing = editingIds.includes(params.row.id);
        return (
          <Box display="flex" gap="10px" alignItems="center">
            {isEditing ? (
              <CircularProgress size={20} />
            ) : (
              <>
                <Box title="Edit Role">
                  <EditIcon onClick={() => setEditDialog({ open: true, member: params.row })} sx={{ cursor: "pointer", color: colors.text.dark, "&:hover": { color: colors.secondary.dark } }} />
                </Box>
                <Box title="Remove">
                  <DeleteIcon
                    onClick={() =>
                      showConfirmDialog({
                        message: "Sure of removing member?",
                        title: "Delete Project Member",
                        onConfirm: () => handleDeleteMember(params.row.id),
                      })
                    }
                    sx={{ cursor: "pointer", color: colors.error.light, "&:hover": { color: colors.error.modrate } }}
                  />
                </Box>
              </>
            )}
          </Box>
        );
      },
    },
  ];

  return (
    <>
      {projectId && (
        <>
          <Box m="20px" maxWidth={"49%"} width={"100%"}>
            {/* Header row */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
              <Heading title={"Project Members"} level={2} />
              <DoButton onclick={() => setOpen(true)}>Add Member</DoButton>
            </Box>

            {/* Toggle */}
            <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewModeChange} size="small" sx={{ mb: 1.5 }}>
              <ToggleButton value="all">All Departments</ToggleButton>
              <ToggleButton value="current" disabled={!currentWorkspace?.id}>
                {currentWorkspace?.name || "Current Department"}
              </ToggleButton>
            </ToggleButtonGroup>

            {viewMode === "all" ? (
              <DataTable columns={allDeptColumns} fetchEndpoint={BACKEND_ENDPOINT["project_members"](projectId)} refresh={refresh} setRefresh={setRefresher} dataPath={["members"]} defaultPageSize={5} transformRows={groupByUserId} />
            ) : currentWorkspace?.id ? (
              <DataTable columns={deptColumns} fetchEndpoint={BACKEND_ENDPOINT["project_members_by_dept"](projectId, currentWorkspace.id)} refresh={refresh} setRefresh={setRefresher} dataPath={["members"]} defaultPageSize={5} />
            ) : (
              <Box p={2} color="text.secondary">
                No department selected (use the top-right selector).
              </Box>
            )}
          </Box>

          <AddMembersDialog isOpen={open} setOpen={setOpen} setRefresher={setRefresher} projectId={projectId} />
          <EditMemberRoleDialog editDialog={editDialog} setEditDialog={setEditDialog} setRefresher={setRefresher} />
        </>
      )}
    </>
  );
}

const deleteMemberRequest = async (memberId) => {
  const endpoint = BACKEND_ENDPOINT["delete_project_member"](memberId);
  const response = await backendRequest({ endpoint });
  showToast({ message: response.message ?? (response.success ? "Deleted Successfully" : "Failed to delete"), type: response.success ? "success" : "error" });
  return response;
};
