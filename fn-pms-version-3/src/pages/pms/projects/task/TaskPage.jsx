// Author: Gururaj
// Created: 14th Oct 2025
// Description: Task page container rendering the task list and current-task panel for a project.
// Version: 1.0.0
// Modified:

import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import Heading from "../../../../components/Heading";
import MyTaskList from "./MyTaskList";
import { useEffect, useRef, useState } from "react";
import CurrentTask from "./CurrentTask";
import backendRequest from "../../../../util/request";
import BACKEND_ENDPOINT from "../../../../util/urls";
import AcceptHelps from "./AcceptHelps";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { showToast } from "../../../../util/feedback/ToastService";
import AvailableChecklistTasks from "./AvailableChecklistTasks";

const taskFilter = [
  { label: "On Going", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Pending", value: "approved" },
  { label: "Blocked", value: "blocked" },
  { label: "Approve Pending", value: "approve_pending" },
  { label: "Issue", value: "issue" },
  { label: "Checklist", value: "checklist" },
  { label: "Helping", value: "help" },
];

export default function TaskPage() {
  const [workingTask, setWorkingTask] = useState(null);
  const [refreshCurrentTask, setRefreshCurrentTask] = useState(true);
  const [filter, setFilter] = useState("in_progress");
  const [myTaskRefresh, setMyTaskRefresh] = useState(false);
  const [createTaskProjectId, setCreateTaskProjectId] = useState(null);

  const [userProjects, setUserProjects] = useState([]);

  useEffect(() => {
    const getUserProjects = async () => {
      try {
        const userProjects = await backendRequest({ endpoint: BACKEND_ENDPOINT.get_user_projects });
        if (Array.isArray(userProjects?.data)) {
          setUserProjects(
            userProjects.data.map((project) => ({
              label: project.name,
              value: project.id,
            })),
          );
        }
      } catch (err) {
        console.error("Failed to fetch user projects:", err);
      }
    };

    getUserProjects();
  }, []);

  return (
    <>
      <Box p="20px" display={"flex"} justifyContent={"space-between"} alignItems={"center"}>
        <Heading title={"Tasks"} giveMarginBottom={false} level={1} />

        <Box display="flex" gap="10px" alignItems="center">
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateTaskProjectId(userProjects[0]?.value || "__open__")} disabled={userProjects.length === 0}>
            Create Task
          </Button>

          <FormControl fullWidth sx={{ maxWidth: 250, mt: 2 }}>
            <InputLabel id="task-filter-label">Type</InputLabel>
            <Select labelId="task-filter-label" value={filter} label="Filter" onChange={(e) => setFilter(e.target.value)}>
              {taskFilter.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <CurrentTask task={workingTask} setTask={setWorkingTask} key={workingTask} refresh={refreshCurrentTask} setRefresher={setRefreshCurrentTask} />

      <MyTaskList userProjects={userProjects} key={filter} typeFilter={filter} refreshCurrentTask={refreshCurrentTask} setRefreshCurrentTask={setRefreshCurrentTask} refresh={myTaskRefresh} />

      <AcceptHelps setRefreshCurrentTask={setRefreshCurrentTask} />

      <AvailableChecklistTasks onAssigned={() => setMyTaskRefresh((v) => !v)} />

      <CreateSelfTaskDialog
        open={!!createTaskProjectId}
        onClose={() => setCreateTaskProjectId(null)}
        userProjects={userProjects}
        initialProjectId={typeof createTaskProjectId === "string" && createTaskProjectId !== "__open__" ? createTaskProjectId : userProjects[0]?.value}
        onSuccess={() => {
          setCreateTaskProjectId(null);
          setMyTaskRefresh((v) => !v);
        }}
      />
    </>
  );
}

function CreateSelfTaskDialog({ open, onClose, userProjects, initialProjectId, onSuccess }) {
  const [projectId, setProjectId] = useState(initialProjectId || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const prevInitialProjectId = useRef(initialProjectId);
  useEffect(() => {
    if (initialProjectId && initialProjectId !== prevInitialProjectId.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProjectId(initialProjectId);
    }
    prevInitialProjectId.current = initialProjectId;
  }, [initialProjectId]);

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!projectId || !title || !dueDate) {
      showToast({ message: "Project, title and due date are required", type: "error" });
      return;
    }
    setSubmitting(true);
    const response = await backendRequest({
      endpoint: BACKEND_ENDPOINT.create_self_task(projectId),
      bodyData: { title, description: description || undefined, priority, due_date: dueDate },
    });
    setSubmitting(false);
    if (response.success) {
      showToast({ message: response.message || "Task created successfully", type: "success" });
      handleClose();
      onSuccess();
    } else {
      showToast({ message: response.message || "Failed to create task", type: "error" });
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
      <DialogTitle sx={{ m: 0, p: 2, fontWeight: 600 }}>
        Create Task (for myself)
        <IconButton aria-label="close" onClick={handleClose} sx={{ position: "absolute", right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <FormControl fullWidth required>
            <InputLabel>Project</InputLabel>
            <Select value={projectId} label="Project" onChange={(e) => setProjectId(e.target.value)}>
              {userProjects.map((p) => (
                <MenuItem key={p.value} value={p.value}>
                  {p.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} fullWidth />

          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={3} />

          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select value={priority} label="Priority" onChange={(e) => setPriority(e.target.value)}>
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>

          <TextField label="Due Date" type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} inputProps={{ min: today }} />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={submitting || !projectId || !title || !dueDate}>
          {submitting ? <CircularProgress size={20} /> : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
