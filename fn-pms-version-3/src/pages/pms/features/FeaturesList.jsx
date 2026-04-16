// Author: Gururaj
// Created: 19th Jun 2025
// Description: Features list page with search and filter controls for global feature discovery.
// Version: 1.0.0
// Modified:

import { Link, useSearchParams } from "react-router-dom";
import BACKEND_ENDPOINT, { paths } from "../../../util/urls";
import { useCallback, useEffect, useState } from "react";
import { Box, Button, FormControl, InputLabel, LinearProgress, MenuItem, Select, Tooltip, Typography } from "@mui/material";
import Heading from "../../../components/Heading";
import DoButton from "../../../components/button/DoButton";
import DataTable from "../../../components/tools/Datatable";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CreateDialog from "../../../components/pms/CreateDialog";
import { useWorkspace } from "../../../context/WorkspaceContext";
import backendRequest from "../../../util/request";
import { showToast } from "../../../util/feedback/ToastService";

const displayColumns = [
  { field: "name", headerName: "Name", flex: 1 },
  { field: "description", headerName: "Overview", flex: 1 },
  { field: "user_stories_count", headerName: "User Stories", flex: 0.4, filterable: false },
  {
    field: "total_points",
    headerName: "Completion",
    flex: 0.8,
    sortable: false,
    filterable: false,
    renderCell: (params) => {
      const total = Number(params.row.total_points) || 0;
      const completed = Number(params.row.completed_points) || 0;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      return (
        <Tooltip title={`${completed} / ${total} pts`}>
          <Box width="100%" display="flex" alignItems="center" gap={1}>
            <LinearProgress variant="determinate" value={pct} sx={{ flex: 1, height: 8, borderRadius: 4 }} />
            <Typography variant="caption" sx={{ minWidth: 32 }}>
              {pct}%
            </Typography>
          </Box>
        </Tooltip>
      );
    },
  },
  {
    field: "actions",
    headerName: "Actions",
    minWidth: 100,
    flex: 0.2,
    sortable: false,
    filterable: false,
    renderCell: (params) => (
      <Box display="flex" justifyContent="center" alignItems="center" width="100%" height="100%">
        <Button component={Link} to={paths.feature_detail(params.row.id).actualPath} variant="text" size="small" startIcon={<VisibilityIcon />} sx={{ textTransform: "none", borderRadius: 2 }} />
      </Box>
    ),
  },
];

const formFields = [
  { type: "text", name: "name" },
  { type: "textarea", name: "description", label: "Description", require: false },
];

export default function FeaturesList() {
  const { currentWorkspace } = useWorkspace();
  const [searchParams] = useSearchParams();
  const urlProjectId = searchParams.get("projectId");

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(urlProjectId || "");
  const [refresh, setRefresher] = useState(false);
  const [createFormDialog, setCreateFormDialog] = useState(false);
  const [projectCompletion, setProjectCompletion] = useState({ totalPoints: 0, completedPoints: 0 });

  useEffect(() => {
    if (!selectedProjectId) {
      setProjectCompletion({ totalPoints: 0, completedPoints: 0 });
      return;
    }
    let ignore = false;
    (async () => {
      const res = await backendRequest({ endpoint: BACKEND_ENDPOINT.user_stories_by_project(selectedProjectId), querySets: "?page=1&perPage=9999" });
      if (ignore) return;
      const rows = res?.data?.data || res?.data?.rows || [];
      const totalPoints = rows.reduce((sum, s) => sum + (Number(s.story_points) || 0), 0);
      const completedPoints = rows.filter((s) => s.status === "completed").reduce((sum, s) => sum + (Number(s.story_points) || 0), 0);
      setProjectCompletion({ totalPoints, completedPoints });
    })();
    return () => {
      ignore = true;
    };
  }, [selectedProjectId, refresh]);

  // Load projects for current workspace/department
  const fetchProjects = useCallback(
    async (workspaceId) => {
      if (!workspaceId) {
        setProjects([]);
        setSelectedProjectId("");
        return;
      }
      const res = await backendRequest({
        endpoint: BACKEND_ENDPOINT.get_department_projects(workspaceId),
      });
      if (res?.success) {
        const list = res.data || [];
        setProjects(list);
        // Prefer the URL projectId; fall back to first project in the list
        if (urlProjectId && list.some((p) => p.id === urlProjectId)) {
          setSelectedProjectId(urlProjectId);
        } else if (list.length > 0) {
          setSelectedProjectId(list[0].id);
        }
      } else {
        showToast({ message: res.message || "Failed to load projects", type: "error" });
        setProjects([]);
        setSelectedProjectId("");
      }
    },
    [urlProjectId],
  );

  useEffect(() => {
    setSelectedProjectId("");
    setProjects([]);
    fetchProjects(currentWorkspace?.id);
  }, [currentWorkspace?.id, fetchProjects]);

  // Refresh table whenever selected project changes
  useEffect(() => {
    if (selectedProjectId) setRefresher(true);
  }, [selectedProjectId]);

  return (
    <Box m="20px">
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Heading title="Features" level={2} />
        {selectedProjectId && (
          <DoButton onclick={() => setCreateFormDialog(true)} variant="text">
            Create New
          </DoButton>
        )}
      </Box>

      {/* Project selector */}
      {currentWorkspace?.id ? (
        <>
          <Box mb={2}>
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel>Select Project</InputLabel>
              <Select
                value={selectedProjectId}
                label="Select Project"
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                }}
              >
                {projects.length === 0 ? (
                  <MenuItem disabled>No projects available</MenuItem>
                ) : (
                  projects.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Box>

          {selectedProjectId && projectCompletion.totalPoints > 0 && (
            <Box mb={2}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Project completion: {projectCompletion.completedPoints} / {projectCompletion.totalPoints} pts
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round((projectCompletion.completedPoints / projectCompletion.totalPoints) * 100)}%
                </Typography>
              </Box>
              <Tooltip title={`${projectCompletion.completedPoints} / ${projectCompletion.totalPoints} pts completed`}>
                <LinearProgress variant="determinate" value={Math.round((projectCompletion.completedPoints / projectCompletion.totalPoints) * 100)} sx={{ height: 8, borderRadius: 4 }} />
              </Tooltip>
            </Box>
          )}

          {selectedProjectId ? (
            <>
              <DataTable columns={displayColumns} fetchEndpoint={BACKEND_ENDPOINT.project_features(selectedProjectId)} refresh={refresh} setRefresh={setRefresher} />
              <CreateDialog
                formFields={formFields}
                isOpen={createFormDialog}
                onClose={() => setCreateFormDialog(false)}
                usefor="Feature"
                onSuccess={() => {
                  setCreateFormDialog(false);
                  setRefresher(true);
                }}
                backendEndpoint={BACKEND_ENDPOINT.add_feature_to_project(currentWorkspace.id)}
                extraData={{ projectId: selectedProjectId }}
              />
            </>
          ) : (
            <Typography color="text.secondary" mt={4} textAlign="center">
              Select a project to view features.
            </Typography>
          )}
        </>
      ) : (
        <Typography color="text.secondary" mt={4} textAlign="center">
          Select a workspace first.
        </Typography>
      )}
    </Box>
  );
}
