import BACKEND_ENDPOINT from "../../../../util/urls";
import { useState } from "react";
import DataTable from "../../../../components/tools/Datatable";
import { Box, CircularProgress, useTheme } from "@mui/material";
import EditDialog from "../../../../components/pms/EditDialog";
import { colorCodes } from "../../../../theme";
import { showConfirmDialog } from "../../../../util/feedback/ConfirmService";
import EditIcon from "@mui/icons-material/ModeEditOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import { showToast } from "../../../../util/feedback/ToastService";
import backendRequest from "../../../../util/request";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import CreateHelperTask from "./CreateHelperTask";
import AddIcon from "@mui/icons-material/Add";
import Badge from "@mui/material/Badge";
import EmojiPeopleIcon from "@mui/icons-material/EmojiPeople";
import TaskDependenciesDialog from "./TaskDependenciesDialog";
import TimerIcon from "@mui/icons-material/Timer";
import LowPriorityIcon from "@mui/icons-material/LowPriority";
import DependencyTaskCreateDialog from "./DependencyTaskCreateDialog";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const taskFilter = [
  { label: "On Going", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Pending", value: "approved" },
  { label: "Blocked", value: "blocked" },
  { label: "Assign Pending", value: "assign_pending" },
  { label: "Approve Pending", value: "approve_pending" },
];

const updateFormFields = [
  { type: "textarea", name: "description", label: "Description" },
  {
    type: "select",
    name: "priority",
    options: [
      { label: "High", value: "high" },
      { label: "Medium", value: "medium" },
      { label: "Low", value: "low" },
    ],
  },
];

export default function MyTaskList({ typeFilter, refreshCurrentTask, setRefreshCurrentTask = () => {}, userProjects = [] }) {
  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);

  const [refresh, setRefresher] = useState(true);
  const [openHelperTask, setOpenHelperTask] = useState(false);
  const [taskDependencyDialog, setTaskDependencyDialog] = useState(null);

  const [editDialog, setEditDialog] = useState({ open: false, task: null, type: null });
  const [editingIds, setEditingIds] = useState([]);

  let dependencyClickTimer = null;

  const handleStartTask = async (taskId) => {
    setEditingIds((prev) => [...prev, taskId]);
    const response = await backendRequest({ endpoint: BACKEND_ENDPOINT.start_task(taskId) });
    if (response.success) {
      setRefresher(true);
      setRefreshCurrentTask(true);
    } else showToast({ message: response.message || "Failed to start Task", type: "error" });
    setEditingIds((prev) => prev.filter((id) => id !== taskId)); // remove after done
  };

  const handleStopTask = async (taskId) => {
    setEditingIds((prev) => [...prev, taskId]);
    const response = await backendRequest({ endpoint: BACKEND_ENDPOINT.stop_task });
    if (response.success) {
      setRefresher(true);
      setRefreshCurrentTask(true);
    } else showToast({ message: response.message || "Failed to Stop Task", type: "error" });
    setEditingIds((prev) => prev.filter((id) => id !== taskId)); // remove after done
  };

  const handleCompleteTask = async (taskId) => {
    setEditingIds((prev) => [...prev, taskId]);
    const response = await backendRequest({ endpoint: BACKEND_ENDPOINT.complete_task(taskId) });
    if (response.success) {
      setRefresher(true);
      setRefreshCurrentTask(true);
    } else showToast({ message: response.message || "Failed to Complete Task", type: "error" });
    setEditingIds((prev) => prev.filter((id) => id !== taskId)); // remove after done
  };

  const handleDeleteTask = async (taskId) => {
    setEditingIds((prev) => [...prev, taskId]);
    const response = await deleteTaskRequest(taskId);
    if (response.success) {
      setRefresher(true);
      setRefreshCurrentTask(true);
    }
    setEditingIds((prev) => prev.filter((id) => id !== taskId)); // remove after done
  };

  const displayColumns = [
    { field: "project_id", headerName: "Project", flex: 1, renderCell: (params) => params.row.project?.name, type: "singleSelect", valueOptions: userProjects },
    { field: "title", headerName: "Title", flex: 1 },
    { field: "description", headerName: "Discription", flex: 1 },
    { field: "department_id", headerName: "Department", flex: 1 },
    { field: "priority", headerName: "Priority", flex: 1 },
    { field: "status", headerName: "Status", flex: 1, type: "singleSelect", valueOptions: taskFilter },
    { field: "due_date", headerName: "Due Date", flex: 1 },
    { field: "taken_at", headerName: "Start", flex: 1 },
    { field: "completed_at", headerName: "End", flex: 1 },
    { field: "total_work_time", headerName: "Total working hours", flex: 1, filterable: false },
    {
      field: "task_for",
      headerName: "Type",
      flex: 0.5,
    },
    {
      field: "helped_for",
      headerName: "Helping For",
      flex: 1,
      filterable: false,
      sortable: false,
      renderCell: (params) => {
        return params.row.helping_for?.title;
      },
    },
    {
      field: "",
      headerName: "Dependencies",
      flex: 0.4,
      filterable: false,
      sortable: false,
      minWidth: 120,
      renderCell: (params) => {
        return (
          <>
            <Box display={"flex"} alignItems={"center"} justifyContent={"start"} gap={"8px"}>
              <Box title="Assisted Tasks">
                <Badge
                  badgeContent={params.row.helperTasks?.length || 0}
                  sx={{
                    cursor: "pointer",
                    color: colors.text.modrate,
                    "&:hover": { color: colors.primary.dark },
                  }}
                  onClick={() => {
                    if ((params.row.helperTasks?.length || 0) < 1) {
                      showToast({ message: "No Assistent tasks" });
                    } else {
                      setTaskDependencyDialog({ taskId: params.row.id, pathName: "assisted_tasks", name: "Assisted" });
                    }
                  }}
                  showZero
                >
                  <EmojiPeopleIcon />
                </Badge>
              </Box>

              <Box title={`Dependency Tasks\n(Double click to create new)`} sx={{ whiteSpace: "pre-line" }}>
                <Badge
                  badgeContent={params.row.dependencyTasks?.length || 0}
                  sx={{
                    cursor: "pointer",
                    color: colors.text.modrate,
                    "&:hover": { color: colors.primary.dark },
                  }}
                  showZero
                  // SINGLE CLICK
                  onClick={() => {
                    if (dependencyClickTimer) return;

                    dependencyClickTimer = setTimeout(() => {
                      dependencyClickTimer = null;

                      const count = params.row.dependencyTasks?.length || 0;

                      if (count < 1) {
                        showToast({ message: "No Dependency Tasks" });
                      } else {
                        setTaskDependencyDialog({
                          taskId: params.row.id,
                          pathName: "dependency_tasks",
                          name: "Dependency",
                        });
                      }
                    }, 200); // small delay to check double-click
                  }}
                  // DOUBLE CLICK (DO NOTHING)
                  onDoubleClick={() => {
                    if (dependencyClickTimer) {
                      clearTimeout(dependencyClickTimer);
                      dependencyClickTimer = null;
                    }
                    setEditDialog({ open: true, task: params.row, type: "dependencyTask" });
                    // intentionally empty (double-click should do nothing)
                  }}
                >
                  <LowPriorityIcon />
                </Badge>
              </Box>
              <Box title="Parent Tasks">
                <Badge
                  badgeContent={params.row.parentTasks?.length || 0}
                  sx={{
                    cursor: "pointer",
                    color: colors.text.modrate,
                    "&:hover": { color: colors.primary.dark },
                  }}
                  onClick={() => {
                    if ((params.row.parentTasks?.length || 0) < 1) {
                      showToast({ message: "No Parent Tasks" });
                    } else {
                      setTaskDependencyDialog({ taskId: params.row.id, pathName: "parent_tasks", name: "Parent" });
                    }
                  }}
                  showZero
                >
                  <TimerIcon />
                </Badge>
              </Box>
            </Box>
          </>
        );
      },
    },
    {
      field: "assignee",
      headerName: "Assigned from",
      flex: 1,
      filterable: false,
      sortable: false,
      renderCell: (params) => {
        return params.row.helping_for?.title;
      },
    },
    {
      field: "assigne_to",
      headerName: "Assigned For",
      flex: 1,
      filterable: false,
      sortable: false,
      renderCell: (params) => {
        return params.row.assigned_to;
      },
    },
    {
      field: "approved_by",
      headerName: "Approved By",
      flex: 1,
      filterable: false,
      sortable: false,
      renderCell: (params) => {
        return params.row.helping_for?.title;
      },
    },

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
          <Box display="flex" gap="5px" alignItems="center" overflow={"scroll"}>
            {isEditing ? (
              <CircularProgress size={20} />
            ) : (
              <>
                <Box title="Edit">
                  <EditIcon
                    onClick={() => {
                      setEditDialog({ open: true, task: params.row, type: "task" });
                    }}
                    sx={{
                      cursor: "pointer",
                      color: colors.text.dark,
                      "&:hover": { color: colors.primary.dark },
                    }}
                  />
                </Box>
                {
                  params.row.status === "in_progress" && (
                    <Box title="Complete Task">
                      <CheckCircleIcon
                        onClick={() => {
                          handleCompleteTask(params.row.id);
                        }}
                        sx={{
                          cursor: "pointer",
                          color: colors.text.dark,
                          "&:hover": { color: colors.primary.dark },
                        }}
                      />
                    </Box>
                  )
                }

                {(params.row.status === "in_progress" || params.row.status === "approved") && (
                  <>
                    <Box title="Ask Help">
                      <AddIcon
                        onClick={() => setOpenHelperTask({ projectMemberId: params.row.assigned_to, taskId: params.row.id })}
                        sx={{
                          cursor: "pointer",
                          color: colors.text.modrate,
                          "&:hover": { color: colors.primary.dark },
                        }}
                      />
                    </Box>
                    <Box title={params.row.live_status === "stop" ? "Start" : "Pause"}>
                      {params.row.live_status === "stop" ? (
                        <PlayArrowIcon
                          onClick={() => {
                            handleStartTask(params.row.id);
                          }}
                          sx={{
                            cursor: "pointer",
                            color: colors.text.dark,
                            "&:hover": { color: colors.primary.dark },
                          }}
                        />
                      ) : (
                        <PauseIcon
                          onClick={() => {
                            handleStopTask(params.row.id);
                          }}
                          sx={{
                            cursor: "pointer",
                            color: colors.text.dark,
                            "&:hover": { color: colors.primary.dark },
                          }}
                        />
                      )}
                    </Box>
                  </>
                )}

                {
                  ["approve_pending", "approved", "assign_pending", "accept_pending"].includes(params.row.status) && (
                    <Box title="Delete">
                      <DeleteIcon
                        onClick={() => {
                          showConfirmDialog({
                            message: "Sure of removing member?",
                            title: "Delete Project Member",
                            onConfirm: () => handleDeleteTask(params.row.id),
                          });
                        }}
                        sx={{
                          cursor: "pointer",
                          color: colors.error.light,
                          "&:hover": { color: colors.error.modrate },
                        }}
                      />
                    </Box>
                  )
                }

                
              </>
            )}
          </Box>
        );
      },
    },
  ];
  return (
    <>
      <Box m="20px">
        <DataTable columns={displayColumns} fetchEndpoint={BACKEND_ENDPOINT["my_task"](typeFilter)} refresh={refresh || refreshCurrentTask} setRefresh={setRefresher} />

        <EditDialog
          formFields={updateFormFields}
          isOpen={editDialog.open && editDialog.type === "task"}
          updateBackendEndpoint={BACKEND_ENDPOINT.update_task(editDialog.task?.id)}
          onClose={() => {
            setEditDialog({ open: false, task: null, type: null });
          }}
          onSuccess={() => {
            setEditDialog({ open: false, task: null, type: null });
            setRefresher(true);
          }}
          initialData={{ description: editDialog.task?.description, priority: editDialog.task?.priority }}
          usefor={`Task`}
        />
      </Box>

      <CreateHelperTask open={!!openHelperTask} onClose={() => setOpenHelperTask(false)} projectMemberId={openHelperTask.projectMemberId} taskId={openHelperTask.taskId} />

      <TaskDependenciesDialog taskId={taskDependencyDialog?.taskId} onClose={() => setTaskDependencyDialog(null)} pathName={taskDependencyDialog?.pathName} name={taskDependencyDialog?.name} onSuccess={() => {setRefresher(true)}} />

      <DependencyTaskCreateDialog 
        open={editDialog.open && editDialog.type === "dependencyTask"}
        onClose={() => {
            setEditDialog({ open: false, task: null, type: null });
          }}

        task={editDialog.task}
        onSuccess={() => {setRefresher(true)}}
      />
    </>
  );
}

const deleteTaskRequest = async (taskId) => {
  const endpoint = BACKEND_ENDPOINT.delete_task(taskId);
  const response = await backendRequest({ endpoint });
  showToast({ message: response.message ?? (response.success ? "Delected Successfully" : "Failed to delete"), type: response.success ? "success" : "error" });
  return response;
};
