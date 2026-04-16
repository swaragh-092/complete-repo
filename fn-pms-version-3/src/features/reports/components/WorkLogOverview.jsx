// Author: Gururaj
// Created: 18th March 2026
// Description: Work log overview report component - displays aggregated work hours across users and projects.
// Version: 1.0.0
// Modified:

// import React, { useState } from "react";
import { Box, Grid, Paper, Typography, Chip, CircularProgress, Alert, Stack, Avatar, Divider } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import BusinessIcon from "@mui/icons-material/Business";
import TodayIcon from "@mui/icons-material/Today";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from "recharts";
import { useWorkLogOverview } from "../hooks/useReports";
import { fmtMinutes, daysAgo, today } from "../utils/reportHelpers";
import dayjs from "dayjs";

const StatCard = ({ icon, label, value, color }) => (
  <Paper elevation={0} variant="outlined" sx={{ p: 2, borderRadius: 2, display: "flex", alignItems: "center", gap: 2 }}>
    <Avatar sx={{ bgcolor: color, width: 44, height: 44 }}>{icon}</Avatar>
    <Box>
      <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  </Paper>
);

const WorkLogOverview = ({ defaultDays = 29 }) => {
  const params = { start_date: daysAgo(defaultDays), end_date: today() };
  const { data, isLoading, isError } = useWorkLogOverview(params);

  const d = data;
  const grandTotal = d?.grand_total_minutes || 0;
  const byDay = d?.by_day || [];
  const byProject = d?.by_project || [];
  const byDept = d?.by_department || [];

  const chartData = byDay.map((row) => ({
    date: dayjs(row.date).format("MMM D"),
    hours: parseFloat((row.total_minutes / 60).toFixed(2)),
  }));

  if (isLoading) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (isError) {
    return <Alert severity="error">Failed to load overview data.</Alert>;
  }

  const activeDays = byDay.filter((d) => d.total_minutes > 0).length;
  const avgPerDay = activeDays > 0 ? Math.round(grandTotal / activeDays) : 0;

  return (
    <Box>
      {/* Stat cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<AccessTimeIcon />} label={`Total logged (last ${defaultDays + 1} days)`} value={fmtMinutes(grandTotal)} color="primary.main" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<TodayIcon />} label="Avg per active day" value={fmtMinutes(avgPerDay)} color="success.main" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<FolderOpenIcon />} label="Projects worked on" value={byProject.length} color="warning.main" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<BusinessIcon />} label="Departments active" value={byDept.length} color="info.main" />
        </Grid>
      </Grid>

      {/* Activity trend */}
      {chartData.length > 0 && (
        <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Typography variant="subtitle2" gutterBottom color="text.secondary">
            Work Activity — Last {defaultDays + 1} Days
          </Typography>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -10 }}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} unit="h" />
              <RTooltip formatter={(v) => [`${v}h`, "Hours"]} contentStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={2} fill="url(#colorHours)" />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* Projects breakdown */}
      {byProject.length > 0 && (
        <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Typography variant="subtitle2" gutterBottom color="text.secondary">
            By Project
          </Typography>
          {byProject
            .sort((a, b) => b.total_minutes - a.total_minutes)
            .map((p) => {
              const pct = grandTotal > 0 ? Math.round((p.total_minutes / grandTotal) * 100) : 0;
              return (
                <Box key={p.project_id} sx={{ mb: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
                    <Typography variant="body2" fontWeight={500}>
                      {p.project_name}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Typography variant="caption" color="text.secondary">
                        {p.unique_stories} stories · {p.session_count} sessions
                      </Typography>
                      <Chip label={fmtMinutes(p.total_minutes)} size="small" color="primary" variant="outlined" sx={{ fontSize: "0.65rem", height: 18 }} />
                    </Stack>
                  </Box>
                  <Box
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: "action.hover",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        height: "100%",
                        width: `${pct}%`,
                        bgcolor: "primary.main",
                        borderRadius: 3,
                        transition: "width 0.4s",
                      }}
                    />
                  </Box>
                </Box>
              );
            })}
        </Paper>
      )}

      {grandTotal === 0 && <Alert severity="info">No work logged yet. Start a timer on a user story to begin tracking your time.</Alert>}
    </Box>
  );
};

export default WorkLogOverview;
