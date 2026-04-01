// Author: Gururaj
// Created: 18th March 2026
// Description: Daily work report component - shows per-day breakdown of tasks and time logs with accordion view.
// Version: 1.0.0
// Modified:

import React, { useState } from "react";
import { Box, Typography, Paper, Grid, Chip, Accordion, AccordionSummary, AccordionDetails, CircularProgress, Alert, TextField, Stack, Divider, Tooltip, IconButton } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RefreshIcon from "@mui/icons-material/Refresh";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from "recharts";
import { useDailyWorkLog } from "../hooks/useReports";
import { fmtMinutes, daysAgo, today } from "../utils/reportHelpers";
import dayjs from "dayjs";

const statusColor = {
  defined: "#64748b",
  in_progress: "#3b82f6",
  review: "#f59e0b",
  completed: "#22c55e",
  blocked: "#ef4444",
};

const SessionRow = ({ session }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      py: 0.75,
      px: 1,
      borderRadius: 1,
      "&:hover": { bgcolor: "action.hover" },
    }}
  >
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 280 }}>
        {session.user_story_title}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {session.feature_name} · {session.project_name}
        {session.sprint_name ? ` · ${session.sprint_name}` : ""}
      </Typography>
    </Box>

    <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
      {session.user_story_status && (
        <Chip
          label={session.user_story_status.replace("_", " ")}
          size="small"
          sx={{
            bgcolor: statusColor[session.user_story_status] || "#64748b",
            color: "#fff",
            fontSize: "0.65rem",
            textTransform: "capitalize",
          }}
        />
      )}
      <Typography variant="caption" color="text.secondary">
        {dayjs(session.start_time).format("HH:mm")} – {session.end_time ? dayjs(session.end_time).format("HH:mm") : "ongoing"}
      </Typography>
      <Chip label={fmtMinutes(session.duration_minutes)} size="small" color="primary" variant="outlined" sx={{ minWidth: 56, fontSize: "0.7rem" }} />
    </Stack>
  </Box>
);

const DayCard = ({ dayData }) => {
  const [open, setOpen] = useState(dayData.sessions.length > 0);
  const label = dayjs(dayData.date).format("ddd, MMM D");

  return (
    <Accordion expanded={open} onChange={() => setOpen((p) => !p)} disableGutters elevation={0} sx={{ border: "1px solid", borderColor: "divider", mb: 1, borderRadius: "8px !important" }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1 }}>
          <CalendarTodayIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" fontWeight={600}>
            {label}
          </Typography>
          <Chip icon={<AccessTimeIcon sx={{ fontSize: "0.85rem !important" }} />} label={fmtMinutes(dayData.total_minutes)} size="small" color={dayData.total_minutes > 0 ? "success" : "default"} variant="filled" sx={{ ml: "auto", mr: 1 }} />
          <Typography variant="caption" color="text.secondary">
            {dayData.sessions.length} session{dayData.sessions.length !== 1 ? "s" : ""}
          </Typography>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ pt: 0, px: 2 }}>
        <Divider sx={{ mb: 1 }} />
        {dayData.sessions.length === 0 ? (
          <Typography variant="caption" color="text.secondary">
            No work sessions recorded.
          </Typography>
        ) : (
          dayData.sessions.map((s) => <SessionRow key={s.id} session={s} />)
        )}
      </AccordionDetails>
    </Accordion>
  );
};

const DailyWorkReport = () => {
  const [startDate, setStartDate] = useState(daysAgo(13));
  const [endDate, setEndDate] = useState(today());

  const { data, isLoading, isError, refetch } = useDailyWorkLog({
    start_date: startDate,
    end_date: endDate,
  });

  const days = data || [];
  const totalMinutes = days.reduce((sum, d) => sum + (d.total_minutes || 0), 0);

  const chartData = days.map((d) => ({
    date: dayjs(d.date).format("MMM D"),
    minutes: d.total_minutes,
    hours: parseFloat((d.total_minutes / 60).toFixed(2)),
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

      {/* Bar chart */}
      {chartData.length > 0 && (
        <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Typography variant="subtitle2" gutterBottom color="text.secondary">
            Daily Hours Overview
          </Typography>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="h" />
              <RTooltip formatter={(val) => [`${val}h`, "Hours"]} contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* Day-by-day list */}
      {isLoading && (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      )}
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load daily work report.
        </Alert>
      )}
      {!isLoading && days.length === 0 && <Alert severity="info">No work sessions found for the selected date range. Start a timer on a user story to begin tracking.</Alert>}
      {days.map((d) => (
        <DayCard key={d.date} dayData={d} />
      ))}
    </Box>
  );
};

export default DailyWorkReport;
