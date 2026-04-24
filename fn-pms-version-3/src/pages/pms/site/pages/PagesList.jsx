// Author: Copilot
// Description: Pages list for Site-type projects — global view across departments.
// Version: 2.0.0

import { Link, useSearchParams } from "react-router-dom";
import BACKEND_ENDPOINT, { paths } from "../../../../util/urls";
import { useCallback, useEffect, useState } from "react";
import { Box, Chip, FormControl, InputLabel, LinearProgress, MenuItem, Select, Tooltip, Typography } from "@mui/material";
import { Button } from "@mui/material";
import Heading from "../../../../components/Heading";
import GlobalComponentsPanel from "../../../pms/projects/pages/GlobalComponentsPanel";
import DoButton from "../../../../components/button/DoButton";
import DataTable from "../../../../components/tools/Datatable";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CreateDialog from "../../../../components/pms/CreateDialog";
import { useWorkspace } from "../../../../context/WorkspaceContext";
import backendRequest from "../../../../util/request";
import { showToast } from "../../../../util/feedback/ToastService";
import WebIcon from "@mui/icons-material/Web";

const displayColumns = [
  { field: "name", headerName: "Name", flex: 1 },
  { field: "description", headerName: "Description", flex: 1 },
  { field: "status", headerName: "Status", flex: 0.4 },
  { field: "priority", headerName: "Priority", flex: 0.4 },
  {
    field: "assignee_id",
    headerName: "Assigned To",
    flex: 0.5,
    renderCell: (params) =>
      params.row.assignee_details?.name ? (
        <Chip label={params.row.assignee_details.name} size="small" color="info" variant="outlined" />
      ) : params.value ? (
        <Chip label="Assigned" size="small" color="info" variant="outlined" />
      ) : (
        <Typography variant="caption" color="text.disabled">Unassigned</Typography>
      ),
  },
  {
    field: "page_progress",
    headerName: "Complete",
    flex: 0.4,
    sortable: false,
    renderCell: (params) => {
      const pct = params.value ?? 0;
      const completed = params.row.page_completed_items ?? 0;
      const total = params.row.page_total_items ?? 0;
      return (
        <Tooltip title={`${completed}/${total} items`}>
          <Typography
            variant="caption"
            fontWeight="bold"
            color={pct === 100 ? "success.main" : pct > 0 ? "primary.main" : "text.disabled"}
          >
            {total === 0 ? "—" : `${pct}%`}
          </Typography>
        </Tooltip>
      );
    },
  },
  {
    field: "page_total_work_time",
    headerName: "Time Logged",
    flex: 0.45,
    sortable: false,
    renderCell: (params) => {
      const mins = params.value ?? 0;
      if (!mins) return <Typography variant="caption" color="text.disabled">—</Typography>;
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return (
        <Typography variant="caption" color="text.secondary">
          {h > 0 ? `${h}h ${m}m` : `${m}m`}
        </Typography>
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
        <Button component={Link} to={paths.page_detail(params.row.id).actualPath} variant="text" size="small" startIcon={<VisibilityIcon />} sx={{ textTransform: "none", borderRadius: 2 }} />
      </Box>
    ),
  },
];

const getFormFields = (projectId, departmentId) => [
  { type: "text", name: "name", label: "Name" },
  { type: "textarea", name: "description", label: "Description", require: false },
  {
    type: "member_picker",
    name: "assignee_id",
    label: "Assign To",
    required: false,
    projectId,
    departmentId,
  },
];

export default function PagesList() {
  const { currentWorkspace } = useWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlProjectId = searchParams.get("projectId");

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(urlProjectId || "");
  const [refresh, setRefresher] = useState(false);
  const [createFormDialog, setCreateFormDialog] = useState(false);
  const [projectProgress, setProjectProgress] = useState(null);

  // Load site-type projects for the current department workspace
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
        const list = (res.data || []).filter((p) => p.type === "site");
        setProjects(list);
        if (urlProjectId && list.some((p) => p.id === urlProjectId)) {
          setSelectedProjectId(urlProjectId);
        } else if (list.length > 0) {
          setSelectedProjectId((prev) => prev || list[0].id);
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

  // Trigger DataTable refresh whenever selected project changes
  useEffect(() => {
    if (selectedProjectId) setRefresher(true);
  }, [selectedProjectId]);

  // Fetch project progress whenever selected project changes or pages refresh
  useEffect(() => {
    if (!selectedProjectId) { setProjectProgress(null); return; }
    backendRequest({ endpoint: BACKEND_ENDPOINT.project_progress(selectedProjectId) })
      .then((res) => { if (res?.success) setProjectProgress(res.data); else setProjectProgress(null); });
  }, [selectedProjectId, refresh]);

  return (
    <Box m="20px">
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Heading title="Pages" subtitle="Site project pages" giveMarginBottom={false} />
        {selectedProjectId && (
          <DoButton onclick={() => setCreateFormDialog(true)}>Create Page</DoButton>
        )}
      </Box>

      {currentWorkspace?.id ? (
        <>
          <Box mb={2}>
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel>Select Project</InputLabel>
              <Select
                value={selectedProjectId}
                label="Select Project"
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedProjectId(newId);
                  setSearchParams({ projectId: newId });
                  setRefresher(true);
                }}
              >
                {projects.length === 0 ? (
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">No site projects available</Typography>
                  </MenuItem>
                ) : (
                  projects.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      <Box display="flex" alignItems="center" gap={1} width="100%">
                        <WebIcon fontSize="small" color="action" />
                        <span style={{ flex: 1 }}>{p.name}</span>
                        <Chip label="Site" size="small" color="success" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Box>

          {selectedProjectId ? (
            <>
              {projectProgress && (
                <Box mb={2} maxWidth={480}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      Project Progress ({projectProgress.completedItems}/{projectProgress.totalItems} items)
                    </Typography>
                    <Typography variant="caption" fontWeight="bold">{projectProgress.progress}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={projectProgress.progress}
                    color={projectProgress.progress === 100 ? "success" : "primary"}
                    sx={{ borderRadius: 1, height: 8 }}
                  />
                </Box>
              )}
              <DataTable
                columns={displayColumns}
                fetchEndpoint={BACKEND_ENDPOINT.pages_by_project_dept(selectedProjectId, currentWorkspace.id)}
                refresh={refresh}
                setRefresh={setRefresher}
              />
              <CreateDialog
                formFields={getFormFields(selectedProjectId, currentWorkspace?.id)}
                isOpen={createFormDialog}
                onClose={() => setCreateFormDialog(false)}
                usefor="Page"
                onSuccess={() => {
                  setCreateFormDialog(false);
                  setRefresher(true);
                }}
                backendEndpoint={BACKEND_ENDPOINT.create_page(currentWorkspace.id)}
                extraData={{ projectId: selectedProjectId }}
              />

              {/* Global Components for the selected project */}
              <Box mt={4}>
                <GlobalComponentsPanel projectId={selectedProjectId} />
              </Box>
            </>
          ) : (
            <Box mt={6} display="flex" flexDirection="column" alignItems="center" gap={2}>
              <WebIcon sx={{ fontSize: 48, color: "text.disabled" }} />
              <Typography variant="h6" color="text.secondary">No site projects yet</Typography>
              <Typography variant="body2" color="text.disabled" textAlign="center" maxWidth={340}>
                Site projects manage website pages, sections, and components.
                Create one from the{" "}
                <Button component={Link} to="/projects" variant="text" size="small" sx={{ p: 0, textTransform: "none", verticalAlign: "baseline" }}>
                  Projects
                </Button>
                {" "}page and set the type to <strong>Site</strong>.
              </Typography>
            </Box>
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

