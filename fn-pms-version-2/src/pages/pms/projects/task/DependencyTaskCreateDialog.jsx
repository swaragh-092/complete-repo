import { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { Button, TextField, CircularProgress } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import BACKEND_ENDPOINT from "../../../../util/urls";
import backendRequest from "../../../../util/request"
import {showToast} from "../../../../util/feedback/ToastService"

export default function DependencyTaskCreateDialog({ open, onClose, task, onSuccess }) {
  const [departments, setDepartments] = useState([]);
  const [tasks, setTasks] = useState([]);
  
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  
  const [deptSearch, setDeptSearch] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const handleOnSubmit = async () => {
    setLoadingSubmit(true); 
    const response = await addDependencyTaskToBackend(task.id, selectedTask?.id);
    if (response.success) {
      onClose();
      onSuccess();
    }
    setLoadingSubmit(false);
  }


  // RESET ALL FIELDS WHEN OPEN
  useEffect(() => {
    if (open) {
      setSelectedDepartment(null);
      setSelectedTask(null);
      setTasks([]);
      setDeptSearch("");
      setTaskSearch("");
      loadDepartments();
    }
  }, [open]);

  const loadDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const res = await fetchDepartments(deptSearch);
      setDepartments(res || []);
    } finally {
      setLoadingDepartments(false);
    }
  };

  // LOAD TASKS WHEN DEPARTMENT OR TASK SEARCH CHANGES
  useEffect(() => {
    if (!selectedDepartment) return;
    loadTasks(selectedDepartment.id, taskSearch);
  }, [selectedDepartment, taskSearch]);

  const loadTasks = async (departmentId, q) => {
    setLoadingTasks(true);
    try {
      const res = await fetchTasksByDepartment( task.project.id, departmentId, q);
      setTasks(res || []);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleDepartmentChange = (e, newValue) => {
    setSelectedDepartment(newValue);

    // When department changes → clear task selection
    setSelectedTask(null);
    setTaskSearch("");

    if (!newValue) {
      // If user clears department → clear tasks
      setTasks([]);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Dependency Task</DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Department */}
        <Autocomplete
          sx={{ mt: 2 }}
          options={departments}
          loading={loadingDepartments}
          getOptionLabel={(option) => option.name || ""}
          value={selectedDepartment}
          onChange={handleDepartmentChange}
          inputValue={deptSearch}
          onInputChange={(e, v) => setDeptSearch(v)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search Department"
              placeholder="Type to search..."
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingDepartments ? <CircularProgress size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        {/* Task */}
        <Autocomplete
          options={loadingTasks ? [{ id: "__loading__", title: "Loading...", isLoading: true }] : tasks}
          getOptionLabel={(option) => option.title || ""}
          value={selectedTask}
          onChange={(e, v) => {
            if (v?.isLoading) return; // dont allow selecting loading row
            setSelectedTask(v);
          }}
          inputValue={taskSearch}
          onInputChange={(e, v) => {
            setTaskSearch(v);
            setLoadingTasks(true); // show loading immediately
          }}
          disabled={!selectedDepartment}
          filterOptions={(options) => options}
          renderOption={(props, option) =>
            option.isLoading ? (
              <li {...props}>
                <CircularProgress size={20} style={{ marginRight: 10 }} />
                Loading...
              </li>
            ) : (
              <li {...props}>{option.title}</li>
            )
          }
          renderInput={(params) => <TextField {...params} label="Search Tasks" placeholder={selectedDepartment ? "Type to search tasks..." : "Select department first"} />}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button variant="contained" disabled={!selectedTask || loadingSubmit} startIcon={loadingSubmit ? <CircularProgress size={18} /> : null}  onClick={handleOnSubmit}>
          {loadingSubmit ? "Adding..." : "Add"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// later add code of real department fetch
async function fetchDepartments(searchTerm = "") {
  // Simulated delay
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Dummy sample data
  const dummyDepartments = [
    { id: "1b201948-b208-44e9-aef4-750200989c79", name: "Testing" },
    { id: "1b201948-b208-44e9-aef4-750200989c78", name: "Developemnt" },
  ];

  // Filter based on search
  if (!searchTerm) return dummyDepartments;

  return dummyDepartments.filter((dept) => dept.name.toLowerCase().includes(searchTerm.toLowerCase()));
}
async function fetchTasksByDepartment( projectId, departmentId, searchTerm = "") {

  const endpoint = BACKEND_ENDPOINT.project_department_tasks(projectId, departmentId );

  const response = await backendRequest({endpoint, querySets: "?searchText="+searchTerm+"&searchField=title"});

  if ( !response.success ) {
    showToast({message : response.message || "Failed to fetch!", type: "error" });
  }

  return response.data?.data || [];
}


async function addDependencyTaskToBackend( taskId, dependencyTaskId ) {

  if ( !taskId ||  !dependencyTaskId) {
    showToast({ message:  "Task is missing" , type:  "error" });
    return;
  }

  const endpoint = BACKEND_ENDPOINT.add_dependency_task(taskId, dependencyTaskId );

  const response = await backendRequest({endpoint });

  showToast({ message: response.message ?? (response.success ? "Added Dependency Task Successfully" : "Failed to Added Dependency Task"), type: response.success ? "success" : "error" });

  return response;

}
