import { useState } from "react";
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Select, useTheme } from "@mui/material";
import Heading from "../../../../components/Heading";
import DoButton from "../../../../components/button/DoButton";
import DataTable from "../../../../components/tools/Datatable";
import AddMembersDialog from "./AddMembersDialog";
import BACKEND_ENDPOINT from "../../../../util/urls";
import backendRequest from "../../../../util/request";
import { showToast } from "../../../../util/feedback/ToastService";
import { showConfirmDialog } from "../../../../util/feedback/ConfirmService";
import { colorCodes } from "../../../../theme";
import EditIcon from "@mui/icons-material/ModeEditOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import EditMemberRoleDialog from "./EditMemberRoleDialog";
import AddIcon from '@mui/icons-material/Add';

export default function ProjectMembersList({ projectId, setMemberIdCreateTask, setTaskRefresher = () => {}  }) {
  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);

  const [refresh, setRefresher] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingIds, setEditingIds] = useState([]);
  const [editDialog, setEditDialog] = useState({ open: false, member: null });

  const handleDeleteMember = async (memberId) => {
    setEditingIds((prev) => [...prev, memberId]);
    const response = await deleteMemberRequest(memberId);
    if (response.success) {
      setRefresher(true);
      setTaskRefresher(true);
    }
    setEditingIds((prev) => prev.filter((id) => id !== memberId)); // remove after done
  };

  const displayColumns = [
    { field: "user_id", headerName: "User Id", flex: 1 },
    { field: "department_id", headerName: "Department Id", flex: 1 },
    { field: "project_role", headerName: "Project Role", flex: 1 },
    // { field: "is_active", headerName: "Active Status", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 100,
      flex: 0.2,
      sortable: false,
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
                      setEditDialog({ open: true, member: params.row });
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
                        onConfirm: () => handleDeleteMember(params.row.id),
                      });
                    }}
                    sx={{
                      cursor: "pointer",
                      color: colors.error.light,
                      "&:hover": { color: colors.error.modrate },
                    }}
                  />
                </Box>

                <Box title="Create Task">
                  <AddIcon
                    onClick={() => {
                      setMemberIdCreateTask(params.row.id);
                    }}
                    sx={{
                      cursor: "pointer",
                      color: colors.info.light,
                      "&:hover": { color: colors.info.modrate },
                    }}
                  />
                </Box>
              </>
            )}
          </Box>
        );
      },
    },
  ];  

  return (
    <>
      {projectId && (
        <>
          <Box m="20px" maxWidth={"49%"} width={"100%"} >
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Heading title={"Project Members"} level={2} />

              <DoButton onclick={() => setOpen(true)}>Add Member</DoButton>
            </Box>
            <DataTable columns={displayColumns} fetchEndpoint={BACKEND_ENDPOINT["project_members"](projectId)} refresh={refresh} setRefresh={setRefresher} dataPath={["members"]} defaultPageSize={5} />
          </Box>

          <AddMembersDialog isOpen={open} setOpen={setOpen} setRefresher={setRefresher} projectId={projectId} />

          {/* Edit Role Dialog */}
          <EditMemberRoleDialog editDialog={editDialog} setEditDialog={setEditDialog} setRefresher={setRefresher}   />

                  
        </>
      )}
    </>
  );
}


const deleteMemberRequest = async (memberId) => {
  const endpoint = BACKEND_ENDPOINT['delete_project_member'](memberId);
  const response = await backendRequest({ endpoint });
  
  showToast({message: response.message ?? (response.success ? "Delected Successfully":"Failed to delete"), type : response.success ? "success": "error" });
  return response;
}

