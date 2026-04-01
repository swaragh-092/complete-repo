// Author: Gururaj
// Created: 18th March 2026
// Description: Department work report component - shows per-department team member work log with expandable rows.
// Version: 1.0.0
// Modified:

import React, { useState } from "react";
import { Box, Typography, Paper, Accordion, AccordionSummary, AccordionDetails, CircularProgress, Alert, TextField, Stack, Chip, Divider, LinearProgress, Tooltip, IconButton } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RefreshIcon from "@mui/icons-material/Refresh";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Cell } from "recharts";
import { useDepartmentWorkLog } from "../hooks/useReports";
import { fmtMinutes, daysAgo, today } from "../utils/reportHelpers";
// import dayjs from "dayjs";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];

const statusColor = {
  defined: "#64748b",
  in_progress: "#3b82f6",
  review: "#f59e0b",
  completed: "#22c55e",
  blocked: "#ef4444",
};

const StoryRow = ({ story }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      py: 0.75,
      pl: 5,
      pr: 1,
      borderBottom: "1px solid",
      borderColor: "divider",
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, overflow: "hidden" }}>
      <AutoStoriesIcon sx={{ fontSize: 13, color: "text.secondary", flexShrink: 0 }} />
      <Typography variant="body2" noWrap sx={{ flex: 1 }}>
        {story.title}
      </Typography>
    </Box>
    <Stack direction="row" spacing={0.5} alignItems="center" flexShrink={0}>
      {story.status && (
        <Chip
          label={story.status.replace("_", " ")}
          size="small"
          sx={{
            bgcolor: statusColor[story.status] || "#64748b",
            color: "#fff",
            fontSize: "0.6rem",
            height: 18,
            textTransform: "capitalize",
          }}
        />
      )}
      {story.story_points && <Chip label={`${story.story_points}p`} size="small" variant="outlined" sx={{ fontSize: "0.6rem", height: 18 }} />}
      <Chip label={fmtMinutes(story.total_minutes)} size="small" color="primary" variant="outlined" sx={{ fontSize: "0.65rem", height: 18, minWidth: 50 }} />
    </Stack>
  </Box>
);

const FeatureAccordion = ({ feature, projectTotalMinutes }) => {
  const [open, setOpen] = useState(false);
  const pct = projectTotalMinutes > 0 ? Math.round((feature.total_minutes / projectTotalMinutes) * 100) : 0;

  return (
    <Box sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
      <Box
        onClick={() => setOpen((p) => !p)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          pl: 3,
          pr: 1,
          py: 1,
          cursor: "pointer",
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <AccountTreeIcon sx={{ fontSize: 15, color: "text.secondary" }} />
        <Typography variant="body2" fontWeight={500} sx={{ flex: 1 }}>
          {feature.feature_name}
        </Typography>
        <LinearProgress variant="determinate" value={pct} sx={{ width: 60, height: 4, borderRadius: 2 }} />
        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 32 }}>
          {pct}%
        </Typography>
        <Chip label={fmtMinutes(feature.total_minutes)} size="small" color="info" variant="outlined" sx={{ fontSize: "0.65rem" }} />
        <ExpandMoreIcon
          sx={{
            fontSize: 16,
            color: "text.secondary",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}
        />
      </Box>
      {open && (
        <Box>
          {feature.user_stories.map((s) => (
            <StoryRow key={s.user_story_id} story={s} />
          ))}
        </Box>
      )}
    </Box>
  );
};

const ProjectSection = ({ project }) => {
  const [open, setOpen] = useState(true);

  return (
    <Paper elevation={0} variant="outlined" sx={{ mb: 2, borderRadius: 2, overflow: "hidden" }}>
      <Box
        onClick={() => setOpen((p) => !p)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 1.5,
          cursor: "pointer",
          bgcolor: "action.hover",
          "&:hover": { bgcolor: "action.selected" },
        }}
      >
        <FolderOpenIcon color="warning" fontSize="small" />
        <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1 }}>
          {project.project_name}
        </Typography>
        <Chip icon={<AccessTimeIcon sx={{ fontSize: "0.85rem !important" }} />} label={fmtMinutes(project.total_minutes)} size="small" color="warning" variant="filled" />
        <ExpandMoreIcon
          sx={{
            fontSize: 18,
            color: "text.secondary",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}
        />
      </Box>

      {open && (
        <Box>
          {project.features.length === 0 ? (
            <Typography variant="caption" sx={{ px: 2, py: 1, display: "block", color: "text.secondary" }}>
              No features recorded.
            </Typography>
          ) : (
            project.features.map((f) => <FeatureAccordion key={f.feature_id} feature={f} projectTotalMinutes={project.total_minutes} />)
          )}
        </Box>
      )}
    </Paper>
  );
};

const DepartmentWorkReport = ({ departmentId }) => {
  const [startDate, setStartDate] = useState(daysAgo(29));
  const [endDate, setEndDate] = useState(today());

  const params = startDate && endDate ? { start_date: startDate, end_date: endDate } : {};
  const { data, isLoading, isError, refetch } = useDepartmentWorkLog(departmentId, params);

  const projects = data || [];
  const totalMinutes = projects.reduce((sum, p) => sum + (p.total_minutes || 0), 0);

  const chartData = projects
    .filter((p) => p.total_minutes > 0)
    .map((p, i) => ({
      name: p.project_name.length > 14 ? p.project_name.slice(0, 14) + "…" : p.project_name,
      minutes: p.total_minutes,
      hours: parseFloat((p.total_minutes / 60).toFixed(2)),
      color: COLORS[i % COLORS.length],
    }));

  return (
    <Box>
      {/* Controls */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <TextField label="From" type="date" size="small" value={startDate} onChange={(e) => setStartDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField label="To" type="date" size="small" value={endDate} onChange={(e) => setEndDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        <Tooltip title="Refresh">
          <IconButton onClick={() => refetch()} size="small">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        <Box sx={{ ml: "auto" }}>
          <Paper elevation={0} sx={{ px: 2, py: 0.75, bgcolor: "warning.main", color: "#fff", borderRadius: 2 }}>
            <Typography variant="body2" fontWeight={700}>
              Total: {fmtMinutes(totalMinutes)}
            </Typography>
          </Paper>
        </Box>
      </Stack>

      {/* Bar chart by project */}
      {chartData.length > 0 && (
        <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Typography variant="subtitle2" gutterBottom color="text.secondary">
            Time by Project
          </Typography>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="h" />
              <RTooltip formatter={(val) => [`${val}h`, "Hours"]} contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* Project breakdown */}
      {isLoading && (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      )}
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load department work report.
        </Alert>
      )}
      {!isLoading && projects.length === 0 && <Alert severity="info">No work sessions found for this department in the selected period.</Alert>}
      {projects.map((p) => (
        <ProjectSection key={p.project_id} project={p} />
      ))}
    </Box>
  );
};

export default DepartmentWorkReport;
