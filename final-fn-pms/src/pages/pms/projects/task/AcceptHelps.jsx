import { useTheme } from "@emotion/react";
import DataTable from "../../../../components/tools/Datatable";
import BACKEND_ENDPOINT from "../../../../util/urls";

import DoneAllIcon from "@mui/icons-material/DoneAll";
import ThumbDownAltIcon from "@mui/icons-material/ThumbDownAlt";
import { colorCodes } from "../../../../theme";
import { useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import backendRequest from "../../../../util/request";
import { showToast } from "../../../../util/feedback/ToastService";
import Heading from "../../../../components/Heading";

export default function AcceptHelps({setRefreshCurrentTask}) {
  const [refresh, setRefresher] = useState(true);
  const [editingIds, setEditingIds] = useState([]);

  const handleAccept = async (taskId, status) => {
    setEditingIds((prev) => [...prev, taskId]);
    const endpoint = BACKEND_ENDPOINT.accept_hekp_asked(taskId, status);
    const response = await backendRequest({endpoint});

    showToast({message: response.message || (response.success ? `Task ${status}ed.` : `Task ${status} failed`), type: response.success ? "success" : "error"});
    if ( response.success ) { 
      setRefresher(true);   
      if (status === "accept") setRefreshCurrentTask(true);
    }
    setEditingIds((prev) => prev.filter((id) => id !== taskId)); 
  }

  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);

  const displayColumns = [
    { field: "helpedTask", headerName: "Help for", flex: 1, renderCell: (params) => params.row.helpedTask?.title, filterable: false, sortable: false },
    { field: "helpedTask.assigned_to", headerName: "Help user", flex: 1, renderCell: (params) => params.row.helpedTask?.assigned?.user_id, filterable: false, sortable: false },

    { field: "title", headerName: "Title", flex: 1 },
    { field: "description", headerName: "Discription", flex: 1 },
    { field: "department_id", headerName: "Department", flex: 1 },
    { field: "due_date", headerName: "Due Date", flex: 1 },
    {
      field: "",
      headerName: "Actions",
      flex: 0.4,
      filterable: false,
      sortable: false,
      minWidth: 120,
      renderCell: (params) => {
        const isEditing = editingIds.includes(params.row.id);

        return (
          <>
            <Box display={"flex"} alignItems={"center"} justifyContent={"start"} gap={"8px"}>
              {isEditing ? (
                <CircularProgress size={20} />
              ) : (
                <>
                  <Box title="Accept">
                    <DoneAllIcon
                      onClick={() => {
                        handleAccept(params.row.id, "accept");
                      }}
                      sx={{
                        cursor: "pointer",
                        color: colors.text.dark,
                        "&:hover": { color: colors.primary.dark },
                      }}
                    />
                  </Box>
                  <Box title="Reject">
                    <ThumbDownAltIcon
                      onClick={() => {
                        handleAccept(params.row.id, "reject");
                      }}
                      sx={{
                        cursor: "pointer",
                        color: colors.text.dark,
                        "&:hover": { color: colors.error.dark },
                      }}
                    />
                  </Box>
                </>
              )}
            </Box>
          </>
        );
      },
    },
  ];

  return (
    <>
    <Box padding={"20px"} >
      <Heading title={"Asking Help"} level={3}/>
      <DataTable refresh={refresh} setRefresh={setRefresher} columns={displayColumns} fetchEndpoint={BACKEND_ENDPOINT.asked_help_tasks} />
    </Box>
    </>
  );
}
