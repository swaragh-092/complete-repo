// Author: Gururaj
// Created: 14th Oct 2025
// Description: User Story detail page showing sub-stories, checklist tasks, linked issues, and timers.
// Version: 2.0.0
// Modified:

/* eslint-disable react-refresh/only-export-components */
import { redirect, useLoaderData, useNavigate, useRevalidator } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Typography, Chip, Stack, LinearProgress, Button, Autocomplete, TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel, Alert, Divider } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LockIcon from "@mui/icons-material/Lock";
import UndoIcon from "@mui/icons-material/Undo";
import Heading from "../../../components/Heading";
import DoButton from "../../../components/button/DoButton";
import EditDialog from "../../../components/pms/EditDialog";
import CreateDialog from "../../../components/pms/CreateDialog";
import DataTable from "../../../components/tools/Datatable";
import ActionColumn from "../../../components/tools/ActionColumn";
import BACKEND_ENDPOINT from "../../../util/urls";
import backendRequest from "../../../util/request";
import { showToast } from "../../../util/feedback/ToastService";
import { useWorkspace } from "../../../context/WorkspaceContext";
import { formatTextForDataTable } from "../../../util/helper";

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

const approvalColors = {
  not_required: "default",
  pending: "warning",
  approved: "success",
  rejected: "error",
};

export default function UserStoryDetail() {
  const response = useLoaderData();
  const [userStoryPatch, setUserStoryPatch] = useState(null);
  const { currentWorkspace } = useWorkspace();
  const [members, setMembers] = useState([]);
  const [myMembership, setMyMembership] = useState(null);

  const [editDialog, setEditDialog] = useState(false);
  const [createSubStoryDialog, setCreateSubStoryDialog] = useState(false);
  const [subStoryRefresh, setSubStoryRefresh] = useState(true);
  const [editingIds, setEditingIds] = useState([]);
  const [editSubDialog, setEditSubDialog] = useState({ open: false, story: {} });
  const [timerLoading, setTimerLoading] = useState(false);
  const [advanceLoading, setAdvanceLoading] = useState(false);
  const [subAdvanceLoading, setSubAdvanceLoading] = useState({});
  const [revertLoading, setRevertLoading] = useState(false);
  const [subRevertLoading, setSubRevertLoading] = useState({});
  // elapsed seconds shown while timer is running
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerIntervalRef = useRef(null);

  // Change request dialogs
  const [changeReqDialog, setChangeReqDialog] = useState({ open: false, type: null, storyId: null, storyTitle: "", currentStatus: null });
  const [changeReqValue, setChangeReqValue] = useState({ due_date: "", target_status: "", reason: "" });
  const [changeReqLoading, setChangeReqLoading] = useState(false);
  const [changeRequests, setChangeRequests] = useState([]);
  const [crRefresh, setCrRefresh] = useState(false);

  // Helper stories state
  const [helperStories, setHelperStories] = useState([]);
  const [helperRefresh, setHelperRefresh] = useState(false);
  const [createHelperDialog, setCreateHelperDialog] = useState(false);
  const [helperActionLoading, setHelperActionLoading] = useState({});

  // Dependencies state
  const [dependencies, setDependencies] = useState([]);
  const [parentStories, setParentStories] = useState([]);
  const [depsRefresh, setDepsRefresh] = useState(false);
  const [depSearchValue, setDepSearchValue] = useState(null);
  const [depSearchInput, setDepSearchInput] = useState("");
  const [depSearchLoading, setDepSearchLoading] = useState(false);
  const [depOptions, setDepOptions] = useState([]);

  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const prevWorkspaceId = useRef();
  const userStory = {
    ...(response?.data || {}),
    ...(userStoryPatch || {}),
  };

  const projectIdForMembers = userStory?.project_id || userStory?.feature?.project_id;
  useEffect(() => {
    if (projectIdForMembers) {
      backendRequest({ endpoint: BACKEND_ENDPOINT.project_members(projectIdForMembers) }).then((res) => {
        if (res.success) {
          setMembers(res.data?.members?.data || []);
        }
      });
      // Fetch my membership to know if I am a lead
      backendRequest({ endpoint: BACKEND_ENDPOINT.my_project_membership(projectIdForMembers) }).then((res) => {
        if (res.success) setMyMembership(res.data);
      });
    }
  }, [projectIdForMembers]);

  const isTeamLead = myMembership?.project_role === "lead";

  // Load change requests for this story
  const fetchChangeRequests = useCallback(async () => {
    if (!userStory.id) return;
    const res = await backendRequest({ endpoint: BACKEND_ENDPOINT.story_change_requests(userStory.id) });
    if (res.success) setChangeRequests(res.data || []);
  }, [userStory.id]);

  useEffect(() => {
    fetchChangeRequests();
  }, [fetchChangeRequests, crRefresh]);

  // After every revalidation, drop status/approval_status from the local patch
  // so the fresh server value is shown (prevents stale "completed" chip)
  const prevRevalidatorState = useRef(revalidator.state);
  useEffect(() => {
    if (prevRevalidatorState.current === "loading" && revalidator.state === "idle") {
      setUserStoryPatch((prev) => {
        if (!prev) return prev;
        // eslint-disable-next-line no-unused-vars
        const { status: _s, approval_status: _a, ...rest } = prev;
        return Object.keys(rest).length ? rest : null;
      });
    }
    prevRevalidatorState.current = revalidator.state;
  }, [revalidator.state]);

  useEffect(() => {
    const currentId = currentWorkspace?.id;
    if (prevWorkspaceId.current && currentId && prevWorkspaceId.current !== currentId) {
      navigate("/user-stories");
    }
    prevWorkspaceId.current = currentId;
  }, [currentWorkspace?.id, navigate]);

  // Start/stop the elapsed-seconds counter when the live_status is running
  useEffect(() => {
    if (userStory.live_status === "running" && userStory.taken_at && userStory.status !== "completed") {
      const startedAt = new Date(userStory.taken_at).getTime();
      // Initialise to already-elapsed seconds from taken_at
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
      setElapsedSeconds(0);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [userStory.live_status, userStory.taken_at, userStory.status]);

  const formatElapsed = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatTotalWorkTime = (minutes) => {
    if (!minutes) return "0m";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const handleStartTimer = async () => {
    setTimerLoading(true);
    const res = await backendRequest({ endpoint: BACKEND_ENDPOINT.start_timer(userStory.id) });
    showToast({ message: res.message ?? (res.success ? "Timer started" : "Failed"), type: res.success ? "success" : "error" });
    if (res.success) {
      setUserStoryPatch((prev) => ({ ...(prev || {}), live_status: "running", taken_at: new Date().toISOString(), status: res.data?.status || prev?.status || userStory.status }));
    }
    setTimerLoading(false);
  };

  const handleStopTimer = async () => {
    setTimerLoading(true);
    const res = await backendRequest({ endpoint: BACKEND_ENDPOINT.stop_timer(userStory.id) });
    showToast({ message: res.message ?? (res.success ? "Timer stopped" : "Failed"), type: res.success ? "success" : "error" });
    if (res.success) {
      setUserStoryPatch((prev) => ({ ...(prev || {}), live_status: "stop", taken_at: null, total_work_time: res.data?.total_work_time ?? prev?.total_work_time ?? userStory.total_work_time }));
    }
    setTimerLoading(false);
  };

  // ─── Load helper stories ──────────────────────────────────────────────────
  const fetchHelperStories = useCallback(async () => {
    if (!userStory.id) return;
    const res = await backendRequest({ endpoint: BACKEND_ENDPOINT.get_helper_stories(userStory.id) });
    if (res.success) setHelperStories(res.data || []);
  }, [userStory.id]);

  useEffect(() => {
    fetchHelperStories();
  }, [fetchHelperStories, helperRefresh]);

  // ─── Load dependencies ────────────────────────────────────────────────────
  const fetchDependencies = useCallback(async () => {
    if (!userStory.id) return;
    const [depsRes, parentsRes] = await Promise.all([backendRequest({ endpoint: BACKEND_ENDPOINT.story_dependencies(userStory.id) }), backendRequest({ endpoint: BACKEND_ENDPOINT.story_parents(userStory.id) })]);
    if (depsRes.success) setDependencies(depsRes.data || []);
    if (parentsRes.success) setParentStories(parentsRes.data || []);
  }, [userStory.id]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies, depsRefresh]);

  // ─── Dependency search: load stories from current project for autocomplete ─
  useEffect(() => {
    const projectId = userStory?.project_id || userStory?.feature?.project_id;
    if (!projectId) return;
    setDepSearchLoading(true);
    backendRequest({ endpoint: BACKEND_ENDPOINT.user_stories_by_project(projectId), querySets: "?page=1&perPage=9999" }).then((res) => {
      if (res.success) {
        const list = (res.data?.data || []).filter((s) => s.id !== userStory.id);
        setDepOptions(list.map((s) => ({ label: s.title, id: s.id })));
      }
      setDepSearchLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userStory.id]);

  const handleAcceptRejectHelper = async (helperStoryId, action) => {
    setHelperActionLoading((prev) => ({ ...prev, [helperStoryId]: true }));
    const res = await backendRequest({ endpoint: BACKEND_ENDPOINT.accept_reject_helper(helperStoryId, action) });
    showToast({ message: res.message ?? (res.success ? `Help request ${action}ed` : "Failed"), type: res.success ? "success" : "error" });
    if (res.success) setHelperRefresh((p) => !p);
    setHelperActionLoading((prev) => ({ ...prev, [helperStoryId]: false }));
  };

  const handleRemoveHelper = async (helperStoryId) => {
    setHelperActionLoading((prev) => ({ ...prev, [helperStoryId]: true }));
    const res = await backendRequest({ endpoint: BACKEND_ENDPOINT.remove_helper_story(helperStoryId) });
    showToast({ message: res.message ?? (res.success ? "Helper removed" : "Failed"), type: res.success ? "success" : "error" });
    if (res.success) setHelperRefresh((p) => !p);
    setHelperActionLoading((prev) => ({ ...prev, [helperStoryId]: false }));
  };

  const handleAddDependency = async () => {
    if (!depSearchValue) return;
    const res = await backendRequest({ endpoint: BACKEND_ENDPOINT.add_story_dependency(userStory.id, depSearchValue.id) });
    showToast({ message: res.message ?? (res.success ? "Dependency added" : "Failed"), type: res.success ? "success" : "error" });
    if (res.success) {
      setDepSearchValue(null);
      setDepSearchInput("");
      setDepsRefresh((p) => !p);
    }
  };

  const handleRemoveDependency = async (dependencyStoryId) => {
    const res = await backendRequest({ endpoint: BACKEND_ENDPOINT.remove_story_dependency(userStory.id, dependencyStoryId) });
    showToast({ message: res.message ?? (res.success ? "Dependency removed" : "Failed"), type: res.success ? "success" : "error" });
    if (res.success) setDepsRefresh((p) => !p);
  };

  // Advance status for a story (parent or sub)
  const handleAdvanceStatus = async (storyId, isSubStory = false) => {
    if (isSubStory) {
      setSubAdvanceLoading((prev) => ({ ...prev, [storyId]: true }));
    } else {
      setAdvanceLoading(true);
    }
    const res = await backendRequest({ endpoint: BACKEND_ENDPOINT.advance_user_story_status(storyId) });
    showToast({ message: res.message ?? (res.success ? "Status advanced" : "Failed"), type: res.success ? "success" : res.code === "ANOTHER_IN_PROGRESS" ? "warning" : "error" });
    if (res.success) {
      if (isSubStory) {
        setSubStoryRefresh(true);
        revalidator.revalidate(); // refresh parent status chip
      } else {
        setUserStoryPatch((prev) => ({ ...(prev || {}), status: res.data?.status, approval_status: res.data?.approval_status }));
        revalidator.revalidate();
      }
    }
    if (isSubStory) {
      setSubAdvanceLoading((prev) => ({ ...prev, [storyId]: false }));
    } else {
      setAdvanceLoading(false);
    }
  };

  // Revert status one step back — always free, no approval required
  const handleRevertStatus = async (storyId, currentStatus, storyTitle, isSubStory = false) => {
    if (isSubStory) {
      setSubRevertLoading((prev) => ({ ...prev, [storyId]: true }));
    } else {
      setRevertLoading(true);
    }
    const res = await backendRequest({ endpoint: BACKEND_ENDPOINT.revert_user_story_status(storyId) });
    showToast({ message: res.message ?? (res.success ? "Status reverted" : "Failed"), type: res.success ? "success" : "error" });
    if (res.success) {
      if (isSubStory) {
        setSubStoryRefresh(true);
        revalidator.revalidate(); // refresh parent status chip
      } else {
        setUserStoryPatch((prev) => ({ ...(prev || {}), status: res.data?.status, approval_status: res.data?.approval_status }));
        revalidator.revalidate();
      }
    }
    if (isSubStory) {
      setSubRevertLoading((prev) => ({ ...prev, [storyId]: false }));
    } else {
      setRevertLoading(false);
    }
  };

  // Open change request dialog
  const openChangeReqDialog = (type, storyId, storyTitle, currentStatus = null) => {
    setChangeReqValue({ due_date: "", target_status: "", reason: "" });
    setChangeReqDialog({ open: true, type, storyId, storyTitle, currentStatus });
  };

  const handleSubmitChangeRequest = async () => {
    const { type, storyId } = changeReqDialog;
    if (!type || !storyId) return;

    const requested_value = type === "due_date_change" ? { due_date: changeReqValue.due_date } : { target_status: changeReqValue.target_status };

    if (type === "due_date_change" && !changeReqValue.due_date) {
      showToast({ message: "Please select a new due date", type: "error" });
      return;
    }
    if (type === "status_revert" && !changeReqValue.target_status) {
      showToast({ message: "Please select the target status", type: "error" });
      return;
    }

    setChangeReqLoading(true);
    const res = await backendRequest({
      endpoint: BACKEND_ENDPOINT.request_story_change(storyId),
      bodyData: { request_type: type, requested_value, reason: changeReqValue.reason },
    });
    showToast({ message: res.message ?? (res.success ? "Change request submitted" : "Failed"), type: res.success ? "success" : "error" });
    if (res.success) {
      setChangeReqDialog({ open: false, type: null, storyId: null, storyTitle: "" });
      setCrRefresh((p) => !p);
    }
    setChangeReqLoading(false);
  };

  const handleReviewChangeRequest = async (requestId, action) => {
    const res = await backendRequest({
      endpoint: BACKEND_ENDPOINT.review_change_request(requestId),
      bodyData: { action },
    });
    showToast({ message: res.message ?? (res.success ? `Request ${action}` : "Failed"), type: res.success ? "success" : "error" });
    if (res.success) {
      setCrRefresh((p) => !p);
      revalidator.revalidate();
    }
  };

  const onEditSuccess = (updatedData) => {
    setEditDialog(false);
    setUserStoryPatch((prev) => ({ ...(prev || {}), ...updatedData }));
    revalidator.revalidate();
  };

  const handleDeleteSubStory = async (subStoryId) => {
    setEditingIds((prev) => [...prev, subStoryId]);
    const response = await backendRequest({ endpoint: BACKEND_ENDPOINT.delete_user_story(subStoryId) });
    showToast({
      message: response.message ?? (response.success ? "Deleted successfully" : "Failed to delete"),
      type: response.success ? "success" : "error",
    });
    if (response.success) setSubStoryRefresh(true);
    setEditingIds((prev) => prev.filter((id) => id !== subStoryId));
  };

  const handleApprove = async (status) => {
    const response = await backendRequest({
      endpoint: BACKEND_ENDPOINT.approve_user_story(userStory.id),
      bodyData: { status, comments: "Approved via frontend" },
    });
    showToast({
      message: response.message ?? (response.success ? "Status updated" : "Failed"),
      type: response.success ? "success" : "error",
    });
    if (response.success) {
      setUserStoryPatch((prev) => ({ ...(prev || {}), approval_status: status, status: status === "approved" ? "completed" : "in_progress" }));
      revalidator.revalidate();
    }
  };

  // Deduplicate by user_id — same user may be a member in multiple departments
  const uniqueMembers = members.filter((m, idx, arr) => arr.findIndex((x) => x.user_id === m.user_id) === idx);
  const memberOptions = uniqueMembers.map((m) => ({ label: m?.user_details?.name || m?.user_details?.email || "Member", value: m.id }));

  const helperStoryFormFields = [
    { type: "text", name: "title", label: "Title" },
    { type: "textarea", name: "description", label: "Description", required: false },
    { type: "select", name: "assigned_to", label: "Assign To (must differ from parent assignee)", options: memberOptions, required: false },
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
    { type: "date", name: "due_date", label: "Due Date", required: false, validationName: "futureDate" },
  ];

  const subStoryColumns = [
    { field: "type", headerName: "Type", flex: 0.3, renderCell: (params) => <Chip label={(params.value || "story").toUpperCase()} size="small" color={params.value === "task" ? "secondary" : "default"} variant="outlined" /> },
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
      flex: 0.6,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={0.5}>
          <Chip label={(params.value || "").replace("_", " ")} color={statusColors[params.value] || "default"} size="small" />
        </Box>
      ),
    },
    {
      field: "assigned_to",
      headerName: "Assigned To",
      flex: 0.7,
      valueGetter: (value) => {
        const mem = uniqueMembers.find((m) => m.id === value);
        return mem ? mem.user_details?.name || mem.user_details?.email || "Unassigned" : "Unassigned";
      },
    },
    { field: "story_points", headerName: "Points", flex: 0.3 },
    { field: "live_status", headerName: "Timer", flex: 0.4, renderCell: (params) => (params.value === "running" ? <Chip label="Running" color="success" size="small" /> : "-") },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 160,
      flex: 0.5,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const row = params.row;
        const isEditing = editingIds.includes(row.id);
        const isLoading = !!subAdvanceLoading[row.id];
        const isRevertLoading = !!subRevertLoading[row.id];
        const STATUS_ORDER = ["defined", "in_progress", "review", "completed"];
        const nextStatus = STATUS_ORDER[STATUS_ORDER.indexOf(row.status) + 1];
        const canAdvance = nextStatus !== undefined && row.status !== "blocked";
        const canRevert = row.status !== "defined" && row.status !== "blocked";
        return (
          <Box display="flex" gap={0.5} alignItems="center">
            {canAdvance && (
              <Button size="small" variant="outlined" color="primary" disabled={isLoading} onClick={() => handleAdvanceStatus(row.id, true)} sx={{ minWidth: 0, px: 1, fontSize: "0.7rem" }} title={`Advance to ${(nextStatus || "").replace("_", " ")}`}>
                <ArrowForwardIcon fontSize="inherit" />
              </Button>
            )}
            {canRevert && (
              <Button size="small" variant="text" color="warning" sx={{ minWidth: 0, px: 0.5, fontSize: "0.65rem" }} disabled={isRevertLoading} title="Revert to previous status" onClick={() => handleRevertStatus(row.id, row.status, row.title, true)}>
                <UndoIcon fontSize="inherit" />
              </Button>
            )}
            <ActionColumn params={params} isEditing={isEditing} editAction={(r) => setEditSubDialog({ open: true, story: r })} deleteAction={(r) => handleDeleteSubStory(r.id)} />
          </Box>
        );
      },
    },
  ];

  // Compute completion from sub-stories (points-based)
  const subStories = userStory?.subStories || [];
  const totalSub = subStories.length;
  const completedSub = subStories.filter((s) => s.status === "completed").length;
  const totalPoints = subStories.reduce((sum, s) => sum + (Number(s.story_points) || 0), 0);
  const completedPoints = subStories.filter((s) => s.status === "completed").reduce((sum, s) => sum + (Number(s.story_points) || 0), 0);
  const completionPct = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  const createSubStoryFormFields = [
    {
      type: "select",
      name: "type",
      label: "Type",
      required: true,
      options: [
        { label: "Story", value: "story" },
        { label: "Task", value: "task" },
      ],
      defaultValue: "task", // Default to task for sub-items
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
    { type: "select", name: "assigned_to", label: "Assign To", options: memberOptions, required: false },
    { type: "text", name: "story_points", label: "Story Points", required: false, validationName: "number" },
    { type: "date", name: "due_date", label: "Due Date", required: false, validationName: "futureDate" },
  ];

  const editFormFields = [
    { type: "text", name: "title" },
    { type: "textarea", name: "description", label: "Description" },
    { type: "textarea", name: "acceptance_criteria", label: "Acceptance Criteria", required: false },
    {
      type: "select",
      name: "type",
      label: "Type",
      options: [
        { label: "Story", value: "story" },
        { label: "Task", value: "task" },
      ],
    },
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
    { type: "select", name: "assigned_to", label: "Assign To", options: memberOptions, required: false },
    { type: "text", name: "story_points", label: "Story Points", required: false, validationName: "number" },
    // Due date: locked once set (non-leads cannot change it)
    ...(userStory.due_date && !isTeamLead ? [{ type: "text", name: "due_date", label: "Due Date (locked — request change below)", disabled: true }] : [{ type: "date", name: "due_date", label: "Due Date", required: false, validationName: "futureDate" }]),
  ];

  return (
    <>
      <Box m="20px" mb="35px">
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Heading title={(userStory.type || "Story").toUpperCase() + ": " + userStory.title} subtitle={userStory.description || "-"} giveMarginBottom={false} />

          <Box display="flex" gap={1} flexWrap="wrap" justifyContent="flex-end">
            {/* Timer Controls — Stop always visible if running; Start disabled when completed */}
            {userStory.live_status === "running" ? (
              <Button variant="contained" color="error" size="small" onClick={handleStopTimer} disabled={timerLoading} startIcon={<StopIcon />} sx={{ height: 30 }}>
                Stop ({formatElapsed(elapsedSeconds)})
              </Button>
            ) : (
              <Button variant="contained" color="success" size="small" onClick={handleStartTimer} disabled={timerLoading || userStory.status === "completed"} startIcon={<PlayArrowIcon />} sx={{ height: 30 }} title={userStory.status === "completed" ? "Cannot start timer on a completed story" : ""}>
                Start Timer
              </Button>
            )}

            {/* Sequential Status Advance — hidden when sub-items exist (auto-managed) */}
            {totalSub === 0 &&
              (() => {
                const STATUS_ORDER = ["defined", "in_progress", "review", "completed"];
                const nextIdx = STATUS_ORDER.indexOf(userStory.status) + 1;
                const nextStatus = STATUS_ORDER[nextIdx];
                if (!nextStatus || userStory.status === "blocked") return null;
                return (
                  <Button variant="contained" color="primary" size="small" onClick={() => handleAdvanceStatus(userStory.id, false)} disabled={advanceLoading} startIcon={<ArrowForwardIcon />} sx={{ height: 30 }}>
                    → {nextStatus.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Button>
                );
              })()}

            {/* Status Revert — hidden when sub-items exist (auto-managed) */}
            {totalSub === 0 && userStory.status !== "defined" && (
              <Button variant="outlined" color="warning" size="small" onClick={() => handleRevertStatus(userStory.id, userStory.status, userStory.title, false)} disabled={revertLoading} startIcon={<UndoIcon />} sx={{ height: 30 }} title="Revert to previous status">
                Revert Status
              </Button>
            )}

            {/* Approval Workflow Buttons (for team leads on review) */}
            {userStory.status === "review" && isTeamLead && (
              <>
                <DoButton onclick={() => handleApprove("approved")} color="success">
                  Approve & Complete
                </DoButton>
                <DoButton onclick={() => handleApprove("rejected")} color="error">
                  Reject
                </DoButton>
              </>
            )}
            <DoButton onclick={() => setEditDialog(true)}>Edit</DoButton>
          </Box>
        </Box>

        {/* Meta info */}
        <Stack direction="row" spacing={2} mt={2} flexWrap="wrap">
          <Chip label={`Type: ${userStory.type || "story"}`} color={userStory.type === "task" ? "secondary" : "primary"} variant="outlined" />
          <Chip label={`Priority: ${userStory.priority}`} color={priorityColors[userStory.priority] || "default"} variant="outlined" />
          <Chip label={`Status: ${(userStory.status || "").replace("_", " ")}`} color={statusColors[userStory.status] || "default"} />
          {userStory.approval_status && userStory.approval_status !== "not_required" && <Chip label={`Approval: ${userStory.approval_status}`} color={approvalColors[userStory.approval_status]} variant="outlined" />}
          {userStory.story_points && <Chip label={`${userStory.story_points} pts`} variant="outlined" />}
          {userStory.due_date && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <Chip label={`Due: ${new Date(userStory.due_date).toLocaleDateString()}`} variant="outlined" icon={!isTeamLead ? <LockIcon /> : undefined} />
              {!isTeamLead && (
                <Button size="small" sx={{ fontSize: "0.65rem", py: 0, px: 0.5 }} onClick={() => openChangeReqDialog("due_date_change", userStory.id, userStory.title)}>
                  Request Change
                </Button>
              )}
            </Box>
          )}
          <Chip label={`Time Logged: ${formatTotalWorkTime(userStory.total_work_time)}`} color={userStory.live_status === "running" ? "success" : "default"} variant="outlined" icon={userStory.live_status === "running" ? <PlayArrowIcon /> : undefined} />
        </Stack>

        {/* Acceptance Criteria */}
        {userStory.acceptance_criteria && (
          <Box mt={2} p={2} bgcolor="action.hover" borderRadius={1}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Acceptance Criteria
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line">
              {userStory.acceptance_criteria}
            </Typography>
          </Box>
        )}

        {/* Completion bar */}
        {totalSub > 0 && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Sub-story completion: {completedPoints}/{totalPoints} pts ({completionPct}%)
            </Typography>
            <LinearProgress variant="determinate" value={completionPct} sx={{ height: 8, borderRadius: 4 }} />
          </Box>
        )}

        <EditDialog initialData={userStory} onSuccess={onEditSuccess} isOpen={editDialog} formFields={editFormFields} updateBackendEndpoint={BACKEND_ENDPOINT.update_user_story(userStory.id)} onClose={() => setEditDialog(false)} useFor="User Story" />
      </Box>

      {/* Sub Items (Tasks / Sub-Stories) section */}
      <Box m="20px">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Heading title="Sub Items & Tasks" level={2} />
          <DoButton onclick={() => setCreateSubStoryDialog(true)}>Add Sub Item</DoButton>
        </Box>

        <DataTable columns={subStoryColumns} fetchEndpoint={BACKEND_ENDPOINT.user_story_detail(userStory.id)} refresh={subStoryRefresh} setRefresh={setSubStoryRefresh} defaultPageSize={5} transformRows={(data) => data?.subStories || []} />
      </Box>

      <CreateDialog
        isOpen={createSubStoryDialog}
        onClose={() => setCreateSubStoryDialog(false)}
        usefor="Sub Item / Task"
        backendEndpoint={BACKEND_ENDPOINT.create_user_story(userStory.feature_id)}
        extraData={{
          parentUserStoryId: userStory.id,
          departmentId: userStory.department_id,
          projectId: userStory.project_id,
        }}
        onSuccess={() => {
          setSubStoryRefresh(true);
          revalidator.revalidate();
        }}
        formFields={createSubStoryFormFields}
      />

      <EditDialog
        isOpen={editSubDialog.open}
        formFields={editFormFields}
        updateBackendEndpoint={BACKEND_ENDPOINT.update_user_story(editSubDialog.story?.id)}
        onClose={() => setEditSubDialog({ open: false, story: {} })}
        onSuccess={() => {
          setSubStoryRefresh(true);
          setEditSubDialog({ open: false, story: {} });
          revalidator.revalidate();
        }}
        initialData={editSubDialog.story}
        useFor="Sub User Story"
      />

      {/* ─── Helper Stories Section ─────────────────────────────────────── */}
      <Box m="20px" mt={4}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Heading title="Helper Stories" level={2} />
          <DoButton onclick={() => setCreateHelperDialog(true)}>Request Help</DoButton>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Helper stories are separate work items where another team member assists with this story. They must accept before work begins.
        </Typography>

        {helperStories.length === 0 ? (
          <Typography variant="body2" color="text.disabled">
            No helper stories yet.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {helperStories.map((hs) => {
              const helperMember = uniqueMembers.find((m) => m.id === hs.assigned_to);
              const isLoading = !!helperActionLoading[hs.id];
              return (
                <Box key={hs.id} p={2} border="1px solid" borderColor="divider" borderRadius={1} display="flex" alignItems="center" gap={2} flexWrap="wrap">
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight={600}>
                      {hs.title}
                    </Typography>
                    {hs.description && (
                      <Typography variant="caption" color="text.secondary">
                        {hs.description}
                      </Typography>
                    )}
                  </Box>
                  <Chip label={hs.status?.replace("_", " ") || "pending"} color={hs.status === "in_progress" ? "primary" : hs.status === "reject" ? "error" : hs.status === "completed" ? "success" : "warning"} size="small" />
                  {helperMember && <Chip label={helperMember.user_details?.name || helperMember.user_details?.email || "Assigned"} size="small" variant="outlined" />}
                  {hs.status === "accept_pending" && (
                    <>
                      <Button size="small" variant="outlined" color="success" disabled={isLoading} onClick={() => handleAcceptRejectHelper(hs.id, "accept")}>
                        Accept
                      </Button>
                      <Button size="small" variant="outlined" color="error" disabled={isLoading} onClick={() => handleAcceptRejectHelper(hs.id, "reject")}>
                        Reject
                      </Button>
                    </>
                  )}
                  <Button size="small" variant="text" color="error" disabled={isLoading} onClick={() => handleRemoveHelper(hs.id)}>
                    Remove
                  </Button>
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>

      <CreateDialog
        isOpen={createHelperDialog}
        onClose={() => setCreateHelperDialog(false)}
        usefor="Helper Story"
        backendEndpoint={BACKEND_ENDPOINT.create_helper_story(userStory.id)}
        extraData={{ departmentId: userStory.department_id, projectId: userStory.project_id }}
        onSuccess={() => {
          setCreateHelperDialog(false);
          setHelperRefresh((p) => !p);
        }}
        formFields={helperStoryFormFields}
      />

      {/* ─── Dependencies Section ───────────────────────────────────────── */}
      <Box m="20px" mt={4}>
        <Heading title="Story Dependencies" level={2} />
        <Typography variant="body2" color="text.secondary" mb={2}>
          Link stories that must be completed before this story can proceed. Dependencies are informational — they help with planning and visibility.
        </Typography>

        {/* Add dependency */}
        <Box display="flex" gap={1} alignItems="center" mb={3}>
          <Autocomplete sx={{ minWidth: 320 }} size="small" options={depOptions} loading={depSearchLoading} value={depSearchValue} inputValue={depSearchInput} onInputChange={(_, v) => setDepSearchInput(v)} onChange={(_, v) => setDepSearchValue(v)} renderInput={(params) => <TextField {...params} label="Search stories to add as blocker…" />} isOptionEqualToValue={(opt, val) => opt.id === val.id} noOptionsText="No stories found" />
          <Button variant="contained" size="small" onClick={handleAddDependency} disabled={!depSearchValue}>
            Add Dependency
          </Button>
        </Box>

        {/* This story depends on (blockers) */}
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Blocked by (must be done before this story):
        </Typography>
        {dependencies.length === 0 ? (
          <Typography variant="body2" color="text.disabled" mb={2}>
            No blocking stories.
          </Typography>
        ) : (
          <Stack spacing={1} mb={3}>
            {dependencies.map((dep) => (
              <Box key={dep.id} p={1.5} border="1px solid" borderColor="divider" borderRadius={1} display="flex" alignItems="center" gap={2}>
                <Box flex={1}>
                  <Typography variant="body2" fontWeight={500}>
                    {dep.title}
                  </Typography>
                </Box>
                <Chip label={(dep.status || "").replace("_", " ") || "defined"} color={statusColors[dep.status] || "default"} size="small" />
                <Button size="small" variant="text" color="error" onClick={() => handleRemoveDependency(dep.id)}>
                  Remove
                </Button>
              </Box>
            ))}
          </Stack>
        )}

        {/* Stories blocked by this one */}
        {parentStories.length > 0 && (
          <>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Blocking (stories that depend on this):
            </Typography>
            <Stack spacing={1}>
              {parentStories.map((ps) => (
                <Box key={ps.id} p={1.5} border="1px solid" borderColor="warning.light" borderRadius={1} display="flex" alignItems="center" gap={2}>
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight={500}>
                      {ps.title}
                    </Typography>
                  </Box>
                  <Chip label={(ps.status || "").replace("_", " ") || "defined"} color={statusColors[ps.status] || "default"} size="small" />
                </Box>
              ))}
            </Stack>
          </>
        )}
      </Box>

      {/* ─── Change Requests Section ────────────────────────────────────── */}
      {(changeRequests.length > 0 || isTeamLead) && (
        <Box m="20px" mt={4}>
          <Heading title="Change Requests" level={2} />
          <Typography variant="body2" color="text.secondary" mb={2}>
            Due date and status revert requests that require team lead approval.
          </Typography>
          {changeRequests.length === 0 ? (
            <Typography variant="body2" color="text.disabled">
              No change requests.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {changeRequests.map((cr) => (
                <Box key={cr.id} p={2} border="1px solid" borderColor="divider" borderRadius={1} display="flex" alignItems="center" gap={2} flexWrap="wrap">
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight={600}>
                      {cr.request_type === "due_date_change" ? `Due date change → ${cr.requested_value?.due_date}` : `Status revert → ${(cr.requested_value?.target_status || "").replace("_", " ")}`}
                    </Typography>
                    {cr.review_comments && (
                      <Typography variant="caption" color="text.secondary">
                        {cr.review_comments}
                      </Typography>
                    )}
                  </Box>
                  <Chip label={cr.status} color={cr.status === "pending" ? "warning" : cr.status === "approved" ? "success" : "error"} size="small" />
                  {cr.status === "pending" && isTeamLead && (
                    <>
                      <Button size="small" variant="outlined" color="success" onClick={() => handleReviewChangeRequest(cr.id, "approved")}>
                        Approve
                      </Button>
                      <Button size="small" variant="outlined" color="error" onClick={() => handleReviewChangeRequest(cr.id, "rejected")}>
                        Reject
                      </Button>
                    </>
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      )}

      {/* ─── Change Request Dialog ───────────────────────────────────────── */}
      <Dialog open={changeReqDialog.open} onClose={() => setChangeReqDialog({ open: false, type: null, storyId: null, storyTitle: "" })} maxWidth="sm" fullWidth>
        <DialogTitle>{changeReqDialog.type === "due_date_change" ? "Request Due Date Change" : "Request Status Revert"}</DialogTitle>
        <DialogContent>
          {changeReqDialog.type === "due_date_change" && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Current due date: <strong>{userStory.due_date ? new Date(userStory.due_date).toLocaleDateString() : "None"}</strong>. Request a new date — the team lead will approve or reject.
              </Alert>
              <TextField label="New Due Date" type="date" fullWidth size="small" value={changeReqValue.due_date} onChange={(e) => setChangeReqValue((v) => ({ ...v, due_date: e.target.value }))} InputLabelProps={{ shrink: true }} sx={{ mb: 2 }} />
            </>
          )}
          {changeReqDialog.type === "status_revert" &&
            (() => {
              const storyCurrentStatus = changeReqDialog.currentStatus || userStory.status || "";
              const STATUS_ORDER = ["defined", "in_progress", "review", "completed"];
              const currentIdx = STATUS_ORDER.indexOf(storyCurrentStatus);
              const validTargets = STATUS_ORDER.slice(0, currentIdx); // only earlier statuses
              return (
                <>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Current status: <strong>{storyCurrentStatus.replace("_", " ")}</strong>. This story is completed — reverting requires team lead approval.
                  </Alert>
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Target Status</InputLabel>
                    <Select value={changeReqValue.target_status} label="Target Status" onChange={(e) => setChangeReqValue((v) => ({ ...v, target_status: e.target.value }))}>
                      {validTargets.map((s) => (
                        <MenuItem key={s} value={s}>
                          {s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </>
              );
            })()}
          <TextField label="Reason (optional)" multiline rows={2} fullWidth size="small" value={changeReqValue.reason} onChange={(e) => setChangeReqValue((v) => ({ ...v, reason: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangeReqDialog({ open: false, type: null, storyId: null, storyTitle: "" })}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitChangeRequest} disabled={changeReqLoading}>
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export async function userStoryFetchLoader({ params }) {
  const { id } = params;
  const endpoint = BACKEND_ENDPOINT.user_story_detail(id);
  const response = await backendRequest({
    endpoint,
    navigate: redirect,
  });

  if (response.status === 404 || response.status === 422) {
    throw new Response("User story not found", {
      status: 404,
      statusText: "User story not found",
    });
  }

  if (!response.ok) {
    throw new Error(response.message || "Failed to load user story");
  }
  return response;
}
