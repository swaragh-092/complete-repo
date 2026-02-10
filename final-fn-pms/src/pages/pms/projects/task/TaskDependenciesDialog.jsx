import { Dialog, DialogTitle, DialogContent, DialogActions, Button, useTheme, Box, CircularProgress } from "@mui/material";

import DataTable from "../../../../components/tools/Datatable";
import BACKEND_ENDPOINT from "../../../../util/urls";
import DeleteIcon from "@mui/icons-material/Delete";
import { colorCodes } from "../../../../theme";
import backendRequest from "../../../../util/request";
import { useEffect, useState } from "react";
import { showToast } from "../../../../util/feedback/ToastService";

export default function TaskDependenciesDialog({ taskId, onClose, pathName, name, onSuccess = () => {} }) {
  const [deletingTaskId, setDeletingTaskId] = useState([]);
  const [refresh, setRefresh] = useState(true);
  const open = Boolean(taskId);

  const handleOnDeleteDependencyTask = async (dependencyTaskId) => {
    console.log()
    setDeletingTaskId((prev) => [...prev, dependencyTaskId]);
    const response = await backendRequest({endpoint: BACKEND_ENDPOINT.remove_dependency_task(taskId, dependencyTaskId)});

    showToast({ message: response.message ?? (response.success ? "Dependency Removed Successfully" : "Failed to Remove Dependency"), type: response.success ? "success" : "error" });
    if (response.success) {
      setRefresh(true);
      onSuccess();
    }
    setDeletingTaskId((prev) => prev.filter((id) => id !== dependencyTaskId)); // remove after done
  }

  useEffect(() => { if (open) setRefresh(true)}, [open]);

  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);

  const displayColumns = [
    { field: "assigned_to", headerName: "Assigned User", flex: 1 },
    { field: "title", headerName: "Title", flex: 1 },
    { field: "description", headerName: "Discription", flex: 1 },
    { field: "department_id", headerName: "Department", flex: 1 },
    { field: "priority", headerName: "Priority", flex: 1 },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      sortable: false,
      filterable: false,
    },
    { field: "due_date", headerName: "Due Date", flex: 1 },
    { field: "taken_at", headerName: "Start", flex: 1 },
    { field: "completed_at", headerName: "End", flex: 1 },
    { field: "total_work_time", headerName: "Total hours", flex: 1 },
    {
      field: "assignee",
      headerName: "Assigned from",
      flex: 1,
      sortable: false,
      filterable: false,
      renderCell: (params) => params.row.helping_for?.title,
    },
    {
      field: "assigne_to",
      headerName: "Assigned For",
      flex: 1,
      sortable: false,
      filterable: false,
      renderCell: (params) => params.row.assigned_to,
    },
    {
      field: "approved_by",
      headerName: "Approved By",
      flex: 1,
      sortable: false,
      filterable: false,
      renderCell: (params) => params.row.helping_for?.title,
    },
    ...(pathName == "dependency_tasks"
      ? [
          {
            field: "action",
            headerName: "Action",
            flex: 1,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
              <Box title="Delete">
                {deletingTaskId.includes(params.row.id) ? (
                  <CircularProgress size={20} />
                ) : (
                  <DeleteIcon
                    onClick={() => {
                      handleOnDeleteDependencyTask(params.row.id);
                    }}
                    sx={{
                      cursor: "pointer",
                      color: colors.error.light,
                      "&:hover": { color: colors.error.modrate },
                    }}
                  />
                )}
                
              </Box>
            ),
          },
        ]
      : []),
  ];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>{name} Tasks</DialogTitle>

      <DialogContent dividers sx={{ padding: 0 }}>
        {taskId && <DataTable columns={displayColumns} fetchEndpoint={BACKEND_ENDPOINT[pathName](taskId)} defaultPageSize={5} refresh={refresh} setRefresh={setRefresh}  />}
      </DialogContent>

      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}



