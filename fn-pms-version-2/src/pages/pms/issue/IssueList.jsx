import { useState, useEffect } from "react";
import { Box, Button, Typography, MenuItem, Select, FormControl, InputLabel, useTheme, CircularProgress } from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DataTable from "../../../components/tools/Datatable";
import BACKEND_ENDPOINT from "../../../util/urls";
import backendRequest from "../../../util/request";
import { colorCodes } from "../../../theme";
import Heading from "../../../components/Heading";
import CreateDialog from "../../../components/pms/CreateDialog";
import { showToast } from "../../../util/feedback/ToastService";
import CreateIssueDialog from "./CreateIssueDialog";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import AddTaskIcon from '@mui/icons-material/AddTask';
import HistoryIcon from '@mui/icons-material/History';
import IssueHistoryDialog from "./IssueHistoryDialog";
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import { formatTextForDataTable } from "../../../util/helper";
import { useSearchParams } from "react-router-dom";
import DoButton from "../../../components/button/DoButton";
import { useWorkspace } from "../../../context/WorkspaceContext";

export default function IssuesPage() {

  // PROJECTS (based on department)
  const [projects, setProjects] = useState("idle");
  const [projectId, setProjectId] = useState("");

  // currently modifing or request sent ids
  const [editingIds, setEditingIds] = useState([]);
  const [editIssueId, setEditIssueId] = useState(false);
  
  // data table refresh state
  const [dataTableRefresh, setDataTableRefresh] = useState(true);

  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);

  // serach paramaters for project 
  const [searchParams, setSearchParams] = useSearchParams();

  const { workspaces, currentWorkspace, selectWorkspace, loading, isAdmin } = useWorkspace();
  const hasIssueAccess = currentWorkspace.name === 'testing'; // to-do later correct validation
  
  // to remove the selected project when project change and workspace change
  useEffect(() => {
    if (!Array.isArray(projects)) return;

    if (projects.length === 0) {
      setProjectId("");
      return;
    }

    // If current project doesn't exist in new list, select first
    const exists = projects.some((p) => p.id === projectId);

    if (!exists) {
      setProjectId(projects[0].id);
    }
  }, [projects]);


  

  const handleAcceptIssue = async (issueId) => {
    setEditingIds((prev) => [...prev, issueId]);
    const response = await backendRequest({ endpoint: BACKEND_ENDPOINT.accept_issue(issueId) });
    if (response.success) {
      setDataTableRefresh(true);
    }
    showToast({ message: response.message ?? (response.success ? "Issue Accepted successfully" : "Failed to Accept Issue"), type: response.success ? "success" : "error" });

    setEditingIds((prev) => prev.filter((id) => id !== issueId)); // remove after done
  };

  const handleIssueFinilize = async (issueId, status) => {
    setEditingIds((prev) => [...prev, issueId]);
    const response = await backendRequest({ endpoint: BACKEND_ENDPOINT.issue_finilize(issueId), bodyData: {status} });
    if (response.success) {
      setDataTableRefresh(true);
    }
    showToast({ message: response.message ?? (response.success ? "Issue Completed successfully" : "Failed to Update"), type: response.success ? "success" : "error" });

    setEditingIds((prev) => prev.filter((id) => id !== issueId)); // remove after done
  };

  const handleCompleteIssue = async (issueId) => {
    setEditingIds((prev) => [...prev, issueId]);
    const response = await backendRequest({ endpoint: BACKEND_ENDPOINT.issue_fixed(issueId) });
    if (response.success) {
      setDataTableRefresh(true);
    }
    showToast({ message: response.message ?? (response.success ? "Issue Updated successfully" : "Failed to Update Issue"), type: response.success ? "success" : "error" });
    setEditingIds((prev) => prev.filter((id) => id !== issueId)); // remove after done
  };


  const handleProjectChange = (id) => {
    setProjectId(id);
    setDataTableRefresh(true);

    setSearchParams({
      department: currentWorkspace?.id,
      project: id,
    });

  };



  useEffect(() => {
    if (!currentWorkspace?.id) {
      setProjects("idle");
      setProjectId("");
      return;
    }

    (async () => {
      setProjects("loading");

      const res = await backendRequest({
        endpoint: BACKEND_ENDPOINT.get_department_projects(currentWorkspace?.id),
      });

      if (res?.success) {
        const list = res.data || [];
        setProjects(list);
      } else {
        setProjects("idle");
        showToast({ message: res.message || "Failed to fetch projects", type: "error" });
      }
    })();
  }, [currentWorkspace?.id]);

  const [openCreate, setOpenCreate] = useState(false);

  const columns = [
    { field: "title", headerName: "Title", flex: 1, valueFormatter: ( value ) => formatTextForDataTable(value) },
    { field: "description", headerName: "Description", flex: 1, valueFormatter: ( value ) => formatTextForDataTable(value) },
    { field: "type", headerName: "Type", flex: 0.6, filterable: false, sortable: false, valueGetter: (type) => type?.name ?? "", valueFormatter: ( value ) => formatTextForDataTable(value) },
    { field: "priority", headerName: "Priority", flex: 0.6, valueFormatter: ( value ) => formatTextForDataTable(value) },
    { field: "status", headerName: "Status", flex: 0.6, valueFormatter: ( value ) => formatTextForDataTable(value) },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 130,
      flex: 0.5,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const isEditing = editingIds.includes(params.row.id);

        return (
          <Box display="flex" gap="5px" alignItems="center">
            <Box title="History">
              <HistoryIcon
                onClick={() => {
                  setEditIssueId({id : params.row.id, for : "history" })
                }}
                sx={{
                  cursor: "pointer",
                  color: colors.text.light,
                  "&:hover": { color: colors.primary.dark },
                }}
              />
            </Box>
            {isEditing ? (
              <CircularProgress size={20} />
            ) : (
              ((params.row.status === "open" || params.row.status === "re_open")&& !hasIssueAccess) ? (
                <>
                  <Box title="Accept">
                    <CheckCircleIcon
                      onClick={() => {
                        handleAcceptIssue(params.row.id);
                      }}
                      sx={{
                        cursor: "pointer",
                        color: colors.text.light,
                        "&:hover": { color: colors.primary.dark },
                      }}
                    />
                  </Box>
                  <Box title="Reject">
                    <CancelIcon
                      onClick={() => {setEditIssueId({id : params.row.id, for : "reject" })}}
                      sx={{
                        cursor: "pointer",
                        color: colors.error.light,
                        "&:hover": { color: colors.error.dark },
                      }}
                    />
                  </Box>
                </>
              ):
              (params.row.status === "in_progress" && !hasIssueAccess) ? (
                <>
                  <Box title="Create Task">
                    <AddCircleIcon
                      onClick={() => {
                        setEditIssueId({id : params.row.id, for : "task"});
                      }}
                      sx={{
                        cursor: "pointer",
                        color: colors.text.light,
                        "&:hover": { color: colors.primary.dark },
                      }}
                    />
                  </Box>
                  <Box title="Complete Fixing">
                    <AddTaskIcon
                      onClick={() => {
                        handleCompleteIssue(params.row.id);
                      }}
                      sx={{
                        cursor: "pointer",
                        color: colors.text.light,
                        "&:hover": { color: colors.primary.dark },
                      }}
                    />
                  </Box>
                </>
              ) :
              ((params.row.status === "resolved" || params.row.status === "reject") && hasIssueAccess ) && (
                <>
                {params.row.status === "resolved" && (
                  <Box title="Issue Verified and Fixed">
                    <VerifiedUserIcon
                      onClick={() => {
                        handleIssueFinilize(params.row.id, "closed");
                      }}
                      sx={{
                        cursor: "pointer",
                        color: colors.text.light,
                        "&:hover": { color: colors.primary.dark },
                      }}
                    />
                  </Box>
                )}
                  <Box title="Issue not Fixed">
                    <NewReleasesIcon
                      onClick={() => {
                        setEditIssueId({id : params.row.id, for : "reopen"});
                      }}
                      sx={{
                        cursor: "pointer",
                        color: colors.text.light,
                        "&:hover": { color: colors.primary.dark },
                      }}
                    />
                  </Box>
                </>
              )
            )}
          </Box>
        );
      },
    },
  ];

  console.log(projectId);

  return (
    <Box p={2}>
      <Heading title={"Issues"} />

      {/* --------------------------------------- */}
      {/* FILTER BAR */}
      {/* --------------------------------------- */}

      <Box display="flex" alignItems="center" justifyContent={"space-between"} gap={2} >
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          
          {/* SELECT PROJECT */}
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Select Project</InputLabel>
            <Select value={projectId} label="Select Project" disabled={!currentWorkspace?.id || projects === "idle"} onChange={(e) => handleProjectChange(e.target.value)}>
              {!currentWorkspace?.id ? (
                <MenuItem disabled>Select department first</MenuItem>
              ) : projects === "loading" ? (
                <MenuItem disabled>Loading...</MenuItem>
              ) : !Array.isArray(projects) || !projects.length ? (
                <MenuItem disabled>No projects in this department</MenuItem>
              ) : (
                projects.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
              {
                (hasIssueAccess) && 
                <>{/* CREATE ISSUE */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            disabled={!projectId}
            onClick={() => setOpenCreate(true)}
            sx={{
              backgroundColor: colors.primary.main,
              "&:hover": { backgroundColor: colors.primary.dark },
            }}
          >
            Create Issue
          </Button>
                </>
              }
          
        </Box>
        {searchParams.get("issue") && <DoButton onclick={
            () => {
              setSearchParams((prev) => {
                // prev.set("department", departmentId);
                // prev.set("project", projectId);
                prev.set("issue", "");
                return prev;
              });
              setDataTableRefresh(true);
            }
        } >Remove Filter</DoButton>}
      </Box>

      

      {/* --------------------------------------- */}
      {/* ISSUES TABLE */}
      {/* --------------------------------------- */}
      {projectId ? (
        <DataTable columns={columns} fetchEndpoint={BACKEND_ENDPOINT.issues(projectId, searchParams.get("issue"))} defaultPageSize={10} refresh={dataTableRefresh} setRefresh={setDataTableRefresh} />
      ) : (
        <Typography textAlign="center" mt={10} color="text.secondary" fontSize={18}>
          Select a Workspace and project to view issues.
        </Typography>
      )}

      <CreateIssueDialog
        isOpen={openCreate && projectId}
        onClose={() => setOpenCreate(false)}
        fromDepartmentId={currentWorkspace?.id}
        projectId={projectId}
        onSuccess={() => {
          setDataTableRefresh(true);
        }}
      />

      <CreateDialog 
        isOpen={!!editIssueId.id && editIssueId.for === "reject"} 
        onClose={() => {setEditIssueId(false)}} 
        usefor={"Reject Issue"} 
        backendEndpoint={BACKEND_ENDPOINT.reject_issue(editIssueId.id)} 
        onSuccess={() => setDataTableRefresh(true)}
        formFields={[{ type: "textarea", name: "reject_reason", label: "Reason", require: true }]}
        useOnlyGivenName={true}
      />

      {/* for issue reopen reason */}
      <CreateDialog 
        isOpen={!!editIssueId.id && editIssueId.for === "reopen"} 
        onClose={() => {setEditIssueId(false)}} 
        usefor={"Re-Open Issue"} 
        backendEndpoint={BACKEND_ENDPOINT.issue_finilize(editIssueId.id)} 
        onSuccess={() => setDataTableRefresh(true)}
        formFields={[{ type: "textarea", name: "comment", label: "Comment", require: true }]}
        useOnlyGivenName={true}
        extraData={{status : "reopen"}}
      />

      <CreateDialog 
        isOpen={!!editIssueId.id && editIssueId.for === "task"} 
        onClose={() => {setEditIssueId(false)}} 
        usefor={"Task"} 
        backendEndpoint={BACKEND_ENDPOINT.create_issue_task(editIssueId.id)} 
        formFields={IssueTaskFields}
      />

      <IssueHistoryDialog 
        open={!!editIssueId.id && editIssueId.for === "history"} 
        onClose={() => {setEditIssueId(false)}} 
        issueId={editIssueId.id}
      />
    </Box>


  );
}

const IssueTaskFields = [
  { type: "text", name: "title" },
  { type: "textarea", name: "description", label: "Description",},
  { type: "select", name: "priority", options : [ {label : "High", value : "high", },{label : "Medium", value : "medium", },{label : "Low", value : "low", }, ]},
  { type: "date", name: "due_date", label: "Due Date", validationName : "futureDate"},
];

