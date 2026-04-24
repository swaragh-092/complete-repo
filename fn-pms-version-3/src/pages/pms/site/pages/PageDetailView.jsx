// Author: Copilot
// Description: Page detail view — Components and Tasks tabs with fully inline datatable actions.
//              Timer, Mark Complete, and Edit all handled directly in datatable rows. No side drawer.
// Architecture: Page → Components (UI elements) + Tasks (work items)
// Version: 5.0.0

/* eslint-disable react-refresh/only-export-components */
import { redirect, useLoaderData, useNavigate, useRevalidator } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  Box,
  Chip,
  IconButton,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import Heading from "../../../../components/Heading";
import DoButton from "../../../../components/button/DoButton";
import EditDialog from "../../../../components/pms/EditDialog";
import CreateDialog from "../../../../components/pms/CreateDialog";
import DataTable from "../../../../components/tools/Datatable";
import BACKEND_ENDPOINT, { paths } from "../../../../util/urls";
import backendRequest from "../../../../util/request";
import { notifyTimerStarted } from "../../../../components/pms/ActiveTimerWidget";
import { showToast } from "../../../../util/feedback/ToastService";
import { useWorkspace } from "../../../../context/WorkspaceContext";

const statusColors = { active: "success", inactive: "default" };
const priorityColors = { critical: "error", high: "warning", medium: "info", low: "success" };
const componentStatusColors = { defined: "default", in_progress: "primary", review: "warning", completed: "success", blocked: "error" };

function formatTime(totalSecs) {
  if (!totalSecs) return "—";
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function TimerCell({ row, onStart, onStop }) {
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  const isRunning = row.timer_status === "running";
  const isCompleted = row.status === "completed";

  useEffect(() => {
    clearInterval(timerRef.current);
    if (isRunning && row.timer_started_at) {
      const base = (row.total_work_time || 0) * 60;
      const startedAt = new Date(row.timer_started_at).getTime();
      const calc = () => base + Math.floor((Date.now() - startedAt) / 1000);
      setElapsed(calc());
      timerRef.current = setInterval(() => setElapsed(calc()), 1000);
    } else {
      setElapsed((row.total_work_time || 0) * 60);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, row.timer_started_at, row.total_work_time]);

  const handleClick = async () => {
    setLoading(true);
    if (isRunning) await onStop(row);
    else await onStart(row);
    setLoading(false);
  };

  return (
    <Box display="flex" alignItems="center" gap={0.5} height="100%">
      <Tooltip title={isRunning ? "Stop Timer" : "Start Timer"}>
        <span>
          <IconButton size="small" color={isRunning ? "error" : "success"} onClick={handleClick} disabled={loading || isCompleted}>
            {isRunning ? <StopIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
          </IconButton>
        </span>
      </Tooltip>
      <Typography variant="caption" color={isRunning ? "success.main" : "text.secondary"} fontWeight={isRunning ? "bold" : "normal"} sx={{ minWidth: 52 }}>
        {formatTime(elapsed)}
      </Typography>
    </Box>
  );
}

function ActionCell({ row, onEdit, onComplete }) {
  const [loading, setLoading] = useState(false);
  const isCompleted = row.status === "completed";
  const handleComplete = async () => { setLoading(true); await onComplete(row); setLoading(false); };
  return (
    <Box display="flex" alignItems="center" height="100%">
      <Tooltip title="Edit">
        <IconButton size="small" onClick={() => onEdit(row)}><EditIcon fontSize="small" /></IconButton>
      </Tooltip>
      <Tooltip title={isCompleted ? "Already completed" : "Mark Complete"}>
        <span>
          <IconButton size="small" color="success" onClick={handleComplete} disabled={isCompleted || loading}>
            <CheckCircleOutlineIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
}

const makeItemColumns = (type, handlers) => [
  { field: "title", headerName: type === "task" ? "Task" : "Component", flex: 1.2, minWidth: 120 },
  {
    field: "status", headerName: "Status", flex: 0.55, minWidth: 90,
    renderCell: (params) => <Chip label={params.value || "defined"} size="small" color={componentStatusColors[params.value] || "default"} />,
  },
  { field: "priority", headerName: "Priority", flex: 0.45, minWidth: 70 },
  {
    field: "assigned_to", headerName: "Assigned To", flex: 0.6, minWidth: 100,
    renderCell: (params) =>
      params.row.assignee_details?.name
        ? <Chip label={params.row.assignee_details.name} size="small" color="info" variant="outlined" />
        : params.value
          ? <Chip label="Assigned" size="small" color="info" variant="outlined" />
          : <Typography variant="caption" color="text.disabled">—</Typography>,
  },
  ...(type === "task"
    ? []
    : [
        { field: "story_points", headerName: "Pts", flex: 0.3, minWidth: 50 },
        {
          field: "timer", headerName: "Timer / Logged", flex: 0.75, minWidth: 130, sortable: false, filterable: false,
          renderCell: (params) => <TimerCell row={params.row} onStart={handlers.onStartTimer} onStop={handlers.onStopTimer} />,
        },
      ]),
  {
    field: "actions", headerName: "", flex: 0.35, minWidth: 80, sortable: false, filterable: false,
    renderCell: (params) => <ActionCell row={params.row} onEdit={handlers.onEdit} onComplete={handlers.onComplete} />,
  },
];

const getComponentEditFormFields = (projectId, departmentId) => [
  { type: "text", name: "title", label: "Title" },
  { type: "textarea", name: "description", label: "Description" },
  { type: "textarea", name: "acceptance_criteria", label: "Acceptance Criteria", require: false },
  { type: "select", name: "status", label: "Status", options: [{ value: "defined", label: "Defined" }, { value: "in_progress", label: "In Progress" }, { value: "review", label: "Review" }, { value: "completed", label: "Completed" }, { value: "blocked", label: "Blocked" }] },
  { type: "select", name: "priority", label: "Priority", options: [{ value: "critical", label: "Critical" }, { value: "high", label: "High" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" }] },
  { type: "number", name: "story_points", label: "Story Points", require: false },
  { type: "member_picker", name: "assigned_to", label: "Assign To", required: false, projectId, departmentId },
];

const getTaskEditFormFields = (projectId, departmentId) => [
  { type: "text", name: "title", label: "Task Title" },
  { type: "textarea", name: "description", label: "Description" },
  { type: "textarea", name: "acceptance_criteria", label: "Acceptance Criteria", require: false },
  { type: "select", name: "status", label: "Status", options: [{ value: "defined", label: "Defined" }, { value: "in_progress", label: "In Progress" }, { value: "review", label: "Review" }, { value: "completed", label: "Completed" }, { value: "blocked", label: "Blocked" }] },
  { type: "select", name: "priority", label: "Priority", options: [{ value: "critical", label: "Critical" }, { value: "high", label: "High" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" }] },
  { type: "member_picker", name: "assigned_to", label: "Assign To", required: false, projectId, departmentId },
];

const getComponentFormFields = (projectId, departmentId) => [
  { type: "text", name: "title", label: "Title" },
  { type: "textarea", name: "description", label: "Description", require: false },
  { type: "select", name: "priority", label: "Priority", options: [{ value: "critical", label: "Critical" }, { value: "high", label: "High" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" }] },
  { type: "member_picker", name: "assigned_to", label: "Assign To", required: false, projectId, departmentId },
  { type: "number", name: "story_points", label: "Story Points", require: false },
];

const getTaskFormFields = (projectId, departmentId) => [
  { type: "text", name: "title", label: "Task Title" },
  { type: "textarea", name: "description", label: "Description", require: false },
  { type: "select", name: "priority", label: "Priority", options: [{ value: "critical", label: "Critical" }, { value: "high", label: "High" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" }] },
  { type: "member_picker", name: "assigned_to", label: "Assign To", required: false, projectId, departmentId },
];

const getEditFormFields = (projectId, departmentId) => [
  { type: "text", name: "name", label: "Name" },
  { type: "textarea", name: "description", label: "Description" },
  { type: "select", name: "status", label: "Status", options: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }] },
  { type: "select", name: "priority", label: "Priority", options: [{ value: "critical", label: "Critical" }, { value: "high", label: "High" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" }] },
  { type: "member_picker", name: "assignee_id", label: "Assign To", required: false, projectId, departmentId },
];

export default function PageDetailView() {
  const response = useLoaderData();
  const [pageOverride, setPageOverride] = useState(null);
  const page = pageOverride ?? response?.data;
  const { currentWorkspace } = useWorkspace();
  const [editDialog, setEditDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [componentRefresh, setComponentRefresh] = useState(true);
  const [taskRefresh, setTaskRefresh] = useState(true);
  const [createComponentDialog, setCreateComponentDialog] = useState(false);
  const [createTaskDialog, setCreateTaskDialog] = useState(false);
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const prevWorkspaceId = useRef();
  const [pageProgress, setPageProgress] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [itemEditDialogOpen, setItemEditDialogOpen] = useState(false);

  useEffect(() => {
    const currentId = currentWorkspace?.id;
    if (prevWorkspaceId.current && currentId && prevWorkspaceId.current !== currentId) navigate(paths.pages);
    prevWorkspaceId.current = currentId;
  }, [currentWorkspace?.id, navigate]);

  useEffect(() => {
    if (!page?.id) return;
    backendRequest({ endpoint: BACKEND_ENDPOINT.page_progress(page.id) })
      .then((res) => { if (res?.success) setPageProgress(res.data); });
  }, [page?.id, componentRefresh, taskRefresh]);

  const handleEdit = (row) => { setEditingItem(row); setItemEditDialogOpen(true); };

  const handleStartTimer = async (row) => {
    const res = await backendRequest({ endpoint: BACKEND_ENDPOINT.start_component_timer(row.id) });
    showToast({ message: res.message ?? (res.success ? "Timer started" : "Failed"), type: res.success ? "success" : "error" });
    if (res.success) { notifyTimerStarted(); setComponentRefresh(true); }
  };

  const handleStopTimer = async (row) => {
    const res = await backendRequest({ endpoint: BACKEND_ENDPOINT.stop_component_timer(row.id) });
    showToast({ message: res.message ?? (res.success ? "Timer stopped" : "Failed"), type: res.success ? "success" : "error" });
    if (res.success) setComponentRefresh(true);
  };

  const handleComplete = async (row) => {
    const res = await backendRequest({ endpoint: BACKEND_ENDPOINT.update_component(row.id), bodyData: { status: "completed" } });
    if (res?.success) {
      showToast({ message: "Marked as complete", type: "success" });
      if (activeTab === 0) setComponentRefresh(true); else setTaskRefresh(true);
    } else {
      showToast({ message: res?.message || "Failed to mark complete", type: "error" });
    }
  };

  const handleItemEditSuccess = () => { setItemEditDialogOpen(false); setEditingItem(null); if (activeTab === 0) setComponentRefresh(true); else setTaskRefresh(true); };
  const handleTabChange = (_, v) => { setActiveTab(v); if (v === 0) setComponentRefresh(true); if (v === 1) setTaskRefresh(true); };
  const onEditSuccess = (updatedData) => { setEditDialog(false); setPageOverride((prev) => ({ ...(prev ?? response?.data), ...updatedData })); revalidator.revalidate(); };

  const rowHandlers = { onEdit: handleEdit, onStartTimer: handleStartTimer, onStopTimer: handleStopTimer, onComplete: handleComplete };

  return (
    <>
      <Box m="20px" mb="20px">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading title={page.name} subtitle={page.url_slug ? `/${page.url_slug}` : (page.description || "—")} giveMarginBottom={false} />
          <Stack direction="row" spacing={1}>
            {activeTab === 0 && <DoButton onclick={() => setCreateComponentDialog(true)}>Add Component</DoButton>}
            {activeTab === 1 && <DoButton onclick={() => setCreateTaskDialog(true)}>Add Task</DoButton>}
            <DoButton onclick={() => setEditDialog(true)}>Edit Page</DoButton>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1} mt={1.5} flexWrap="wrap" alignItems="center">
          <Chip label={page.status || "active"} size="small" color={statusColors[page.status] || "default"} />
          <Chip label={`Priority: ${page.priority || "medium"}`} size="small" color={priorityColors[page.priority] || "default"} variant="outlined" />
          {page.project && <Typography variant="caption" color="text.secondary">Project: {page.project.name}</Typography>}
        </Stack>

        {pageProgress && (
          <Box mt={1.5} maxWidth={400}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color="text.secondary">Progress ({pageProgress.completedItems}/{pageProgress.totalItems} items)</Typography>
              <Typography variant="caption" fontWeight="bold">{pageProgress.progress}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={pageProgress.progress} color={pageProgress.progress === 100 ? "success" : "primary"} sx={{ borderRadius: 1, height: 6 }} />
          </Box>
        )}

        <EditDialog isOpen={editDialog} formFields={getEditFormFields(page.project_id, page.department_id)} updateBackendEndpoint={BACKEND_ENDPOINT.update_page(page.id)} onClose={() => setEditDialog(false)} initialData={page} onSuccess={onEditSuccess} useFor="page" />
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mx: "20px" }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Components" />
          <Tab label="Tasks" />
        </Tabs>
      </Box>

      <Box m="20px">
        {activeTab === 0 && (
          <>
            <DataTable columns={makeItemColumns("component", rowHandlers)} fetchEndpoint={BACKEND_ENDPOINT.components_by_page(page.id)} extraParams="&type=component" refresh={componentRefresh} setRefresh={setComponentRefresh} defaultPageSize={10} />
            <CreateDialog isOpen={createComponentDialog} formFields={getComponentFormFields(page.project_id, page.department_id)} onClose={() => setCreateComponentDialog(false)} usefor="Component" backendEndpoint={BACKEND_ENDPOINT.create_component(page.id)} extraData={{ departmentId: page.department_id, projectId: page.project_id, type: "component" }} onSuccess={() => { setCreateComponentDialog(false); setComponentRefresh(true); }} />
          </>
        )}
        {activeTab === 1 && (
          <>
            <DataTable columns={makeItemColumns("task", rowHandlers)} fetchEndpoint={BACKEND_ENDPOINT.components_by_page(page.id)} extraParams="&type=task" refresh={taskRefresh} setRefresh={setTaskRefresh} defaultPageSize={10} />
            <CreateDialog isOpen={createTaskDialog} formFields={getTaskFormFields(page.project_id, page.department_id)} onClose={() => setCreateTaskDialog(false)} usefor="Task" backendEndpoint={BACKEND_ENDPOINT.create_component(page.id)} extraData={{ departmentId: page.department_id, projectId: page.project_id, type: "task" }} onSuccess={() => { setCreateTaskDialog(false); setTaskRefresh(true); }} />
          </>
        )}
      </Box>

      {editingItem && (
        <EditDialog
          isOpen={itemEditDialogOpen}
          formFields={editingItem.type === "task" ? getTaskEditFormFields(editingItem.project_id, editingItem.department_id) : getComponentEditFormFields(editingItem.project_id, editingItem.department_id)}
          updateBackendEndpoint={BACKEND_ENDPOINT.update_component(editingItem.id)}
          onClose={() => { setItemEditDialogOpen(false); setEditingItem(null); }}
          initialData={editingItem}
          onSuccess={handleItemEditSuccess}
          useFor={editingItem.type === "task" ? "task" : "component"}
        />
      )}
    </>
  );
}

export async function pageFetchLoader({ params }) {
  const { id } = params;
  const endpoint = BACKEND_ENDPOINT.page_detail(id);
  const response = await backendRequest({ endpoint, navigate: redirect });
  if (response.status === 404 || response.status === 422) {
    throw new Response("Page not found", { status: 404, statusText: "Page not found" });
  }
  if (!response.ok) throw new Error(response.message || "Failed to load page");
  return response;
}
