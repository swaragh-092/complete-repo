// import { useEffect, useState } from "react";
// import Header from "../../../components/Header";
// import { Box, Paper, Typography, CircularProgress, Grid, Chip, Divider, useTheme } from "@mui/material";
// import { colorCodes } from "../../../theme";

// export default function OtherTasks() {
//   const [tasks, setTasks] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const theme = useTheme();
//   const colors = colorCodes(theme.palette.mode);

//   useEffect(() => {
//     loadDummyData();
//   }, []);

//   const loadDummyData = () => {

    
//     // const dummyTasks = [
//     //   {
//     //     id: 1,
//     //     title: "Refactor User Service",
//     //     type: "Feature",
//     //     worked_duration: "02:15",
//     //   },
//     //   {
//     //     id: 2,
//     //     title: "Update Documentation",
//     //     type: "Documentation",
//     //     worked_duration: "01:00",
//     //   },
//     //   {
//     //     id: 3,
//     //     title: "Fix Notifications Bug",
//     //     type: "Bug",
//     //     worked_duration: "", // currently being worked
//     //   },
//     // ];

    

//     setTasks(dummyTasks);
//     setTimeout(() => setLoading(false), 400);
//   };

//   return (
//     <>
//       <Header title={"Other Tasks Worked"} level={3} />

//       <Box sx={{ p: 2 }}>
//         {loading ? (
//           <Box sx={{ textAlign: "center", mt: 5 }}>
//             <CircularProgress />
//           </Box>
//         ) : (
//           <Grid container spacing={2}>
//             {tasks.map((task) => (
//               <Grid
//                 item
//                 key={task.id}
//                 xs={12}
//                 sm={6}
//                 md={4}
//                 lg={3}
//                 sx={{ display: "flex", justifyContent: "center" }}
//               >
//                 <Paper
//                   sx={{
//                     p: 2.5,
//                     borderRadius: 3,
//                     background: colors.background.light,
//                     boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
//                     width: "260px",
//                     minHeight: "130px",
//                     display: "flex",
//                     flexDirection: "column",
//                     justifyContent: "space-between",
//                   }}
//                 >
//                   <Box sx={{ width: "100%" }}>
//                     <Box
//                       sx={{
//                         display: "flex",
//                         justifyContent: "space-between",
//                         mb: 1,
//                         width: "100%",
//                       }}
//                     >
//                       <Typography
//                         variant="subtitle1"
//                         sx={{
//                           fontWeight: 700,
//                           fontSize: "15px",
//                           maxWidth: "75%",
//                           whiteSpace: "normal",
//                           lineHeight: 1.3,
//                         }}
//                       >
//                         {task.title}
//                       </Typography>

//                       <Chip
//                         label={task.type}
//                         size="small"
//                         sx={{ fontWeight: 600, height: 22 }}
//                       />
//                     </Box>

//                     <Divider sx={{ opacity: 0.2, my: 1 }} />

//                     <Typography variant="body2" sx={{ opacity: 0.8 }}>
//                       <strong>Worked: </strong>
//                       {task.worked_duration ? task.worked_duration + " hrs" : "Working currently"}
//                     </Typography>
//                   </Box>
//                 </Paper>
//               </Grid>
//             ))}
//           </Grid>
//         )}
//       </Box>
//     </>
//   );
// }
import { useEffect, useState } from "react";
import Heading from "../../../components/Heading";
import { Box, Paper, Typography, CircularProgress, Grid, Chip, Divider, useTheme, Button } from "@mui/material";
import { colorCodes } from "../../../theme";
import BACKEND_ENDPOINT from "../../../util/urls";
import backendRequest from "../../../util/request";
import { showToast } from "../../../util/feedback/ToastService";
import { convertMinutes, formatTextForDataTable } from "../../../util/helper";
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

export default function OtherTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState({state : false, for : ""});
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
        endpoint: BACKEND_ENDPOINT.get_tasks_no_log,
        querySets: `?page=${nextPage}`,
      });

      if (!response.success) showToast({ message: response.message || "Failed to fetch Daily Log", type: "error" });
      const apiData = response?.data?.data || [];
      const pagination = response?.data?.pagination || {};

      // Format the backend data for UI
      const formatted = apiData.map((item) => ({
        id: item.id,
        title: formatTextForDataTable(item.title) || "No Title",
        priority: item.priority || "Low",
        worked_duration: item.todays_worked_time ? convertMinutes(item.todays_worked_time) : "",
        status: item.status,
        live_status : item.live_status
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

      <Heading title={"Other Tasks Worked"} level={3} />

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
                      minHeight: 150,
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
                        <strong>Status:</strong> {formatTextForDataTable(task.status) || "-"}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        <strong>Worked So Far:</strong> {task.worked_duration ? `${task.worked_duration}` : "Not started"}
                      </Typography>

                    </Box>

                    {/* ------- Floating Start/Stop Button (Nice Placement) ------- */}

                    {
                      ( task.status === "approved" || task.status === "in_progress" ) && (
                        <IconButton
                          size="small"
                          onClick={() => {
                            handleTaskStatus(task.id, task.live_status === "running" ? "stop" : "start");
                          }}
                          disabled={loading.state && loading.for === "status_change"} 
                          sx={{
                            position: "absolute",
                            bottom: 12,
                            right: 12,
                            background: task.live_status === "running" ? "#f44336" : "#4caf50",
                            color: "#fff",
                            width: 32,
                            height: 32,
                            boxShadow: "0px 3px 8px rgba(0,0,0,0.25)",
                            "&:hover": {
                              background: task.live_status === "running" ? "#d32f2f" : "#388e3c",
                            },
                          }}
                        >
                          {task.live_status === "running" ? <Stop sx={{ fontSize: 18 }} /> : <PlayArrow sx={{ fontSize: 18 }} />}
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
