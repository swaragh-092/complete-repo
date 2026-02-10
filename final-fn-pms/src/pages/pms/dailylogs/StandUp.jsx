import { useEffect, useState } from "react";
import Heading from "../../../components/Heading";
import { Box, Paper, Typography, CircularProgress, Grid, Chip, Divider, useTheme, Button } from "@mui/material";
import { colorCodes } from "../../../theme";
import DoButton from "../../../components/button/DoButton";
import CreateDialog from "../../../components/pms/CreateDialog";
import BACKEND_ENDPOINT from "../../../util/urls";
import backendRequest from "../../../util/request";
import { showToast } from "../../../util/feedback/ToastService";
import { convertMinutes, formatTextForDataTable } from "../../../util/helper";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { IconButton } from "@mui/material";
import { PlayArrow, Stop } from "@mui/icons-material";

const getPriorityColor = (priority) => {
  switch (priority) {
    case "High":
      return "error";
    case "Medium":
      return "warning";
    default:
      return "success";
  }
};

export default function StandUp() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState({state : false, for : ""});
  const [createStandup, setCreateStandup] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);

  useEffect(() => {
    loadTasks(1);
  }, []);

  const loadTasks = async (nextPage = 1) => {
    try {
      setLoading({state : true, for: "fetchlogs"});

      const response = await backendRequest({
        endpoint: BACKEND_ENDPOINT.get_today_log,
        querySets: `?page=${nextPage}`,
      });

      if (!response.success) showToast({ message: response.message || "Failed to fetch Daily Log", type: "error" });
      const apiData = response?.data?.data || [];
      const pagination = response?.data?.pagination || {};

      // Format the backend data for UI
      const formatted = apiData.map((item) => ({
        id: item.id,
        title: formatTextForDataTable(item.task?.title) || "No Title",
        priority: item.task?.priority || "Low",
        expected_duration: convertMinutes(item.expected_duration),
        worked_duration: item.task?.total_work_time ? convertMinutes(item.task?.total_work_time) : "",
        notes: item.notes,
        task: item.task,
      }));

      if (nextPage === 1) {
        setTasks(formatted);
      } else {
        setTasks((prev) => [...prev, ...formatted]);
      }

      setPage(pagination.currentPage || nextPage);
      setHasNextPage(pagination.hasNextPage || false);
    } catch (err) {
      console.error("Error fetching standup logs:", err);
    } finally {
      setLoading({state : false, for : ""});
    }
  };

  const handleTaskStatus = async (taskId, status) => {
    setLoading({state : true, for : "status_change"});
    const endpoint = status === "stop" ? BACKEND_ENDPOINT.stop_task : BACKEND_ENDPOINT.start_task(taskId);
    const response = await backendRequest({endpoint});
    showToast({message: response.message ?? (response.success ? `Task ${status}ed Successfully` : `Failed to ${status} Task`), type : response.success ? "success": "error" });
    setLoading({state : false, for : ""});
    if (response.success) {
      setTasks([]);
      setPage(1);
      loadTasks(1);
    }
  }

  return (
    <>
      <CreateDialog isOpen={createStandup} onClose={() => setCreateStandup(false)} usefor={"Stand Up"} backendEndpoint={BACKEND_ENDPOINT.create_stand_up} onSuccess={() => loadTasks(1)} formFields={addStandUpFormFields} />

      <Box display={"flex"} alignItems={"center"} justifyContent={"space-between"}>
        <Heading title={"Today's Stand Up"} level={3} giveMarginBottom={false} />

        <DoButton onclick={() => setCreateStandup(true)}>Add Standup</DoButton>
      </Box>

      {/* Stand-Up Tasks List */}
      <Box sx={{ p: 2 }}>
        {loading.state && loading.for === "fetchlogs" && (page === 1 || tasks.length === 0 ) ? (
          
          <Box sx={{ textAlign: "center", mt: 5 }}>
            <CircularProgress size={20} />
          </Box>
        ) : tasks && tasks.length === 0 ? (
          <>
            <Box sx={{ textAlign: "center", mt: 5 }}>No StandUp</Box>
          </>
        ) : (
          <>
            <Grid container spacing={2}>
              {tasks.map((task) => (
                <Grid item key={task.id} xs={12} sm={6} md={4} lg={3} sx={{ display: "flex", justifyContent: "center" }}>
                  <Paper
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      background: colors.background.light,
                      width: 260,
                      minHeight: 200,
                      position: "relative", // important for floating button
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.2,
                      boxShadow: "0px 3px 12px rgba(0,0,0,0.12)",
                    }}
                  >
                    {/* ------- Title + Priority ------- */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 700,
                          fontSize: "15px",
                          lineHeight: 1.3,
                          flexGrow: 1,
                          pr: 1,
                        }}
                      >
                        {task.title}
                      </Typography>

                      <Chip label={task.priority} size="small" color={getPriorityColor(task.priority)} sx={{ fontWeight: 600, height: 22 }} />
                    </Box>

                    <Divider sx={{ opacity: 0.2 }} />

                    {/* ------- Details Section ------- */}
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.6 }}>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        <strong>Status:</strong> {formatTextForDataTable(task.task.status) || "-"}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        <strong>Expected Duration:</strong> {task.expected_duration || "-"} hrs
                      </Typography>

                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        <strong>Worked So Far:</strong> {task.worked_duration ? `${task.worked_duration} hrs` : "Not started"}
                      </Typography>

                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        <strong>Notes:</strong> {task.notes || <span style={{ opacity: 0.5 }}>No notes added</span>}
                      </Typography>
                    </Box>

                    {/* ------- Floating Start/Stop Button (Nice Placement) ------- */}

                    {
                      ( task.task.status === "approved" || task.task.status === "in_progress" ) && (
                        <IconButton
                          size="small"
                          onClick={() => {
                            handleTaskStatus(task.task.id, task.task.live_status === "running" ? "stop" : "start");
                          }}
                          disabled={loading.state && loading.for === "status_change"} 
                          sx={{
                            position: "absolute",
                            bottom: 12,
                            right: 12,
                            background: task.task.live_status === "running" ? "#f44336" : "#4caf50",
                            color: "#fff",
                            width: 32,
                            height: 32,
                            boxShadow: "0px 3px 8px rgba(0,0,0,0.25)",
                            "&:hover": {
                              background: task.task.live_status === "running" ? "#d32f2f" : "#388e3c",
                            },
                          }}
                        >
                          {task.task.live_status === "running" ? <Stop sx={{ fontSize: 18 }} /> : <PlayArrow sx={{ fontSize: 18 }} />}
                        </IconButton>
                      )
                    }
                    
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Pagination Show More Button */}
            {hasNextPage && (
              <Box textAlign="center" mt={2}>
                <Button variant="contained" onClick={() => loadTasks(page + 1)} disabled={loading}>
                  {loading ? "Loading..." : "Show More"}
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>
    </>
  );
}

const addStandUpFormFields = [
  { type: "auto_search", name: "task_id", label: "Task", fetchUrl: BACKEND_ENDPOINT.my_task_for_standup, mapResponse: (task) => ({ name: "task_id", id: task.id, value: task.title, label: task.title }) },
  { type: "text", name: "expected_duration", label: "Expected Duration", placeholder: "hh:mm", validationName: "stand_up_duration" },
  { type: "textarea", name: "notes", label: "Notes", require: false },
];
