// Author: Copilot
// Description: Component/Task detail view. Timer support. No sub-components or helpers.
// Architecture: Page → Components/Tasks (flat)
// Version: 2.0.0

/* eslint-disable react-refresh/only-export-components */
import { redirect, useLoaderData, useNavigate, useRevalidator } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import { Link } from "react-router-dom";
import Heading from "../../../../components/Heading";
import DoButton from "../../../../components/button/DoButton";
import EditDialog from "../../../../components/pms/EditDialog";
import BACKEND_ENDPOINT, { paths } from "../../../../util/urls";
import backendRequest from "../../../../util/request";
import { showToast } from "../../../../util/feedback/ToastService";
import { useWorkspace } from "../../../../context/WorkspaceContext";

const statusColors = {
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

const editFormFields = [
  { type: "text", name: "title", label: "Title" },
  { type: "textarea", name: "description", label: "Description" },
  { type: "textarea", name: "acceptance_criteria", label: "Acceptance Criteria", require: false },
  {
    type: "select", name: "status", label: "Status",
    options: [
      { value: "defined", label: "Defined" },
      { value: "in_progress", label: "In Progress" },
      { value: "review", label: "Review" },
      { value: "completed", label: "Completed" },
      { value: "blocked", label: "Blocked" },
    ],
  },
  {
    type: "select", name: "priority", label: "Priority",
    options: [
      { value: "critical", label: "Critical" },
      { value: "high", label: "High" },
      { value: "medium", label: "Medium" },
      { value: "low", label: "Low" },
    ],
  },
  { type: "number", name: "story_points", label: "Story Points", require: false },
];

export default function ComponentDetail() {
  const response = useLoaderData();
  const [componentPatch, setComponentPatch] = useState(null);
  const { currentWorkspace } = useWorkspace();

  const [editDialog, setEditDialog] = useState(false);
  const [timerLoading, setTimerLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerIntervalRef = useRef(null);

  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const prevWorkspaceId = useRef();

  const component = { ...(response?.data || {}), ...(componentPatch || {}) };

  // Redirect if workspace switches
  useEffect(() => {
    const currentId = currentWorkspace?.id;
    if (prevWorkspaceId.current && currentId && prevWorkspaceId.current !== currentId) {
      navigate(paths.pages);
    }
    prevWorkspaceId.current = currentId;
  }, [currentWorkspace?.id, navigate]);

  // Timer tick
  useEffect(() => {
    if (component.timer_status === "running" && component.timer_started_at && component.status !== "completed") {
      const startedAt = new Date(component.timer_started_at).getTime();
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
      setElapsedSeconds(0);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [component.timer_status, component.timer_started_at, component.status]);

  const formatElapsed = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const handleStartTimer = async () => {
    setTimerLoading(true);
    const res = await backendRequest({ endpoint: BACKEND_ENDPOINT.start_component_timer(component.id) });
    showToast({ message: res.message ?? (res.success ? "Timer started" : "Failed"), type: res.success ? "success" : "error" });
    if (res.success) {
      setComponentPatch((prev) => ({ ...(prev || {}), timer_status: "running", timer_started_at: new Date().toISOString() }));
    }
    setTimerLoading(false);
  };

  const handleStopTimer = async () => {
    setTimerLoading(true);
    const res = await backendRequest({ endpoint: BACKEND_ENDPOINT.stop_component_timer(component.id) });
    showToast({ message: res.message ?? (res.success ? "Timer stopped" : "Failed"), type: res.success ? "success" : "error" });
    if (res.success) {
      setComponentPatch((prev) => ({
        ...(prev || {}),
        timer_status: "stopped",
        timer_started_at: null,
        total_work_time: res.data?.total_work_time ?? prev?.total_work_time ?? component.total_work_time,
      }));
    }
    setTimerLoading(false);
  };

  const onEditSuccess = (updatedData) => {
    setEditDialog(false);
    setComponentPatch((prev) => ({ ...(prev || {}), ...updatedData }));
    revalidator.revalidate();
  };

  const isRunning = component.timer_status === "running";
  const isTask = component.type === "task";

  // Back link — navigate to parent page
  const parentPage = component.page;
  const parentPagePath = parentPage ? paths.page_detail(component.page_id).actualPath : paths.pages;
  const parentPageName = parentPage?.name || (component.is_global ? "Global Components" : "Pages");

  return (
    <>
      <Box m="20px" mb="20px">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading
            title={component.title}
            subtitle={component.description || "-"}
            giveMarginBottom={false}
          />
          <Stack direction="row" spacing={1} alignItems="center">
            {!isTask && (
              <>
                <Tooltip title={isRunning ? "Stop Timer" : "Start Timer"}>
                  <span>
                    <IconButton
                      color={isRunning ? "error" : "success"}
                      onClick={isRunning ? handleStopTimer : handleStartTimer}
                      disabled={timerLoading || component.status === "completed"}
                    >
                      {isRunning ? <StopIcon /> : <PlayArrowIcon />}
                    </IconButton>
                  </span>
                </Tooltip>
                {isRunning && (
                  <Typography variant="caption" color="success.main" fontWeight="bold">
                    {formatElapsed(elapsedSeconds)}
                  </Typography>
                )}
              </>
            )}
            <DoButton onclick={() => setEditDialog(true)}>Edit</DoButton>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1} mt={1.5} flexWrap="wrap" alignItems="center">
          <Chip label={isTask ? "Task" : "Component"} size="small" color={isTask ? "secondary" : "primary"} variant="outlined" />
          <Chip label={component.status || "defined"} size="small" color={statusColors[component.status] || "default"} />
          <Chip label={`Priority: ${component.priority || "medium"}`} size="small" color={priorityColors[component.priority] || "default"} variant="outlined" />
          {component.story_points > 0 && (
            <Chip label={`${component.story_points} pts`} size="small" variant="outlined" />
          )}
          {component.total_work_time > 0 && (
            <Chip
              label={`Logged: ${Math.floor(component.total_work_time / 60)}h ${component.total_work_time % 60}m`}
              size="small"
              variant="outlined"
              color="info"
            />
          )}
          {component.is_global && (
            <Chip label="Global" size="small" color="success" />
          )}
          <Button
            component={Link}
            to={parentPagePath}
            variant="text"
            size="small"
            sx={{ p: 0, textTransform: "none" }}
          >
            ← {parentPageName}
          </Button>
        </Stack>

        {component.acceptance_criteria && (
          <Box mt={2} p={1.5} borderRadius={1} bgcolor="background.paper" border="1px solid" borderColor="divider">
            <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" mb={0.5}>
              Acceptance Criteria
            </Typography>
            <Typography variant="body2" whiteSpace="pre-wrap">{component.acceptance_criteria}</Typography>
          </Box>
        )}

        <EditDialog
          isOpen={editDialog}
          formFields={editFormFields}
          updateBackendEndpoint={BACKEND_ENDPOINT.update_component(component.id)}
          onClose={() => setEditDialog(false)}
          initialData={component}
          onSuccess={onEditSuccess}
          useFor="component"
        />
      </Box>
    </>
  );
}

export async function componentFetchLoader({ params }) {
  const { id } = params;
  const endpoint = BACKEND_ENDPOINT.component_detail(id);
  const response = await backendRequest({ endpoint, navigate: redirect });

  if (response.status === 404 || response.status === 422) {
    throw new Response("Component not found", { status: 404, statusText: "Component not found" });
  }
  if (!response.ok) {
    throw new Error(response.message || "Failed to load component");
  }
  return response;
}

