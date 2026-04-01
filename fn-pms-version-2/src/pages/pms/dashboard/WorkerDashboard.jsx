// Author: Gururaj
// Created: 19th Jun 2025
// Description: Worker Dashboard showing assigned tasks, user stories, and live timer for the current user.
// Version: 1.0.0
// Modified:

import { useState, useEffect } from "react";
import { Box, Button, Divider, Grid, Paper, Skeleton, Stack, Typography } from "@mui/material";
import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import PlayCircleOutlineOutlinedIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import TodayOutlinedIcon from "@mui/icons-material/TodayOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import BugReportOutlinedIcon from "@mui/icons-material/BugReportOutlined";
import PriorityHighOutlinedIcon from "@mui/icons-material/PriorityHighOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import { useNavigate } from "react-router-dom";
import Heading from "../../../components/Heading";
import ImmediateAttention from "./ImmediateAttention";
import SummaryView from "./SummaryView";
import backendRequest from "../../../util/request";
import BACKEND_ENDPOINT, { paths } from "../../../util/urls";
import { showToast } from "../../../util/feedback/ToastService";

/* ─── Small stat tile used in the top strip ─────────────────────────────── */
const StatTile = ({ label, value, color, icon: Icon, onClick }) => (
  <Paper
    onClick={onClick}
    sx={{
      p: 2,
      borderRadius: 2,
      borderLeft: `4px solid ${color}`,
      cursor: onClick ? "pointer" : "default",
      "&:hover": onClick ? { boxShadow: 4 } : {},
      transition: "box-shadow 0.2s",
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

/* ─── User Stories progress CTA banner ──────────────────────────────────── */
const UserStoriesBanner = ({ navigate }) => {
  return (
    <Paper sx={{ p: 2, mb: 3, borderRadius: 2, borderLeft: "4px solid #1976d2", bgcolor: "background.paper" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={1} alignItems="center">
          <AssignmentIndOutlinedIcon sx={{ color: "#1976d2" }} />
          <Box>
            <Typography fontWeight={600}>Track your User Stories</Typography>
            <Typography variant="caption" color="text.secondary">
              View and manage user story progress across projects
            </Typography>
          </Box>
        </Stack>
        <Button variant="contained" size="small" onClick={() => navigate(paths.user_stories)}>
          View Stories
        </Button>
      </Stack>
    </Paper>
  );
};

/* ─── Main Worker / Member Dashboard ────────────────────────────────────── */
const WorkerDash = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      const response = await backendRequest({ endpoint: BACKEND_ENDPOINT.member_dashboard });
      if (response.success) {
        setData(response.data);
      } else {
        showToast({ type: "error", message: response.message || "Failed to load dashboard." });
      }
      setLoading(false);
    };
    fetchDashboard();
  }, []);

  /* Build task/issue data structures for existing sub-components */
  const taskData = {
    in_progress: {
      title: "In Progress",
      count: data?.user_stories?.in_progress || 0,
      icon_name: "PlayCircleOutlineOutlinedIcon",
      color: "#1976d2",
      navigate: `${paths.user_stories}`,
    },
    approved: {
      title: "Completed",
      count: data?.user_stories?.completed || 0,
      icon_name: "CheckCircleOutlineOutlinedIcon",
      color: "#43a047",
      navigate: `${paths.user_stories}`,
    },
    blocked: {
      title: "Blocked",
      count: data?.user_stories?.blocked || 0,
      icon_name: "BlockOutlinedIcon",
      color: "#d32f2f",
      navigate: `${paths.user_stories}`,
    },
    approve_pending: {
      title: "Awaiting Review",
      count: data?.user_stories?.review || 0,
      icon_name: "HourglassEmptyOutlinedIcon",
      color: "#6c757d",
      navigate: `${paths.user_stories}`,
    },
    overdue: {
      title: "Overdue",
      count: data?.user_stories?.overdue || 0,
      icon_name: "WarningAmberOutlinedIcon",
      color: "#d32f2f",
      navigate: `${paths.user_stories}`,
    },
  };

  const issueData = {
    open: {
      title: "Open Issues",
      count: data?.issues?.open || 0,
      icon_name: "BugReportOutlinedIcon",
      color: "#1976d2",
      navigate: `${paths.issues}?status=open`,
    },
    high_priority: {
      title: "High / Critical",
      count: data?.issues?.high_priority || 0,
      icon_name: "PriorityHighOutlinedIcon",
      color: "#d32f2f",
      navigate: `${paths.issues}?priority=high`,
    },
  };

  const isLead = data?.role?.is_lead;

  return (
    <Box padding={2}>
      {/* ── Header ─────────────────────────────── */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Heading title="My Dashboard" />
      </Stack>

      {/* ── Top KPI strip ─────────────────────── */}
      {loading ? (
        <Grid container spacing={2} mb={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid key={i} item xs={6} md={3}>
              <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} md={3}>
            <StatTile label="Active Stories" value={data?.user_stories?.total_active || 0} color="#1976d2" icon={AssignmentIndOutlinedIcon} onClick={() => navigate(paths.user_stories)} />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatTile label="Blocked" value={data?.user_stories?.blocked || 0} color="#d32f2f" icon={BlockOutlinedIcon} onClick={() => navigate(paths.user_stories)} />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatTile label="Overdue" value={data?.user_stories?.overdue || 0} color="#ff9800" icon={WarningAmberOutlinedIcon} onClick={() => navigate(paths.user_stories)} />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatTile label="Active Projects" value={data?.projects?.active || 0} color="#43a047" icon={FolderOpenOutlinedIcon} onClick={() => navigate(paths.projects())} />
          </Grid>
        </Grid>
      )}

      {/* ── Lead-only: pending approvals CTA ──── */}
      {!loading && isLead && (data?.user_stories?.pending_review || 0) > 0 && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2, borderLeft: "4px solid #1976d2", bgcolor: "background.paper" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <HowToRegIcon sx={{ color: "#1976d2" }} />
              <Box>
                <Typography fontWeight={600}>
                  {data.user_stories.pending_review} story{data.user_stories.pending_review > 1 ? "ies" : "y"} pending review
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Review and approve user stories submitted by your team
                </Typography>
              </Box>
            </Stack>
            <Button variant="contained" size="small" onClick={() => navigate(paths.user_stories)}>
              Review
            </Button>
          </Stack>
        </Paper>
      )}

      {/* ── User Stories banner ──────────────────────── */}
      {!loading && <UserStoriesBanner navigate={navigate} />}

      {/* ── Immediate Attention ─────────────────── */}
      {!loading && <ImmediateAttention issueData={issueData} taskData={taskData} />}

      {/* ── Task Summary ────────────────────────── */}
      <Heading title="My User Stories Summary" level={3} />
      {loading ? (
        <Grid container spacing={2} pb={3}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Grid key={i} item xs={12} md={3}>
              <Skeleton variant="rectangular" height={90} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <SummaryView data={taskData} />
      )}

      <Divider sx={{ my: 2 }} />

      {/* ── Issue Summary ───────────────────────── */}
      <Heading title="Issues in My Department" level={3} />
      {loading ? (
        <Grid container spacing={2} pb={3}>
          {[1, 2].map((i) => (
            <Grid key={i} item xs={12} md={3}>
              <Skeleton variant="rectangular" height={90} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <SummaryView data={issueData} />
      )}
    </Box>
  );
};

export default WorkerDash;
