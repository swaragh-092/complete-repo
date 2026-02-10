import { Link } from "react-router-dom";
import BACKEND_ENDPOINT from "../../../../util/urls";
import { useState } from "react";
import CreateDialog from "../../../../components/pms/CreateDialog";
import DataTable from "../../../../components/tools/Datatable";
import { Box, Button, CircularProgress, MenuItem, Select, useTheme } from "@mui/material";
import Heading from "../../../../components/Heading";
import DoButton from "../../../../components/button/DoButton";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditDialog from "../../../../components/pms/EditDialog";
import { colorCodes } from "../../../../theme";
import { showConfirmDialog } from "../../../../util/feedback/ConfirmService";
import EditIcon from "@mui/icons-material/ModeEditOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import { showToast } from "../../../../util/feedback/ToastService";
import backendRequest from "../../../../util/request";


const formFields = [
  { type: "text", name: "title" },
  { type: "textarea", name: "description", label: "Description",},
  { type: "select", name: "priority", options : [ {label : "High", value : "high", },{label : "Medium", value : "medium", },{label : "Low", value : "low", }, ]},
  { type: "date", name: "due_date", label: "Due Date", validationName : "futureDate"},
];

const updateFormFields = [
  { type: "textarea", name: "description", label: "Description",},
  { type: "select", name: "priority", options : [ {label : "High", value : "high", },{label : "Medium", value : "medium", },{label : "Low", value : "low", }, ]},
];



export default function TaskList ({project_id, memberIdCreateTask, setMemberIdCreateTask, refresh, setRefresher = () => {}}) {
  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);

  
  const [ editDialog, setEditDialog ] = useState({ open: false, task: null });
  const [editingIds, setEditingIds] = useState([]);

  const handleDeleteTask = async (taskId) => {
    setEditingIds((prev) => [...prev, taskId]);
    const response = await deleteTaskRequest(taskId);
    if (response.success) setRefresher(true);
    setEditingIds((prev) => prev.filter((id) => id !== taskId)); // remove after done
  };


  const displayColumns = [
    { field: "title", headerName: "Title", flex: 1 },
    { field: "description", headerName: "Discription", flex: 1 },
    { field: "department_id", headerName: "Department", flex: 1 },
    { field: "priority", headerName: "Priority", flex: 1 },
    { field: "status", headerName: "Status", flex: 1, type: "singleSelect", valueOptions: taskFilter, },
    { field: "due_date", headerName: "Due Date", flex: 1 },
    { field: "taken_at", headerName: "Start", flex: 1 },
    { field: "completed_at", headerName: "End", flex: 1 },
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
      sortable : false,
      renderCell : (params) => {
        return params.row.helping_for?.title
      }
    },
    { 
      field: "assignee", 
      headerName: "Assigned from", 
      flex: 1, 
      filterable: false,  
      sortable : false,
      renderCell : (params) => {
        return params.row.helping_for?.title
      }
    },
    { 
      field: "assigne_to", 
      headerName: "Assigned For", 
      flex: 1, 
      filterable: false,  
      sortable : false,
      renderCell : (params) => {
        return params.row.assigned_to
      }
    },
    { 
      field: "approved_by", 
      headerName: "Approved By", 
      flex: 1, 
      filterable: false,  
      sortable : false,
      renderCell : (params) => {
        return params.row.helping_for?.title
      }
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
        
        return (
          <Box display="flex" gap="10px" alignItems="center">
            {isEditing ? (
              <CircularProgress size={20} />
            ) : (
              <>
                <Box title="Edit">
                  <EditIcon
                    onClick={() => {
                      setEditDialog({ open: true, task: params.row });
                    }}
                    sx={{
                      cursor: "pointer",
                      color: colors.text.dark,
                      "&:hover": { color: colors.secondary.dark },
                    }}
                  />
                </Box>

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

              </>
            )}
          </Box>
        );
      }
    },
  ];


  return (
    <Box m="20px">
      <Heading title="Tasks" level={2} />

      <DataTable columns={displayColumns} fetchEndpoint={BACKEND_ENDPOINT["project_tasks"](project_id)} refresh={refresh} setRefresh={setRefresher} />

      <CreateDialog
        formFields={formFields}
        isOpen={memberIdCreateTask}
        onClose={() => {
          setMemberIdCreateTask(false);
        }}
        usefor={`Task`}
        onSuccess={() => setRefresher(true)}
        backendEndpoint={BACKEND_ENDPOINT["create_task"](memberIdCreateTask)}
      />
      <EditDialog
        formFields={updateFormFields}
        isOpen={editDialog.open}
        updateBackendEndpoint={BACKEND_ENDPOINT.update_task(editDialog.task?.id)}
        onClose={() => {setEditDialog({ open: false, task: null })}}
        onSuccess={() => {setEditDialog({ open: false, task: null }); setRefresher(true);}}
        initialData={{description : editDialog.task?.description, priority: editDialog.task?.priority}}
        usefor={`Task`}

      />
    </Box>
  );
}


const taskFilter = [
  {label : "On Going", value : "in_progress", },
  {label : "Completed", value : "completed", },
  {label : "Pending", value : "approved", },
  {label : "Blocked", value : "blocked", },
  {label : "Assign Pending", value : "assign_pending", },
  {label : "Approve Pending", value : "approve_pending", },
];


const deleteTaskRequest = async (taskId) => {
  const endpoint = BACKEND_ENDPOINT.delete_task(taskId);
  const response = await backendRequest({ endpoint });
  
  showToast({message: response.message ?? (response.success ? "Delected Successfully":"Failed to delete"), type : response.success ? "success": "error" });
  return response;
}

