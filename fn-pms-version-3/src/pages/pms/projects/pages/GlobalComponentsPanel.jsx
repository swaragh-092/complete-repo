// Author: Copilot
// Description: Global components panel — inline drawer with timer, work-time logging, and assignee.
// Version: 3.0.0

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import WebAssetIcon from "@mui/icons-material/WebAsset";
import backendRequest from "../../../../util/request";
import BACKEND_ENDPOINT from "../../../../util/urls";
import DoButton from "../../../../components/button/DoButton";
import Heading from "../../../../components/Heading";
import CreateDialog from "../../../../components/pms/CreateDialog";
import EditDialog from "../../../../components/pms/EditDialog";
import { notifyTimerStarted } from "../../../../components/pms/ActiveTimerWidget";
import { useWorkspace } from "../../../../context/WorkspaceContext";
import { showToast } from "../../../../util/feedback/ToastService";

const DRAWER_WIDTH = 420;

const statusColors = {
  active: "success",
  inactive: "default",
  defined: "default",
  in_progress: "primary",
  review: "warning",
  completed: "success",
  blocked: "error",
};

const priorityColors = {
  critical: "error",
  high: "warning",
  medium: "info",
  low: "success",
};

function formatElapsed(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

const getCreateFormFields = (projectId, departmentId) => [
  { type: "text", name: "title", label: "Title" },
  { type: "textarea", name: "description", label: "Description", require: false },
  {
    type: "select",
    name: "priority",
    label: "Priority",
    options: [
      { value: "critical", label: "Critical" },
      { value: "high", label: "High" },
      { value: "medium", label: "Medium" },
      { value: "low", label: "Low" },
    ],
    require: false,
  },
  { type: "number", name: "story_points", label: "Story Points", require: false },
  {
    type: "member_picker",
    name: "assigned_to",
    label: "Assign To",
    required: false,
    projectId,
    departmentId,
  },
];

const getEditFormFields = (projectId, departmentId) => [
  { type: "text", name: "title", label: "Title" },
  { type: "textarea", name: "description", label: "Description", require: false },
  { type: "textarea", name: "acceptance_criteria", label: "Acceptance Criteria", require: false },
  {
    type: "select",
    name: "status",
    label: "Status",
    options: [
      { value: "defined", label: "Defined" },
      { value: "in_progress", label: "In Progress" },
      { value: "review", label: "Review" },
      { value: "completed", label: "Completed" },
      { value: "blocked", label: "Blocked" },
    ],
  },
  {
    type: "select",
    name: "priority",
    label: "Priority",
    options: [
      { value: "critical", label: "Critical" },
      { value: "high", label: "High" },
      { value: "medium", label: "Medium" },
      { value: "low", label: "Low" },
    ],
  },
  { type: "number", name: "story_points", label: "Story Points", require: false },
  {
    type: "member_picker",
    name: "assigned_to",
    label: "Assign To",
    required: false,
    projectId,
    departmentId,
  },
];

export default function GlobalComponentsPanel({ projectId }) {
  const [components, setComponents] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [timerLoading, setTimerLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerIntervalRef = useRef(null);
  const { currentWorkspace } = useWorkspace();
  const departmentId = currentWorkspace?.id;

  const fetchComponents = async () => {
    if (!projectId) return;
    const res = await backendRequest({
      endpoint: BACKEND_ENDPOINT.global_components(projectId),
      querySets: "?perPage=9999&page=1",
    });
    if (res?.success) {
      setComponents(res.data?.data || res.data?.rows || res.data || []);
    }
  };

  useEffect(() => {
    fetchComponents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Timer tick — accumulated: total_work_time (minutes) + current session (seconds)
  useEffect(() => {
    if (selected?.timer_status === "running" && selected?.timer_started_at && selected?.status !== "completed") {
      const startedAt = new Date(selected.timer_started_at).getTime();
      const baseSeconds = (selected.total_work_time || 0) * 60;
      const calc = () => baseSeconds + Math.floor((Date.now() - startedAt) / 1000);
      setElapsedSeconds(calc());
      timerIntervalRef.current = setInterval(() => setElapsedSeconds(calc()), 1000);
    } else {
      clearInterval(timerIntervalRef.current);
      setElapsedSeconds((selected?.total_work_time || 0) * 60);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [selected?.timer_status, selected?.timer_started_at, selected?.status, selected?.total_work_time]);

  const handleOpen = async (comp) => {
    setSelected(null);
    setDrawerOpen(true);
    setDrawerLoading(true);
    const res = await backendRequest({ endpoint: BACKEND_ENDPOINT.component_detail(comp.id) });
    setDrawerLoading(false);
    if (res?.success) setSelected(res.data);
    else showToast({ message: res.message || "Failed to load component", type: "error" });
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelected(null);
    clearInterval(timerIntervalRef.current);
    setElapsedSeconds(0);
  };

  const handleStartTimer = async () => {
    setTimerLoading(true);
    const res = await backendRequest({ endpoint: BACKEND_ENDPOINT.start_component_timer(selected.id) });
    showToast({ message: res.message ?? (res.success ? "Timer started" : "Failed"), type: res.success ? "success" : "error" });
    if (res.success) {
      setSelected((prev) => ({ ...prev, timer_status: "running", timer_started_at: new Date().toISOString() }));
      notifyTimerStarted();
    }
    setTimerLoading(false);
  };

  const handleStopTimer = async () => {
    setTimerLoading(true);
    const res = await backendRequest({ endpoint: BACKEND_ENDPOINT.stop_component_timer(selected.id) });
    showToast({ message: res.message ?? (res.success ? "Timer stopped" : "Failed"), type: res.success ? "success" : "error" });
    if (res.success) {
      setSelected((prev) => ({
        ...prev,
        timer_status: "stopped",
        timer_started_at: null,
        total_work_time: res.data?.total_work_time ?? prev.total_work_time,
      }));
      fetchComponents();
    }
    setTimerLoading(false);
  };

  const handleEditSuccess = async (updatedData) => {
    setEditOpen(false);
    setSelected((prev) => ({ ...prev, ...updatedData }));
    fetchComponents();
  };

  const isTimerRunning = selected?.timer_status === "running";

  return (
    <>
      <Box p="20px" maxWidth="49%" width="100%">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Heading title="Global Components" level={2} />
          <DoButton onclick={() => setCreateOpen(true)}>Add Global Component</DoButton>
        </Box>

        {components.length === 0 ? (
          <Typography variant="body2" color="text.secondary" mt={2}>
            No global components yet. Global components (header, footer, navbar) are shared across all pages.
          </Typography>
        ) : (
          <List dense disablePadding>
            {components.map((comp) => (
              <ListItemButton
                key={comp.id}
                onClick={() => handleOpen(comp)}
                sx={{ borderRadius: 1, mb: 0.5 }}
              >
                <WebAssetIcon fontSize="small" sx={{ mr: 1, opacity: 0.6 }} />
                <ListItemText
                  primary={comp.title || comp.name}
                  secondary={
                    <Stack direction="row" spacing={0.5} component="span" alignItems="center" flexWrap="wrap">
                      <Chip
                        label={comp.status || "defined"}
                        size="small"
                        color={statusColors[comp.status] || "default"}
                        sx={{ height: 16, fontSize: 10 }}
                      />
                      {comp.priority && (
                        <Chip
                          label={comp.priority}
                          size="small"
                          color={priorityColors[comp.priority] || "default"}
                          variant="outlined"
                          sx={{ height: 16, fontSize: 10 }}
                        />
                      )}
                      {comp.assignee_details?.name && (
                        <Chip
                          label={comp.assignee_details.name}
                          size="small"
                          color="info"
                          variant="outlined"
                          sx={{ height: 16, fontSize: 10 }}
                        />
                      )}
                    </Stack>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>

      <CreateDialog
        isOpen={createOpen}
        formFields={getCreateFormFields(projectId, departmentId)}
        onClose={() => setCreateOpen(false)}
        usefor="Global Component"
        backendEndpoint={BACKEND_ENDPOINT.create_global_component(projectId)}
        extraData={{ departmentId, is_global: true }}
        onSuccess={() => {
          setCreateOpen(false);
          fetchComponents();
        }}
      />

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{ sx: { width: DRAWER_WIDTH, p: 2 } }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" fontWeight="bold">Component Detail</Typography>
          <IconButton size="small" onClick={handleCloseDrawer}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {drawerLoading && (
          <Box display="flex" justifyContent="center" mt={4}>
            <CircularProgress size={32} />
          </Box>
        )}

        {!drawerLoading && selected && (
          <Box>
            <Typography variant="h6" gutterBottom>{selected.title || selected.name}</Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
              <Chip label="Global" size="small" color="secondary" variant="outlined" />
              <Chip
                label={selected.status || "defined"}
                size="small"
                color={statusColors[selected.status] || "default"}
              />
              <Chip
                label={`Priority: ${selected.priority || "medium"}`}
                size="small"
                color={priorityColors[selected.priority] || "default"}
                variant="outlined"
              />
              {(selected.story_points > 0) && (
                <Chip label={`${selected.story_points} pts`} size="small" variant="outlined" />
              )}
              {selected.assigned_to && (
                <Chip
                  label={selected.assignee_details?.name || "Assigned"}
                  size="small"
                  color="info"
                  variant="outlined"
                />
              )}
              {(selected.total_work_time > 0) && (
                <Chip
                  label={`Logged: ${Math.floor(selected.total_work_time / 60)}h ${selected.total_work_time % 60}m`}
                  size="small"
                  variant="outlined"
                  color="info"
                />
              )}
            </Stack>

            {selected.description && (
              <Box mb={2}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" mb={0.5}>
                  Description
                </Typography>
                <Typography variant="body2">{selected.description}</Typography>
              </Box>
            )}

            {selected.acceptance_criteria && (
              <Box mb={2} p={1.5} borderRadius={1} bgcolor="background.paper" border="1px solid" borderColor="divider">
                <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" mb={0.5}>
                  Acceptance Criteria
                </Typography>
                <Typography variant="body2" whiteSpace="pre-wrap">{selected.acceptance_criteria}</Typography>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Timer */}
            <Box mb={2}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" mb={1}>
                Timer
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip title={isTimerRunning ? "Stop Timer" : "Start Timer"}>
                  <span>
                    <IconButton
                      color={isTimerRunning ? "error" : "success"}
                      onClick={isTimerRunning ? handleStopTimer : handleStartTimer}
                      disabled={timerLoading || selected.status === "completed"}
                    >
                      {isTimerRunning ? <StopIcon /> : <PlayArrowIcon />}
                    </IconButton>
                  </span>
                </Tooltip>
                {isTimerRunning ? (
                  <Typography variant="body2" color="success.main" fontWeight="bold">
                    {formatElapsed(elapsedSeconds)}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {selected.status === "completed" ? "Completed" : "Not running"}
                  </Typography>
                )}
              </Stack>
            </Box>

            <Stack direction="row" spacing={1} mt={1}>
              <DoButton onclick={() => setEditOpen(true)}>Edit Component</DoButton>
              <Button
                variant="outlined"
                color="success"
                size="small"
                disabled={selected.status === "completed"}
                onClick={async () => {
                  const res = await backendRequest({ endpoint: BACKEND_ENDPOINT.update_component(selected.id), bodyData: { status: "completed" } });
                  if (res?.success) {
                    showToast({ message: "Marked as complete", type: "success" });
                    setSelected((prev) => ({ ...prev, status: "completed" }));
                    fetchComponents();
                  } else {
                    showToast({ message: res?.message || "Failed to mark complete", type: "error" });
                  }
                }}
              >
                {selected.status === "completed" ? "Completed" : "Mark Complete"}
              </Button>
            </Stack>

            <EditDialog
              isOpen={editOpen}
              formFields={getEditFormFields(projectId, departmentId)}
              updateBackendEndpoint={BACKEND_ENDPOINT.update_component(selected.id)}
              onClose={() => setEditOpen(false)}
              initialData={selected}
              onSuccess={handleEditSuccess}
              useFor="global component"
            />
          </Box>
        )}
      </Drawer>
    </>
  );
}
