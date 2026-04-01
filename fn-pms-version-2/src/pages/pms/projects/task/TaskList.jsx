// Author: Gururaj
// Created: 14th Oct 2025
// Description: Task list component showing all project tasks with status chips and action buttons.
// Version: 1.0.0
// Modified:

import BACKEND_ENDPOINT from "../../../../util/urls";
import { useState } from "react";
import DataTable from "../../../../components/tools/Datatable";
import { Box, CircularProgress, Chip, useTheme } from "@mui/material";
import Heading from "../../../../components/Heading";
import EditDialog from "../../../../components/pms/EditDialog";
import { colorCodes } from "../../../../theme";
import { showConfirmDialog } from "../../../../util/feedback/ConfirmService";
import EditIcon from "@mui/icons-material/ModeEditOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import { showToast } from "../../../../util/feedback/ToastService";
import backendRequest from "../../../../util/request";

const updateFormFields = [
  { type: "text", name: "title", label: "Title" },
  { type: "textarea", name: "description", label: "Description" },
  {
    type: "select",
    name: "priority",
    options: [
      { label: "Critical", value: "critical" },
      { label: "High", value: "high" },
      { label: "Medium", value: "medium" },
      { label: "Low", value: "low" },
    ],
  },
  {
    type: "select",
    name: "status",
    options: [
      { label: "Defined", value: "defined" },
      { label: "In Progress", value: "in_progress" },
      { label: "Review", value: "review" },
      { label: "Completed", value: "completed" },
      { label: "Blocked", value: "blocked" },
    ],
  },
];

const statusColors = {
  defined: "default",
  in_progress: "info",
  review: "warning",
  completed: "success",
  blocked: "error",
};

const statusLabels = {
  defined: "Defined",
  in_progress: "In Progress",
  review: "Review",
  completed: "Completed",
  blocked: "Blocked",
};

export default function TaskList({ project_id, canApprove, refresh, setRefresher = () => {} }) {
  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);

  const [editDialog, setEditDialog] = useState({ open: false, item: null });
  const [editingIds, setEditingIds] = useState([]);

  const handleDelete = async (id) => {
    setEditingIds((prev) => [...prev, id]);
    const endpoint = BACKEND_ENDPOINT.delete_user_story(id);
    const response = await backendRequest({ endpoint });
    showToast({ message: response.message ?? (response.success ? "Deleted successfully" : "Failed to delete"), type: response.success ? "success" : "error" });
    if (response.success) setRefresher(true);
    setEditingIds((prev) => prev.filter((i) => i !== id));
  };

  const handleApprove = async (id) => {
    setEditingIds((prev) => [...prev, id]);
    const response = await backendRequest({ endpoint: BACKEND_ENDPOINT.approve_user_story(id), body: { status: "approved" } });
    showToast({ message: response.message ?? (response.success ? "Approved" : "Failed to approve"), type: response.success ? "success" : "error" });
    if (response.success) setRefresher(true);
    setEditingIds((prev) => prev.filter((i) => i !== id));
  };

  const displayColumns = [
    { field: "title", headerName: "Title", flex: 1 },
    { field: "description", headerName: "Description", flex: 1 },
    { field: "priority", headerName: "Priority", flex: 0.7 },
    {
      field: "status",
      headerName: "Status",
      flex: 0.8,
      renderCell: (params) => <Chip label={statusLabels[params.value] || params.value} color={statusColors[params.value] || "default"} size="small" />,
    },
    {
      field: "type",
      headerName: "Type",
      flex: 0.5,
      renderCell: (params) => <Chip label={params.value === "task" ? "Task" : "Story"} size="small" variant="outlined" />,
    },
    { field: "story_points", headerName: "Points", flex: 0.4 },
    { field: "due_date", headerName: "Due Date", flex: 0.8 },
    {
      field: "feature",
      headerName: "Feature",
      flex: 1,
      renderCell: (params) => params.row.feature?.name || "-",
    },
    {
      field: "approval_status",
      headerName: "Approval",
      flex: 0.7,
      renderCell: (params) => params.value || "-",
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 100,
      flex: 0.5,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const isEditing = editingIds.includes(params.row.id);
        return (
          <Box display="flex" gap="8px" alignItems="center">
            {isEditing ? (
              <CircularProgress size={20} />
            ) : (
              <>
                <Box title="Edit">
                  <EditIcon onClick={() => setEditDialog({ open: true, item: params.row })} sx={{ cursor: "pointer", color: colors.text.dark, "&:hover": { color: colors.secondary.dark } }} />
                </Box>

                {canApprove && params.row.approval_status === "pending" && (
                  <Box title="Approve">
                    <CheckIcon
                      onClick={() => {
                        showConfirmDialog({
                          message: `Approve "${params.row.title}"?`,
                          title: "Approve User Story",
                          onConfirm: () => handleApprove(params.row.id),
                        });
                      }}
                      sx={{ cursor: "pointer", color: colors.primary?.main || colors.primary?.dark, "&:hover": { color: colors.primary?.dark } }}
                    />
                  </Box>
                )}

                <Box title="Delete">
                  <DeleteIcon
                    onClick={() => {
                      showConfirmDialog({
                        message: `Are you sure you want to delete "${params.row.title}"?`,
                        title: "Delete User Story",
                        onConfirm: () => handleDelete(params.row.id),
                      });
                    }}
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
    <Box m="20px">
      <Heading title="User Stories & Tasks" level={2} />

      <DataTable columns={displayColumns} fetchEndpoint={BACKEND_ENDPOINT.user_stories_by_project(project_id)} refresh={refresh} setRefresh={setRefresher} />

      <EditDialog
        formFields={updateFormFields}
        isOpen={editDialog.open}
        updateBackendEndpoint={BACKEND_ENDPOINT.update_user_story(editDialog.item?.id)}
        onClose={() => setEditDialog({ open: false, item: null })}
        onSuccess={() => {
          setEditDialog({ open: false, item: null });
          setRefresher(true);
        }}
        initialData={{
          title: editDialog.item?.title,
          description: editDialog.item?.description,
          priority: editDialog.item?.priority,
          status: editDialog.item?.status,
        }}
        usedFor="User Story"
      />
    </Box>
  );
}
