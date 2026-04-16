// Author: Gururaj
// Created: 14th Oct 2025
// Description: User Story list page with filtering by project, feature, and status.
// Version: 2.0.0
// Modified:

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { Link } from "react-router-dom";
import { Box, FormControl, InputLabel, LinearProgress, MenuItem, Select, Tooltip, Typography, Chip } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Heading from "../../../components/Heading";
import DoButton from "../../../components/button/DoButton";
import DataTable from "../../../components/tools/Datatable";
import CreateDialog from "../../../components/pms/CreateDialog";
import BACKEND_ENDPOINT, { paths } from "../../../util/urls";
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

const initialState = {
  projectsStatus: "idle",
  projects: [],
  projectId: "",
  refresh: false,
  features: [],
  selectedFeatureId: "",
};

function reducer(state, action) {
  switch (action.type) {
    case "workspaceCleared":
      return initialState;
    case "projectsLoading":
      return {
        ...state,
        projectsStatus: "loading",
        projects: [],
        projectId: "",
        features: [],
        selectedFeatureId: "",
      };
    case "projectsLoaded": {
      const projects = action.projects;
      const hasSelectedProject = projects.some((project) => project.id === state.projectId);
      return {
        ...state,
        projectsStatus: "ready",
        projects,
        projectId: hasSelectedProject ? state.projectId : projects[0]?.id || "",
        selectedFeatureId: hasSelectedProject ? state.selectedFeatureId : "",
        refresh: projects.length > 0,
      };
    }
    case "projectsFailed":
      return initialState;
    case "projectChanged":
      return {
        ...state,
        projectId: action.projectId,
        selectedFeatureId: "",
        refresh: true,
      };
    case "featuresCleared":
      return {
        ...state,
        features: [],
        selectedFeatureId: "",
      };
    case "featuresLoaded":
      return {
        ...state,
        features: action.features,
      };
    case "featureChanged":
      return {
        ...state,
        selectedFeatureId: action.featureId,
        refresh: true,
      };
    case "setRefresh":
      return {
        ...state,
        refresh: action.value,
      };
    default:
      return state;
  }
}

export default function UserStoryList() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id || "";
  const [state, dispatch] = useReducer(reducer, initialState);

  const [createDialog, setCreateDialog] = useState(false);
  const [members, setMembers] = useState([]);

  const fetchMembers = useCallback((projectId) => {
    if (projectId) {
      backendRequest({ endpoint: BACKEND_ENDPOINT.project_members(projectId) })
        .then((res) => {
          if (res.success) setMembers(res.data?.members?.data || []);
          else setMembers([]);
        })
        .catch(() => setMembers([]));
    } else {
      setMembers([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMembers(state.projectId);
  }, [state.projectId, fetchMembers]);

  useEffect(() => {
    if (!workspaceId) {
      dispatch({ type: "workspaceCleared" });
      return;
    }

    let ignore = false;
    dispatch({ type: "projectsLoading" });

    (async () => {
      const res = await backendRequest({
        endpoint: BACKEND_ENDPOINT.get_department_projects(workspaceId),
      });

      if (ignore) {
        return;
      }

      if (res?.success) {
        dispatch({ type: "projectsLoaded", projects: res.data || [] });
        return;
      }

      dispatch({ type: "projectsFailed" });
      showToast({ message: res.message || "Failed to fetch projects", type: "error" });
    })();

    return () => {
      ignore = true;
    };
  }, [workspaceId]);

  useEffect(() => {
    if (!state.projectId) {
      dispatch({ type: "featuresCleared" });
      return;
    }

    let ignore = false;

    (async () => {
      const res = await backendRequest({
        endpoint: BACKEND_ENDPOINT.project_features(state.projectId),
        querySets: "?perPage=9999&page=1",
      });

      if (!ignore && res?.success) {
        dispatch({ type: "featuresLoaded", features: res.data?.data || res.data?.rows || [] });
      }
    })();

    return () => {
      ignore = true;
    };
  }, [state.projectId]);

  const handleProjectChange = (id) => {
    dispatch({ type: "projectChanged", projectId: id });
  };

  const handleFeatureChange = (id) => {
    dispatch({ type: "featureChanged", featureId: id });
  };

  const handleRefreshChange = (value) => {
    dispatch({
      type: "setRefresh",
      value: typeof value === "function" ? value(state.refresh) : value,
    });
  };

  // Determine fetch endpoint: feature-scoped or project-scoped (memoized to keep stable object reference)
  const fetchEndpoint = useMemo(() => (state.selectedFeatureId ? BACKEND_ENDPOINT.user_stories_by_feature(state.selectedFeatureId) : state.projectId ? BACKEND_ENDPOINT.user_stories_by_project(state.projectId) : null), [state.selectedFeatureId, state.projectId]);

  // Stable string key derived from the endpoint so useEffect deps don't fire on every render
  const fetchEndpointKey = fetchEndpoint?.path ?? null;

  const [completionSummary, setCompletionSummary] = useState({ totalPoints: 0, completedPoints: 0 });

  useEffect(() => {
    if (!fetchEndpoint) {
      setCompletionSummary({ totalPoints: 0, completedPoints: 0 });
      return;
    }
    let ignore = false;
    (async () => {
      const res = await backendRequest({ endpoint: fetchEndpoint, querySets: "?page=1&perPage=9999" });
      if (ignore) return;
      const rows = res?.data?.data || res?.data?.rows || [];
      const totalPoints = rows.reduce((sum, s) => sum + (Number(s.story_points) || 0), 0);
      const completedPoints = rows.filter((s) => s.status === "completed").reduce((sum, s) => sum + (Number(s.story_points) || 0), 0);
      setCompletionSummary({ totalPoints, completedPoints });
    })();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchEndpointKey, state.refresh]);

  const completionPct = completionSummary.totalPoints > 0 ? Math.round((completionSummary.completedPoints / completionSummary.totalPoints) * 100) : 0;

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
      field: "assigned_to",
      headerName: "Assigned To",
      flex: 0.7,
      valueGetter: (value) => {
        const mem = members.find((m) => m.id === value);
        return mem ? mem.user_details?.name || mem.user_details?.email || "Unassigned" : "Unassigned";
      },
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.5,
      renderCell: (params) => {
        const color = statusColors[params.value] || "default";
        return <Chip label={(params.value || "").replace("_", " ")} color={color} size="small" />;
      },
    },
    {
      field: "approval_status",
      headerName: "Approval",
      flex: 0.5,
      renderCell: (params) => {
        // Show nothing if approval is not required or it's just 'not_required'
        if (!params.value || params.value === "not_required") return null;

        const color = approvalColors[params.value] || "default";
        return <Chip label={params.value.replace("_", " ")} color={color} size="small" variant="outlined" />;
      },
    },
    { field: "story_points", headerName: "Points", flex: 0.3 },
    {
      field: "feature",
      headerName: "Feature",
      flex: 0.7,
      valueGetter: (value) => value?.name ?? "",
      valueFormatter: (value) => formatTextForDataTable(value),
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 80,
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

  return (
    <Box p={2}>
      <Heading title="User Stories" subtitle="Track features through user stories and sub-stories" />

      <Box display="flex" alignItems="center" gap={2} mb={3}>
        {/* SELECT PROJECT */}
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Select Project</InputLabel>
          <Select value={state.projectId} label="Select Project" disabled={!workspaceId || state.projectsStatus === "idle"} onChange={(e) => handleProjectChange(e.target.value)}>
            {!workspaceId ? (
              <MenuItem disabled>Select department first</MenuItem>
            ) : state.projectsStatus === "loading" ? (
              <MenuItem disabled>Loading...</MenuItem>
            ) : !state.projects.length ? (
              <MenuItem disabled>No projects</MenuItem>
            ) : (
              state.projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        {/* SELECT FEATURE (optional filter) */}
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Filter by Feature</InputLabel>
          <Select value={state.selectedFeatureId} label="Filter by Feature" disabled={!state.projectId} onChange={(e) => handleFeatureChange(e.target.value)}>
            <MenuItem value="">All Features</MenuItem>
            {state.features.map((f) => (
              <MenuItem key={f.id} value={f.id}>
                {f.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {state.selectedFeatureId && (
          <DoButton onclick={() => setCreateDialog(true)} variant="text">
            Create User Story
          </DoButton>
        )}
      </Box>

      {fetchEndpoint && completionSummary.totalPoints > 0 && (
        <Box mb={2}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
            <Typography variant="body2" color="text.secondary">
              Completion: {completionSummary.completedPoints} / {completionSummary.totalPoints} pts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {completionPct}%
            </Typography>
          </Box>
          <Tooltip title={`${completionSummary.completedPoints} / ${completionSummary.totalPoints} pts completed`}>
            <LinearProgress variant="determinate" value={completionPct} sx={{ height: 8, borderRadius: 4 }} />
          </Tooltip>
        </Box>
      )}

      {fetchEndpoint ? (
        <DataTable columns={displayColumns} fetchEndpoint={fetchEndpoint} refresh={state.refresh} setRefresh={handleRefreshChange} defaultPageSize={10} />
      ) : (
        <Typography textAlign="center" mt={10} color="text.secondary" fontSize={18}>
          Select a workspace and project to view user stories.
        </Typography>
      )}

      {state.selectedFeatureId && <CreateDialog isOpen={createDialog} onClose={() => setCreateDialog(false)} usefor="User Story" backendEndpoint={BACKEND_ENDPOINT.create_user_story(state.selectedFeatureId)} extraData={{ departmentId: workspaceId, projectId: state.projectId }} onSuccess={() => dispatch({ type: "setRefresh", value: true })} formFields={formFields} />}
    </Box>
  );
}
