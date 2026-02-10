import { useEffect, useState } from "react";
import { showToast } from "../../../../util/feedback/ToastService";
import backendRequest from "../../../../util/request";
import BACKEND_ENDPOINT from "../../../../util/urls";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Typography,
  Divider,
  Skeleton,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Grid,
  useTheme,
} from "@mui/material";
import DoButton from "../../../../components/button/DoButton";
import { colorCodes } from "../../../../theme";

export default function CurrentTask({ task, setTask = () => {}, refresh, setRefresher = () => {} }) {
  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTask = async () => {
      setLoading(true);
      try {
        const response = await fetchCorrentWrokingTask();

        if (response.success && Array.isArray(response.data) && response.data.length > 0) {
          setTask(response.data[0]);
        } else {
          setTask(null);
        }
      } catch (error) {
        console.error("Error fetching current task:", error);
        showToast({
          message: "Error fetching current task",
          type: "error",
        });
        setTask(null);
      } finally {
        setLoading(false);
      }
    };

    // ✅ Fetch only when explicitly refreshed or when no task exists
    if ( refresh ) {
      fetchTask();
      setRefresher(false);
    }
  }, [refresh]); // Removed `task` dependency to avoid infinite loops

  const handleStopTask = async () => {
    if (!task) return;

    setLoading(true);
    try {
      const response = await backendRequest({
        endpoint: BACKEND_ENDPOINT.stop_task,
      });

      showToast({
        message:
          response.message ||
          (response.success ? "Task stopped successfully" : "Failed to stop task"),
        type: response.success ? "success" : "error",
      });

      if (response.success) {
        setRefresher(true);
      }
    } catch (error) {
      console.error("Error stopping task:", error);
      showToast({ message: "Failed to stop task", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      

      {loading ? (
        <Card sx={{ p: 2 }}>
          <Skeleton variant="text" width="60%" height={28} />
          <Skeleton variant="text" width="80%" height={18} />
          <Skeleton variant="rectangular" width="100%" height={60} sx={{ mt: 1.5 }} />
        </Card>
      ) : !task ? (
        <Card
          sx={{
            p: 4,
            textAlign: "center",
            color: "text.secondary",
            border: "1px dashed #ccc",
            borderRadius: 2,
          }}
        >
          <Typography variant="body2">No current task in progress</Typography>
        </Card>
      ) : (
        <>
          <Card
            sx={{
              width: "100%",
              borderRadius: 2,
              background: `linear-gradient(135deg, ${colors.background.modrate} 0%, ${colors.background.light} 100%)`,
              boxShadow: "0 3px 8px rgba(0,0,0,0.05)",
              border: `1px solid colors.background.dark`,
              p: 3,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            {/* Example inside content */}
            <Box display={"flex"} alignItems={"center"} justifyContent={"space-between"}>
              <Typography variant="h4" sx={{ fontWeight: 600,  color: colors.text.dark }}>
                {task.title.replace(/\b\w/g, (char) => char.toUpperCase())} ( <strong>Priority</strong> : {task.priority} )
              </Typography>
              <DoButton extraStyles={{bgcolor: colors.error.modrate, color: "#fff"}} onclick={handleStopTask} >Stop</DoButton>
            </Box>
            
            <Typography sx={{ color: colors.text.light, fontSize: "0.75rem", }}>
              {task.description.charAt(0).toUpperCase() + task.description.slice(1)}
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mt: 1 }}>
              <Typography sx={{ color: colors.text.light, fontSize: "0.95rem", }} >
                <strong>Project</strong> : {task.project?.name}
              </Typography> 
              
              <Typography sx={{ color: colors.text.dark, fontSize: "0.95rem", }} >
                <strong>Status</strong> : {task.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
              </Typography> 
              <Typography sx={{ color: colors.text.dark, fontSize: "0.95rem", }} >
                <strong>Type</strong> : {task.task_for}
              </Typography> 
               <Typography sx={{ color: colors.success.dark, fontSize: "0.95rem", }} >
                <strong>Started At</strong> : {new Date(task.last_start_time).toLocaleString()}
              </Typography>
              <Typography sx={{ color: colors.error.dark, fontSize: "0.95rem", }} >
                <strong>Total Worked Time</strong> : {`${Math.floor(task.total_work_time / 60)} hr ${task.total_work_time % 60} min`}
              </Typography> 
              <Typography sx={{ color: colors.error.dark, fontSize: "0.95rem",  }} >
                <strong>Due Date</strong> : {task.due_date}
              </Typography> 
             
              {task.helpedTask && (
                <>
                <Typography sx={{ color: colors.text.dark, fontSize: "0.95rem", }} >
                  <strong>Helping For</strong> : {task.helpedTask.title}
                </Typography> 
                </>
                )
              }
              {task.issue && (
                <>
                <Typography sx={{ color: colors.text.dark, fontSize: "0.95rem", }} >
                  <strong>Solving for</strong> : {task.issue.title}
                </Typography> 
                </>
                )
              }
              {task.checklist && (
                <>
                <Typography sx={{ color: colors.text.dark, fontSize: "0.95rem", }} >
                  <strong>Checklist</strong> : {task.checklist.title}
                </Typography>
                </>
                )
              }
            </Box>
          </Card>
        </>
      )}
    </Box>
  );
}


async function fetchCorrentWrokingTask () {
    const endpoint = BACKEND_ENDPOINT.working_tasks;
    const response = await backendRequest({endpoint});
    if (!response.success) showToast({ message: response.message ?? "Failed to Fetch Working task", type: "error" });
    return response;
}