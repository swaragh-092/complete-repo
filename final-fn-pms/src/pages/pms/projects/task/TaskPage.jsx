import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import Heading from "../../../../components/Heading";
import MyTaskList from "./MyTaskList";
import { useEffect, useState } from "react";
import CurrentTask from "./CurrentTask";
import backendRequest from "../../../../util/request";
import BACKEND_ENDPOINT from "../../../../util/urls";
import AcceptHelps from "./AcceptHelps";

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

export default function TaskPage () {

    const [workingTask, setWorkingTask] = useState(null);
    const [refreshCurrentTask, setRefreshCurrentTask] = useState(true);
    const [filter, setFilter] = useState("in_progress");

    const [userProjects, setUserProjects] = useState([]);
    
      useEffect(() => {
        const getUserProjects = async () => {
          try {
            const userProjects = await backendRequest({ endpoint : BACKEND_ENDPOINT.get_user_projects });
            if (Array.isArray(userProjects?.data)) {
              setUserProjects(
                userProjects.data.map((project) => ({
                  label: project.name,
                  value: project.id,
                }))
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
            <Heading title={"Tasks"} giveMarginBottom = {false} level = {1}   /> 

           

                <FormControl fullWidth sx={{ maxWidth: 250, mt: 2 }}>
                    <InputLabel id="task-filter-label">Type</InputLabel>
                    <Select
                        labelId="task-filter-label"
                        value={filter}
                        label="Filter"
                        onChange={(e) => setFilter(e.target.value)}
                    >
                    {taskFilter.map((item) => (
                        <MenuItem key={item.value} value={item.value}>
                        {item.label}
                        </MenuItem>
                    ))}
                    </Select>
                </FormControl>
        </Box>
        
        <CurrentTask task={workingTask} setTask={setWorkingTask} key={workingTask} refresh={refreshCurrentTask} setRefresher={setRefreshCurrentTask}/>

        <MyTaskList userProjects={userProjects} key={filter} typeFilter={filter} refreshCurrentTask={refreshCurrentTask} setRefreshCurrentTask={setRefreshCurrentTask}  />



        <AcceptHelps setRefreshCurrentTask={setRefreshCurrentTask} />
        </>
    );
}