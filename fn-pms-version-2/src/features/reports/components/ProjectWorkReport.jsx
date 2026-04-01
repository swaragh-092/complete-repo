// Author: Gururaj
// Created: 18th March 2026
// Description: Project work report component - shows per-project work log breakdown with story and task details.
// Version: 1.0.0
// Modified:

import React, { useState } from "react";
import { Box, Typography, Paper, Accordion, AccordionSummary, AccordionDetails, CircularProgress, Alert, TextField, Stack, Chip, Divider, LinearProgress, Tooltip, IconButton } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RefreshIcon from "@mui/icons-material/Refresh";
import { PieChart, Pie, Cell, Tooltip as RTooltip, Legend, ResponsiveContainer } from "recharts";
import { useProjectWorkLog } from "../hooks/useReports";
import { fmtMinutes, daysAgo, today } from "../utils/reportHelpers";
import dayjs from "dayjs";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];

const statusColor = {
  defined: "#64748b",
  in_progress: "#3b82f6",
  review: "#f59e0b",
  completed: "#22c55e",
  blocked: "#ef4444",
};

const UserStoryRow = ({ story, featureTotalMinutes }) => {
  const [open, setOpen] = useState(false);
  const pct = featureTotalMinutes > 0 ? Math.round((story.total_minutes / featureTotalMinutes) * 100) : 0;

  return (
    <Accordion expanded={open} onChange={() => setOpen((p) => !p)} disableGutters elevation={0} sx={{ "&:before": { display: "none" }, borderBottom: "1px solid", borderColor: "divider" }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />} sx={{ pl: 2, pr: 1, minHeight: 44 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, overflow: "hidden" }}>
          <AutoStoriesIcon sx={{ fontSize: 14, color: "text.secondary", flexShrink: 0 }} />
          <Typography variant="body2" noWrap sx={{ flex: 1 }}>
            {story.title}
          </Typography>
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
                flexShrink: 0,
              }}
            />
          )}
          {story.story_points && <Chip label={`${story.story_points} pts`} size="small" variant="outlined" sx={{ fontSize: "0.6rem", height: 18, flexShrink: 0 }} />}
          <Chip icon={<AccessTimeIcon sx={{ fontSize: "0.8rem !important" }} />} label={fmtMinutes(story.total_minutes)} size="small" color="primary" variant="outlined" sx={{ fontSize: "0.7rem", flexShrink: 0 }} />
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 3, pt: 0 }}>
        <Box sx={{ mb: 1 }}>
          <LinearProgress variant="determinate" value={pct} sx={{ height: 4, borderRadius: 2 }} />
          <Typography variant="caption" color="text.secondary">
            {pct}% of feature time
          </Typography>
        </Box>
        {story.sessions.map((s) => (
          <Box
            key={s.id}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              py: 0.5,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {dayjs(s.log_date).format("ddd, MMM D")}
              {s.sprint_name ? ` · ${s.sprint_name}` : ""}
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="caption" color="text.secondary">
                {dayjs(s.start_time).format("HH:mm")} – {s.end_time ? dayjs(s.end_time).format("HH:mm") : "ongoing"}
              </Typography>
              <Chip label={fmtMinutes(s.duration_minutes)} size="small" color="success" variant="outlined" sx={{ fontSize: "0.65rem", height: 18 }} />
            </Stack>
          </Box>
        ))}
      </AccordionDetails>
    </Accordion>
  );
};

const FeatureSection = ({ feature }) => {
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
          py: 1.25,
          cursor: "pointer",
          bgcolor: "action.hover",
          "&:hover": { bgcolor: "action.selected" },
        }}
      >
        <AccountTreeIcon fontSize="small" color="primary" />
        <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1 }}>
          {feature.feature_name}
        </Typography>
        <Chip icon={<AccessTimeIcon sx={{ fontSize: "0.85rem !important" }} />} label={fmtMinutes(feature.total_minutes)} size="small" color="primary" variant="filled" />
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
          {feature.user_stories.length === 0 ? (
            <Typography variant="caption" sx={{ px: 2, py: 1, display: "block", color: "text.secondary" }}>
              No user stories recorded.
            </Typography>
          ) : (
            feature.user_stories.map((s) => <UserStoryRow key={s.user_story_id} story={s} featureTotalMinutes={feature.total_minutes} />)
          )}
        </Box>
      )}
    </Paper>
  );
};

const ProjectWorkReport = ({ projectId }) => {
  const [startDate, setStartDate] = useState(daysAgo(29));
  const [endDate, setEndDate] = useState(today());

  const params = startDate && endDate ? { start_date: startDate, end_date: endDate } : {};
  const { data, isLoading, isError, refetch } = useProjectWorkLog(projectId, params);

  const features = data || [];
  const totalMinutes = features.reduce((sum, f) => sum + (f.total_minutes || 0), 0);

  // Pie chart data — top features by time
  const pieData = features
    .filter((f) => f.total_minutes > 0)
    .map((f, i) => ({
      name: f.feature_name,
      value: f.total_minutes,
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
          <Paper elevation={0} sx={{ px: 2, py: 0.75, bgcolor: "primary.main", color: "#fff", borderRadius: 2 }}>
            <Typography variant="body2" fontWeight={700}>
              Total: {fmtMinutes(totalMinutes)}
            </Typography>
          </Paper>
        </Box>
      </Stack>

      {/* Pie chart */}
      {pieData.length > 0 && (
        <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Typography variant="subtitle2" gutterBottom color="text.secondary">
            Time by Feature
          </Typography>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name.length > 12 ? name.slice(0, 12) + "…" : name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <RTooltip formatter={(val) => fmtMinutes(val)} contentStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* Feature breakdown */}
      {isLoading && (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      )}
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load project work report.
        </Alert>
      )}
      {!isLoading && features.length === 0 && <Alert severity="info">No work sessions found for this project in the selected period.</Alert>}
      {features.map((f) => (
        <FeatureSection key={f.feature_id} feature={f} />
      ))}
    </Box>
  );
};

export default ProjectWorkReport;
