import { useEffect, useState } from "react";
import { Box, Card, Chip, Grid, Paper, Skeleton, Stack, Typography } from "@mui/material";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import PlayCircleOutlineOutlinedIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

import backendRequest from "../../../../util/request";
import BACKEND_ENDPOINT from "../../../../util/urls";
import { showToast } from "../../../../util/feedback/ToastService";

const KPI = ({ label, value, color, icon: Icon }) => (
  <Paper
    sx={{
      p: 2,
      borderRadius: 2,
      borderLeft: `4px solid ${color}`,
      height: "100%",
    }}
  >
    <Stack direction="row" alignItems="center" spacing={1.5}>
      {Icon && <Icon sx={{ color, fontSize: 28 }} />}
      <Box>
        <Typography variant="h5" fontWeight={700}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>
          {label}
        </Typography>
      </Box>
    </Stack>
  </Paper>
);

const MemberProjectOverview = ({ refresh }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const response = await backendRequest({
        endpoint: BACKEND_ENDPOINT.member_dashboard,
      });
      if (response.success) {
        setData(response.data);
      } else {
        showToast({
          type: "error",
          message: response.message || "Failed to load project overview.",
        });
      }
      setLoading(false);
    };
    fetchData();
  }, [refresh]);

  const kpis = [
    {
      label: "Active Projects",
      value: data?.projects?.active ?? 0,
      color: "#1976d2",
      icon: FolderOpenOutlinedIcon,
    },
    {
      label: "In Progress",
      value: data?.tasks?.in_progress ?? 0,
      color: "#43a047",
      icon: PlayCircleOutlineOutlinedIcon,
    },
    {
      label: "Awaiting Approval",
      value: data?.tasks?.approve_pending ?? 0,
      color: "#6c757d",
      icon: HourglassEmptyOutlinedIcon,
    },
    {
      label: "Blocked",
      value: data?.tasks?.blocked ?? 0,
      color: "#d32f2f",
      icon: BlockOutlinedIcon,
    },
    {
      label: "Overdue",
      value: data?.tasks?.overdue ?? 0,
      color: "#ff9800",
      icon: WarningAmberOutlinedIcon,
    },
    {
      label: "Total Active Tasks",
      value: data?.tasks?.total_active ?? 0,
      color: "#7b1fa2",
      icon: AssignmentOutlinedIcon,
    },
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Card sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="subtitle2" fontWeight={700} color="primary.main">
            MY PROJECT OVERVIEW
          </Typography>
        </Stack>

        {loading ? (
          <Grid container spacing={2}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid key={i} item xs={6} sm={4} md={2}>
                <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Grid container spacing={2}>
            {kpis.map((kpi) => (
              <Grid key={kpi.label} item xs={6} sm={4} md={2}>
                <KPI {...kpi} />
              </Grid>
            ))}
          </Grid>
        )}
      </Card>
    </Box>
  );
};

export default MemberProjectOverview;
