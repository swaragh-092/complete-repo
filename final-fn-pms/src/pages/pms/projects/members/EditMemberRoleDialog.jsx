import BACKEND_ENDPOINT from "../../../../util/urls";
import backendRequest from "../../../../util/request";
import { useState } from "react";
import { showToast } from "../../../../util/feedback/ToastService";
import { CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Select } from "@mui/material";
import DoButton from "../../../../components/button/DoButton";

export default function EditMemberRoleDialog({editDialog,  setEditDialog, setRefresher }) {


  const [selectedRole, setSelectedRole] = useState(editDialog?.member?.project_role);
  const [isEditing, setEditing] = useState(false);

  

    const handleEditRole = async () => {
      if (!editDialog.member) return;
      setEditing(true);
      const endpoint = BACKEND_ENDPOINT["update_project_member_role"](editDialog.member.id);
      const response = await backendRequest({
        endpoint,
        bodyData: { project_role: selectedRole },
      });
  
      showToast({
        message: response.message ?? (response.success ? response.message ?? "Role updated successfully" : response.message ?? "Failed to update role"),
        type: response.success ? "success" : "error",
      });
  
      if (response.success) {
        setRefresher(true);
        setEditDialog({ open: false, member: null });
      }
      setEditing(false);
    };
  return (
    <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, member: null })} fullWidth maxWidth="xs">
      <DialogTitle>Edit {editDialog?.member?.user_id} Role</DialogTitle>
      <DialogContent>
        <Select fullWidth size="small" value={selectedRole || "member"} onChange={(e) => setSelectedRole(e.target.value)} sx={{ mt: 1 }}>
          <MenuItem value="lead">Lead</MenuItem>
          <MenuItem value="member">Member</MenuItem>
          <MenuItem value="viewer">Viewer</MenuItem>
        </Select>
      </DialogContent>
      <DialogActions>
        <DoButton onclick={() => setEditDialog({ open: false, member: null })} variant="text" isDisable={isEditing}>Cancel</DoButton>
        <DoButton onclick={handleEditRole} isDisable={isEditing}>
          {isEditing ? <CircularProgress size={20} /> :  "Save"}
        </DoButton>
      </DialogActions>
    </Dialog>
  );
}
