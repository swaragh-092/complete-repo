// Author: Gururaj
// Created: 14th Oct 2025
// Description: Edit Member Role dialog for changing a project member role.
// Version: 1.0.0
// Modified:

import BACKEND_ENDPOINT from "../../../../util/urls";
import backendRequest from "../../../../util/request";
import { useEffect, useRef, useState } from "react";
import { showToast } from "../../../../util/feedback/ToastService";
import { CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Select } from "@mui/material";
import DoButton from "../../../../components/button/DoButton";

export default function EditMemberRoleDialog({ editDialog, setEditDialog, setRefresher }) {
  const selectedRoleFromProp = editDialog?.member?.project_role || "member";
  const [selectedRole, setSelectedRole] = useState(selectedRoleFromProp);
  const [isEditing, setEditing] = useState(false);

  // Sync role whenever the dialog opens with a different member
  const prevMemberId = useRef(editDialog?.member?.id);
  useEffect(() => {
    if (editDialog?.member?.id && editDialog.member.id !== prevMemberId.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedRole(editDialog.member.project_role || "member");
    }
    prevMemberId.current = editDialog?.member?.id;
  }, [editDialog?.member]);

  const handleEditRole = async () => {
    if (!editDialog.member) return;
    setEditing(true);
    const endpoint = BACKEND_ENDPOINT["update_project_member_role"](editDialog.member.id);
    const response = await backendRequest({
      endpoint,
      bodyData: { project_role: selectedRole },
    });

    showToast({
      message: response.message ?? (response.success ? (response.message ?? "Role updated successfully") : (response.message ?? "Failed to update role")),
      type: response.success ? "success" : "error",
    });

    if (response.success) {
      setRefresher(true);
      setEditDialog({ open: false, member: null });
    }
    setEditing(false);
  };
  const memberName = editDialog?.member?.user_details?.name || editDialog?.member?.user_id || "";

  return (
    <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, member: null })} fullWidth maxWidth="xs">
      <DialogTitle>Edit {memberName} Role</DialogTitle>
      <DialogContent>
        <Select fullWidth size="small" value={selectedRole || "member"} onChange={(e) => setSelectedRole(e.target.value)} sx={{ mt: 1 }}>
          <MenuItem value="lead">Lead</MenuItem>
          <MenuItem value="member">Member</MenuItem>
          <MenuItem value="viewer">Viewer</MenuItem>
        </Select>
      </DialogContent>
      <DialogActions>
        <DoButton onclick={() => setEditDialog({ open: false, member: null })} variant="text" isDisable={isEditing}>
          Cancel
        </DoButton>
        <DoButton onclick={handleEditRole} isDisable={isEditing}>
          {isEditing ? <CircularProgress size={20} /> : "Save"}
        </DoButton>
      </DialogActions>
    </Dialog>
  );
}
