// Author: Gururaj
// Created: 12th March 2026
// Description: Dialog to assign a checklist task — self-assign (take) or
//              assign to a department member (leads only).
// Version: 1.0.0

import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, Button, MenuItem, Select, FormControl, InputLabel, TextField, CircularProgress, Chip, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useEffect } from "react";
import backendRequest from "../../../../util/request";
import BACKEND_ENDPOINT from "../../../../util/urls";
import { showToast } from "../../../../util/feedback/ToastService";

/**
 * AssignChecklistTaskDialog
 *
 * Props:
 *  - open          : boolean
 *  - onClose       : () => void
 *  - onSuccess     : () => void
 *  - task          : task object (must have id, title, project_id, department_id, my_role, my_project_member_id)
 */
export default function AssignChecklistTaskDialog({ open, onClose, onSuccess, task }) {
  const [dueDate, setDueDate] = useState("");
  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isLead = task?.my_role === "lead";
  const today = new Date().toISOString().split("T")[0];

  const resetState = () => {
    setDueDate("");
    setSelectedMemberId("");
    setMembers([]);
    setSubmitting(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Load department members when lead opens the dialog
  useEffect(() => {
    if (!open) return;

    if (isLead && task?.project_id && task?.department_id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadingMembers(true);
      backendRequest({
        endpoint: BACKEND_ENDPOINT.project_members_by_dept(task.project_id, task.department_id),
      })
        .then((res) => {
          console.log("Members response:", res.data.members.data);
          if (res.success && Array.isArray(res.data?.members?.data)) {
            setMembers(res.data.members.data);
          } else {
            showToast({ message: res.message || "Failed to load members", type: "error" });
          }
        })
        .catch(() => showToast({ message: "Failed to load members", type: "error" }))
        .finally(() => setLoadingMembers(false));
    }
  }, [open, isLead, task?.project_id, task?.department_id]);

  const handleTakeTask = async () => {
    if (!dueDate) {
      showToast({ message: "Please set a due date", type: "error" });
      return;
    }
    if (!task?.my_project_member_id) {
      showToast({ message: "Could not determine your membership. Please refresh.", type: "error" });
      return;
    }
    setSubmitting(true);
    const res = await backendRequest({
      endpoint: BACKEND_ENDPOINT.assign_checklist_task(task.id, task.my_project_member_id),
      bodyData: { due_date: dueDate },
    });
    setSubmitting(false);
    showToast({
      message: res.message ?? (res.success ? "Task taken successfully" : "Failed to take task"),
      type: res.success ? "success" : "error",
    });
    if (res.success) {
      resetState();
      onSuccess();
      onClose();
    }
  };

  const handleAssign = async () => {
    if (!dueDate) {
      showToast({ message: "Please set a due date", type: "error" });
      return;
    }
    if (!selectedMemberId) {
      showToast({ message: "Please select a member to assign", type: "error" });
      return;
    }
    setSubmitting(true);
    const res = await backendRequest({
      endpoint: BACKEND_ENDPOINT.assign_checklist_task(task.id, selectedMemberId),
      bodyData: { due_date: dueDate },
    });
    setSubmitting(false);
    showToast({
      message: res.message ?? (res.success ? "Task assigned successfully" : "Failed to assign task"),
      type: res.success ? "success" : "error",
    });
    if (res.success) {
      resetState();
      onSuccess();
      onClose();
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
      <DialogTitle sx={{ m: 0, p: 2, fontWeight: 600 }}>
        Assign Checklist Task
        <IconButton onClick={handleClose} sx={{ position: "absolute", right: 8, top: 8, color: (t) => t.palette.grey[500] }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Task
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {task.title}
            </Typography>
          </Box>

          <Box display="flex" gap={1} flexWrap="wrap">
            {task.project?.name && <Chip label={`Project: ${task.project.name}`} size="small" variant="outlined" />}
            {task.department_details?.name && <Chip label={`Dept: ${task.department_details.name}`} size="small" color="primary" variant="outlined" />}
            <Chip label={isLead ? "Your role: Lead" : "Your role: Member"} size="small" color={isLead ? "success" : "default"} variant="outlined" />
          </Box>

          <TextField label="Due Date" type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} inputProps={{ min: today }} />

          {isLead && (
            <FormControl fullWidth>
              <InputLabel>Assign To (optional — leave empty to take yourself)</InputLabel>
              <Select value={selectedMemberId} label="Assign To (optional — leave empty to take yourself)" onChange={(e) => setSelectedMemberId(e.target.value)} disabled={loadingMembers}>
                <MenuItem value="">
                  <em>— Self (take this task) —</em>
                </MenuItem>
                {members.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.user_details?.name || m.user_id}{" "}
                    <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                      ({m.project_role})
                    </Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {!isLead && (
            <Typography variant="body2" color="text.secondary">
              As a member you can take this task for yourself. Only leads can assign it to other team members.
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        {isLead && selectedMemberId ? (
          <Button variant="contained" onClick={handleAssign} disabled={submitting || !dueDate}>
            {submitting ? <CircularProgress size={20} /> : "Assign to Member"}
          </Button>
        ) : (
          <Button variant="contained" onClick={handleTakeTask} disabled={submitting || !dueDate}>
            {submitting ? <CircularProgress size={20} /> : "Take Task"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
