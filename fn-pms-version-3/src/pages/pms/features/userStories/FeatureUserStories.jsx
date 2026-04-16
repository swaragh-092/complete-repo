// Author: Gururaj
// Created: 19th Jun 2025
// Description: Feature-scoped user stories view for listing and creating stories belonging to a feature.
// Version: 1.0.0
// Modified:

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Box, Chip, LinearProgress, Tooltip, Typography } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Heading from "../../../../components/Heading";
import DoButton from "../../../../components/button/DoButton";
import DataTable from "../../../../components/tools/Datatable";
import ActionColumn from "../../../../components/tools/ActionColumn";
import CreateDialog from "../../../../components/pms/CreateDialog";
import EditDialog from "../../../../components/pms/EditDialog";
import BACKEND_ENDPOINT, { paths } from "../../../../util/urls";
import backendRequest from "../../../../util/request";
import { showToast } from "../../../../util/feedback/ToastService";
import { formatTextForDataTable } from "../../../../util/helper";

const priorityColors = {
  critical: "error",
  high: "warning",
  medium: "info",
  low: "success",
};

const statusColors = {
  defined: "default",
  in_progress: "primary",
  review: "warning",
  completed: "success",
  blocked: "error",
};

export default function FeatureUserStories({ featureId, departmentId, projectId }) {
  const [refresh, setRefresher] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [completionSummary, setCompletionSummary] = useState({ totalPoints: 0, completedPoints: 0 });

  useEffect(() => {
    if (!featureId) return;
    let ignore = false;
    (async () => {
      const res = await backendRequest({ endpoint: BACKEND_ENDPOINT.user_stories_by_feature(featureId), querySets: "?page=1&perPage=9999" });
      if (ignore) return;
      const rows = res?.data?.data || res?.data?.rows || [];
      const totalPoints = rows.reduce((sum, s) => sum + (Number(s.story_points) || 0), 0);
      const completedPoints = rows.filter((s) => s.status === "completed").reduce((sum, s) => sum + (Number(s.story_points) || 0), 0);
      setCompletionSummary({ totalPoints, completedPoints });
    })();
    return () => {
      ignore = true;
    };
  }, [featureId, refresh]);
  const [editingIds, setEditingIds] = useState([]);
  const [editDialog, setEditDialog] = useState({ open: false, story: {} });

  const handleDelete = async (storyId) => {
    setEditingIds((prev) => [...prev, storyId]);
    const response = await backendRequest({ endpoint: BACKEND_ENDPOINT.delete_user_story(storyId) });
    showToast({
      message: response.message ?? (response.success ? "Deleted successfully" : "Failed to delete"),
      type: response.success ? "success" : "error",
    });
    if (response.success) setRefresher(true);
    setEditingIds((prev) => prev.filter((id) => id !== storyId));
  };

  const displayColumns = [
    {
      field: "type",
      headerName: "Type",
      flex: 0.3,
      renderCell: (params) => <Chip label={(params.value || "story").toUpperCase()} size="small" color={params.value === "task" ? "secondary" : "primary"} variant="outlined" />,
    },
    { field: "title", headerName: "Title", flex: 1, valueFormatter: (value) => formatTextForDataTable(value) },
    {
      field: "priority",
      headerName: "Priority",
      flex: 0.5,
      renderCell: (params) => <Chip label={params.value} color={priorityColors[params.value] || "default"} size="small" variant="outlined" />,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.5,
      renderCell: (params) => <Chip label={(params.value || "").replace("_", " ")} color={statusColors[params.value] || "default"} size="small" />,
    },
    { field: "story_points", headerName: "Points", flex: 0.3 },
    {
      field: "view",
      headerName: "View",
      minWidth: 60,
      flex: 0.2,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box display="flex" justifyContent="center" alignItems="center" width="100%" height="100%">
          <Link to={paths.user_story_detail(params.row.id).actualPath}>
            <VisibilityIcon sx={{ cursor: "pointer", color: "text.secondary", "&:hover": { color: "primary.main" } }} />
          </Link>
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 100,
      flex: 0.2,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const isEditing = editingIds.includes(params.row.id);
        return <ActionColumn params={params} isEditing={isEditing} editAction={(row) => setEditDialog({ open: true, story: row })} deleteAction={(row) => handleDelete(row.id)} />;
      },
    },
  ];

  const formFields = [
    {
      type: "select",
      name: "type",
      label: "Type",
      required: true,
      options: [
        { label: "Story", value: "story" },
        { label: "Task", value: "task" },
      ],
      defaultValue: "story",
    },
    { type: "text", name: "title" },
    { type: "textarea", name: "description", label: "Description", required: false },
    { type: "textarea", name: "acceptance_criteria", label: "Acceptance Criteria", required: false },
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
    { type: "text", name: "story_points", label: "Story Points", required: false, validationName: "number" },
    { type: "date", name: "due_date", label: "Due Date", required: false, validationName: "futureDate" },
  ];

  const editFormFields = [
    { type: "text", name: "title" },
    { type: "textarea", name: "description", label: "Description" },
    { type: "textarea", name: "acceptance_criteria", label: "Acceptance Criteria", required: false },
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
    { type: "text", name: "story_points", label: "Story Points", required: false, validationName: "number" },
    { type: "date", name: "due_date", label: "Due Date", required: false, validationName: "futureDate" },
  ];

  return (
    <>
      {featureId && (
        <Box m="20px">
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Heading title="User Stories" level={2} />
            <DoButton onclick={() => setCreateOpen(true)}>Add User Story</DoButton>
          </Box>
          {completionSummary.totalPoints > 0 && (
            <Box mb={2}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Completion: {completionSummary.completedPoints} / {completionSummary.totalPoints} pts
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round((completionSummary.completedPoints / completionSummary.totalPoints) * 100)}%
                </Typography>
              </Box>
              <Tooltip title={`${completionSummary.completedPoints} / ${completionSummary.totalPoints} pts completed`}>
                <LinearProgress variant="determinate" value={Math.round((completionSummary.completedPoints / completionSummary.totalPoints) * 100)} sx={{ height: 8, borderRadius: 4 }} />
              </Tooltip>
            </Box>
          )}
          <DataTable columns={displayColumns} fetchEndpoint={BACKEND_ENDPOINT.user_stories_by_feature(featureId)} refresh={refresh} setRefresh={setRefresher} defaultPageSize={5} />
        </Box>
      )}

      <CreateDialog
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        usefor="User Story"
        backendEndpoint={BACKEND_ENDPOINT.create_user_story(featureId)}
        extraData={{ departmentId, projectId }}
        onSuccess={() => {
          setCreateOpen(false);
          setRefresher(true);
        }}
        formFields={formFields}
      />

      <EditDialog
        isOpen={editDialog.open}
        formFields={editFormFields}
        updateBackendEndpoint={BACKEND_ENDPOINT.update_user_story(editDialog.story?.id)}
        onClose={() => setEditDialog({ open: false, story: {} })}
        onSuccess={() => {
          setRefresher(true);
          setEditDialog({ open: false, story: {} });
        }}
        initialData={editDialog.story}
        useFor="User Story"
      />
    </>
  );
}
