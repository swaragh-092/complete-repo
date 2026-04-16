// Author: Copilot
// Created: 30th Mar 2026
// Description: Admin / Owner monitoring dashboard — full visibility across users,
//              projects, departments and features with Excel export.
// Version: 1.0.0

import React, { useState, useMemo, useCallback } from "react";
import { Box, Grid, Paper, Typography, Chip, Avatar, Tab, Tabs, TextField, MenuItem, IconButton, Tooltip, CircularProgress, Alert, Stack, Divider, LinearProgress, Table, TableHead, TableBody, TableRow, TableCell, TableContainer, TablePagination, Badge } from "@mui/material";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import BusinessIcon from "@mui/icons-material/Business";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BarChartIcon from "@mui/icons-material/BarChart";
import TableChartIcon from "@mui/icons-material/TableChart";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import dayjs from "dayjs";

import { useAdminSummary, useAdminUsers, useAdminProjects, useAdminDepartments, useAdminFeatures, useAdminWorkLogs, reportKeys } from "../../../features/reports";
import { fmtMinutes, daysAgo, today } from "../../../features/reports/utils/reportHelpers";
import { useOrganization } from "../../../context/OrganizationContext";
import { useWorkspace } from "../../../context/WorkspaceContext";

// ─── Constants ────────────────────────────────────────────────────────────────

const PIE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];

const STATUS_COLOR = {
  defined: "#64748b",
  in_progress: "#3b82f6",
  review: "#f59e0b",
  completed: "#22c55e",
  blocked: "#ef4444",
  ongoing: "#3b82f6",
  completed_project: "#22c55e",
  on_hold: "#f59e0b",
};

const DATE_PRESETS = [
  { label: "Last 7 days", days: 6 },
  { label: "Last 30 days", days: 29 },
  { label: "Last 90 days", days: 89 },
  { label: "Last 180 days", days: 179 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function TabPanel({ children, value, index }) {
  return value === index ? <Box pt={2}>{children}</Box> : null;
}

const StatCard = ({ icon, label, value, color = "primary.main", sub }) => (
  <Paper elevation={0} variant="outlined" sx={{ p: 2, borderRadius: 2, display: "flex", alignItems: "center", gap: 2, height: "100%" }}>
    <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>{icon}</Avatar>
    <Box>
      <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      {sub && (
        <Typography variant="caption" display="block" color="text.disabled">
          {sub}
        </Typography>
      )}
    </Box>
  </Paper>
);

function pct(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

// ─── Excel Export ─────────────────────────────────────────────────────────────

function exportToExcel(sheetName, rows, filename) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}_${dayjs().format("YYYY-MM-DD")}.xlsx`);
}

function flattenUserRows(users) {
  const rows = [];
  (users || []).forEach((u) => {
    (u.projects || []).forEach((p) => {
      (p.features || []).forEach((f) => {
        (f.stories || []).forEach((s) => {
          rows.push({
            User_ID: u.user_id,
            Project: p.project_name,
            Feature: f.feature_name,
            Story: s.title,
            Story_Status: s.status,
            Story_Points: s.story_points,
            Minutes: s.total_minutes,
            Hours: (s.total_minutes / 60).toFixed(2),
          });
        });
      });
    });
  });
  return rows;
}

function flattenProjectRows(projects) {
  const rows = [];
  (projects || []).forEach((p) => {
    (p.features || []).forEach((f) => {
      (f.stories || []).forEach((s) => {
        rows.push({
          Project: p.project_name,
          Project_Status: p.project_status,
          Feature: f.feature_name,
          Story: s.title,
          Story_Status: s.status,
          Story_Points: s.story_points,
          Contributors: s.contributors,
          Minutes: s.total_minutes,
          Hours: (s.total_minutes / 60).toFixed(2),
        });
      });
    });
  });
  return rows;
}

function flattenDeptRows(departments) {
  const rows = [];
  (departments || []).forEach((d) => {
    (d.projects || []).forEach((p) => {
      (p.features || []).forEach((f) => {
        rows.push({
          Department_ID: d.department_id,
          Project: p.project_name,
          Feature: f.feature_name,
          Unique_Users: f.unique_users,
          Minutes: f.total_minutes,
          Hours: (f.total_minutes / 60).toFixed(2),
        });
      });
    });
  });
  return rows;
}

function flattenFeatureRows(features) {
  return (features || []).map((f) => ({
    Project: f.project_name,
    Feature: f.feature_name,
    Total_Stories: f.total_stories,
    Completed: f.completed,
    In_Progress: f.in_progress,
    Review: f.review,
    Blocked: f.blocked,
    Completion_Pct: `${f.completion_pct}%`,
    Story_Points_Total: f.story_points_total,
    Story_Points_Done: f.story_points_done,
    Minutes: f.total_minutes,
    Hours: (f.total_minutes / 60).toFixed(2),
    Unique_Users: f.unique_users,
  }));
}

// ─── Access Guard ─────────────────────────────────────────────────────────────

function useIsAdminOrOwner() {
  const { currentOrganization } = useOrganization();
  const orgRole = currentOrganization?.role?.name?.toLowerCase();
  return ["owner", "admin"].includes(orgRole);
}

// ═════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═════════════════════════════════════════════════════════════════════════════

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ params, workspaces }) {
  const { data: rawSummary, isLoading, isError, refetch } = useAdminSummary(params);
  const d = rawSummary?.data || {};

  const dailyChart = (d.by_day || []).map((r) => ({
    date: dayjs(r.date).format("MMM D"),
    hours: parseFloat((r.total_minutes / 60).toFixed(2)),
    users: r.unique_users,
  }));

  const deptLookup = useMemo(() => {
    const m = {};
    (workspaces || []).forEach((w) => {
      m[w.id] = w.name;
    });
    return m;
  }, [workspaces]);

  if (isLoading)
    return (
      <Box textAlign="center" py={6}>
        <CircularProgress />
      </Box>
    );
  if (isError) return <Alert severity="error">Failed to load admin summary.</Alert>;

  const grandTotal = d.grand_total_minutes || 0;
  const activeDays = (d.by_day || []).filter((r) => r.total_minutes > 0).length;
  const avgPerDay = activeDays > 0 ? Math.round(grandTotal / activeDays) : 0;

  return (
    <Box>
      {/* KPI cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard icon={<AccessTimeIcon />} label="Total Hours Logged" value={fmtMinutes(grandTotal)} color="primary.main" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard icon={<TrendingUpIcon />} label="Avg / Active Day" value={fmtMinutes(avgPerDay)} color="success.main" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard icon={<PeopleAltIcon />} label="Active Users" value={d.active_users || 0} color="info.main" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard icon={<FolderOpenIcon />} label="Active Projects" value={d.active_projects || 0} color="warning.main" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard icon={<BusinessIcon />} label="Active Departments" value={d.active_departments || 0} color="secondary.main" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard icon={<BarChartIcon />} label="Active Days" value={activeDays} color="#8b5cf6" />
        </Grid>
      </Grid>

      {/* Daily trend */}
      {dailyChart.length > 0 && (
        <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Daily Work Activity (All Users)
            </Typography>
            <Tooltip title="Export trend data">
              <IconButton size="small" onClick={() => exportToExcel("DailyTrend", d.by_day || [], "admin_daily_trend")}>
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={dailyChart} margin={{ top: 4, right: 8, bottom: 4, left: -10 }}>
              <defs>
                <linearGradient id="aHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} unit="h" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} unit=" u" />
              <RTooltip formatter={(v, n) => [n === "hours" ? `${v}h` : `${v} users`, n === "hours" ? "Hours" : "Users"]} contentStyle={{ fontSize: 12 }} />
              <Area yAxisId="left" type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={2} fill="url(#aHours)" />
              <Bar yAxisId="right" dataKey="users" fill="#22c55e" opacity={0.5} />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* Top contributors */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Top Contributors
              </Typography>
              <Tooltip title="Export">
                <IconButton size="small" onClick={() => exportToExcel("TopContributors", d.by_user || [], "admin_top_contributors")}>
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
            {(d.by_user || []).slice(0, 8).map((u, i) => {
              const share = pct(u.total_minutes, grandTotal);
              return (
                <Box key={u.user_id} mb={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      #{i + 1} · {u.user_name || u.user_id.slice(0, 8) + "…"}
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        {u.active_days}d · {u.unique_projects}p
                      </Typography>
                      <Chip label={fmtMinutes(u.total_minutes)} size="small" color="primary" variant="outlined" sx={{ fontSize: "0.65rem", height: 18 }} />
                    </Stack>
                  </Stack>
                  <LinearProgress variant="determinate" value={share} sx={{ height: 4, borderRadius: 2, mt: 0.25 }} />
                </Box>
              );
            })}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Hours by Project
              </Typography>
              <Tooltip title="Export">
                <IconButton size="small" onClick={() => exportToExcel("ByProject", d.by_project || [], "admin_by_project")}>
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={(d.by_project || []).slice(0, 8).map((p) => ({ name: p.project_name?.slice(0, 12), hours: parseFloat((p.total_minutes / 60).toFixed(1)) }))} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} unit="h" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                <RTooltip formatter={(v) => [`${v}h`, "Hours"]} contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="hours" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Dept pie */}
        {(d.by_department || []).length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper elevation={0} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  Hours by Department
                </Typography>
                <Tooltip title="Export">
                  <IconButton
                    size="small"
                    onClick={() =>
                      exportToExcel(
                        "ByDept",
                        (d.by_department || []).map((dep) => ({ ...dep, dept_name: deptLookup[dep.department_id] || dep.department_id })),
                        "admin_by_dept",
                      )
                    }
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={(d.by_department || []).map((dep) => ({ name: deptLookup[dep.department_id] || dep.department_id?.slice(0, 8), value: dep.total_minutes }))} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {(d.by_department || []).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RTooltip formatter={(v) => [fmtMinutes(v), "Hours"]} contentStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab({ params }) {
  const { data: rawUsers, isLoading, isError } = useAdminUsers(params);
  const users = rawUsers?.data || [];
  const grandTotal = users.reduce((s, u) => s + u.total_minutes, 0);

  if (isLoading)
    return (
      <Box textAlign="center" py={6}>
        <CircularProgress />
      </Box>
    );
  if (isError) return <Alert severity="error">Failed to load user data.</Alert>;
  if (!users.length) return <Alert severity="info">No work logs found for the selected period.</Alert>;

  return (
    <Box>
      <Stack direction="row" justifyContent="flex-end" mb={1}>
        <Tooltip title="Export all users to Excel">
          <IconButton onClick={() => exportToExcel("Users", flattenUserRows(users), "admin_users_report")}>
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </Stack>
      {users.map((u) => {
        const share = pct(u.total_minutes, grandTotal);
        const displayLabel = u.user_name || u.user_id;
        const initials = (u.user_name ? u.user_name : u.user_id).slice(0, 2).toUpperCase();
        return (
          <Paper key={u.user_id} elevation={0} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1} flexWrap="wrap" gap={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: "primary.main" }}>{initials}</Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {displayLabel}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {u.active_days} active days · {u.session_count} sessions
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label={fmtMinutes(u.total_minutes)} color="primary" size="small" />
                <Chip label={`${share}%`} size="small" variant="outlined" />
              </Stack>
            </Stack>
            <LinearProgress variant="determinate" value={share} sx={{ height: 4, borderRadius: 2, mb: 1.5 }} />
            {u.projects.map((p) => (
              <Box key={p.project_id} sx={{ ml: 2, mb: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" fontWeight={500} color="text.secondary">
                    📁 {p.project_name}
                  </Typography>
                  <Chip label={fmtMinutes(p.total_minutes)} size="small" variant="outlined" sx={{ fontSize: "0.65rem", height: 18 }} />
                </Stack>
                {p.features.map((f) => (
                  <Box key={f.feature_id} sx={{ ml: 2, mt: 0.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        ⚙ {f.feature_name}
                      </Typography>
                      <Chip label={fmtMinutes(f.total_minutes)} size="small" color="default" sx={{ fontSize: "0.6rem", height: 16 }} />
                    </Stack>
                    {f.stories.map((s) => (
                      <Stack key={s.story_id} direction="row" justifyContent="space-between" alignItems="center" sx={{ ml: 2, py: 0.25, borderBottom: "1px solid", borderColor: "divider" }}>
                        <Typography variant="caption" noWrap sx={{ maxWidth: 260 }}>
                          {s.title}
                        </Typography>
                        <Stack direction="row" spacing={0.5}>
                          {s.status && <Chip label={s.status.replace("_", " ")} size="small" sx={{ bgcolor: STATUS_COLOR[s.status] || "#64748b", color: "#fff", fontSize: "0.6rem", height: 16, textTransform: "capitalize" }} />}
                          <Chip label={fmtMinutes(s.total_minutes)} size="small" color="success" variant="outlined" sx={{ fontSize: "0.6rem", height: 16 }} />
                        </Stack>
                      </Stack>
                    ))}
                  </Box>
                ))}
              </Box>
            ))}
          </Paper>
        );
      })}
    </Box>
  );
}

// ─── Projects Tab ─────────────────────────────────────────────────────────────

function ProjectsTab({ params }) {
  const { data: rawProjects, isLoading, isError } = useAdminProjects(params);
  const projects = rawProjects?.data || [];

  if (isLoading)
    return (
      <Box textAlign="center" py={6}>
        <CircularProgress />
      </Box>
    );
  if (isError) return <Alert severity="error">Failed to load project data.</Alert>;
  if (!projects.length) return <Alert severity="info">No project work logs found.</Alert>;

  return (
    <Box>
      <Stack direction="row" justifyContent="flex-end" mb={1}>
        <Tooltip title="Export projects to Excel">
          <IconButton onClick={() => exportToExcel("Projects", flattenProjectRows(projects), "admin_projects_report")}>
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </Stack>
      <Grid container spacing={2}>
        {projects.map((p) => {
          const stats = p.story_stats || {};
          const compPct = pct(stats.completed, stats.total);
          return (
            <Grid item xs={12} md={6} key={p.project_id}>
              <Paper elevation={0} variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {p.project_name}
                    </Typography>
                    <Stack direction="row" spacing={0.5} mt={0.5}>
                      {p.project_status && <Chip label={p.project_status.replace("_", " ")} size="small" sx={{ bgcolor: STATUS_COLOR[p.project_status] || "#64748b", color: "#fff", fontSize: "0.6rem", height: 18, textTransform: "capitalize" }} />}
                      <Chip label={`${p.unique_users} users`} size="small" variant="outlined" sx={{ fontSize: "0.6rem", height: 18 }} />
                    </Stack>
                  </Box>
                  <Chip label={fmtMinutes(p.total_minutes)} color="primary" size="small" />
                </Stack>

                {/* Story completion */}
                <Box mb={1.5}>
                  <Stack direction="row" justifyContent="space-between" mb={0.25}>
                    <Typography variant="caption" color="text.secondary">
                      Story completion
                    </Typography>
                    <Typography variant="caption">
                      {stats.completed}/{stats.total} ({compPct}%)
                    </Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={compPct} color={compPct >= 80 ? "success" : compPct >= 50 ? "warning" : "error"} sx={{ height: 6, borderRadius: 3 }} />
                  <Stack direction="row" spacing={1} mt={0.5}>
                    {stats.in_progress > 0 && <Chip label={`${stats.in_progress} in progress`} size="small" sx={{ fontSize: "0.6rem", height: 16 }} />}
                    {stats.blocked > 0 && <Chip label={`${stats.blocked} blocked`} size="small" color="error" sx={{ fontSize: "0.6rem", height: 16 }} />}
                  </Stack>
                </Box>

                <Divider sx={{ my: 1 }} />
                {p.features.slice(0, 4).map((f) => (
                  <Stack key={f.feature_id} direction="row" justifyContent="space-between" alignItems="center" py={0.25}>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                      ⚙ {f.feature_name}
                    </Typography>
                    <Stack direction="row" spacing={0.5}>
                      <Typography variant="caption" color="text.disabled">
                        {f.contributor_users}u
                      </Typography>
                      <Chip label={fmtMinutes(f.total_minutes)} size="small" variant="outlined" sx={{ fontSize: "0.6rem", height: 16 }} />
                    </Stack>
                  </Stack>
                ))}
                {p.features.length > 4 && (
                  <Typography variant="caption" color="text.disabled">
                    +{p.features.length - 4} more features
                  </Typography>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

// ─── Departments Tab ──────────────────────────────────────────────────────────

function DepartmentsTab({ params, workspaces }) {
  const { data: rawDepts, isLoading, isError } = useAdminDepartments(params);
  const departments = rawDepts?.data || [];

  const deptLookup = useMemo(() => {
    const m = {};
    (workspaces || []).forEach((w) => {
      m[w.id] = w.name;
    });
    return m;
  }, [workspaces]);

  if (isLoading)
    return (
      <Box textAlign="center" py={6}>
        <CircularProgress />
      </Box>
    );
  if (isError) return <Alert severity="error">Failed to load department data.</Alert>;
  if (!departments.length) return <Alert severity="info">No department work logs found.</Alert>;

  const grandTotal = departments.reduce((s, d) => s + d.total_minutes, 0);

  return (
    <Box>
      <Stack direction="row" justifyContent="flex-end" mb={1}>
        <Tooltip title="Export departments to Excel">
          <IconButton onClick={() => exportToExcel("Departments", flattenDeptRows(departments), "admin_departments_report")}>
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </Stack>
      {departments.map((dept) => {
        const deptName = deptLookup[dept.department_id] || dept.department_id?.slice(0, 12);
        const share = pct(dept.total_minutes, grandTotal);
        return (
          <Paper key={dept.department_id} elevation={0} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar sx={{ bgcolor: "secondary.main", width: 32, height: 32, fontSize: 14 }}>
                  <BusinessIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {deptName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dept.unique_users} users · {dept.unique_projects} projects
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Chip label={fmtMinutes(dept.total_minutes)} color="secondary" size="small" />
                <Chip label={`${share}%`} size="small" variant="outlined" />
              </Stack>
            </Stack>
            <LinearProgress variant="determinate" value={share} color="secondary" sx={{ height: 4, borderRadius: 2, mb: 1 }} />
            {dept.projects.map((p) => (
              <Box key={p.project_id} sx={{ ml: 2, mb: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    📁 {p.project_name}
                  </Typography>
                  <Chip label={fmtMinutes(p.total_minutes)} size="small" variant="outlined" sx={{ fontSize: "0.65rem", height: 18 }} />
                </Stack>
                {p.features.map((f) => (
                  <Stack key={f.feature_id} direction="row" justifyContent="space-between" alignItems="center" sx={{ ml: 2, py: 0.2, borderBottom: "1px solid", borderColor: "divider" }}>
                    <Typography variant="caption" color="text.secondary">
                      ⚙ {f.feature_name}
                    </Typography>
                    <Stack direction="row" spacing={0.5}>
                      <Typography variant="caption" color="text.disabled">
                        {f.unique_users}u
                      </Typography>
                      <Chip label={fmtMinutes(f.total_minutes)} size="small" sx={{ fontSize: "0.6rem", height: 16 }} />
                    </Stack>
                  </Stack>
                ))}
              </Box>
            ))}
          </Paper>
        );
      })}
    </Box>
  );
}

// ─── Features Tab ─────────────────────────────────────────────────────────────

function FeaturesTab({ params }) {
  const { data: rawFeatures, isLoading, isError } = useAdminFeatures(params);
  const features = rawFeatures?.data || [];

  if (isLoading)
    return (
      <Box textAlign="center" py={6}>
        <CircularProgress />
      </Box>
    );
  if (isError) return <Alert severity="error">Failed to load feature data.</Alert>;
  if (!features.length) return <Alert severity="info">No features found.</Alert>;

  // Chart data - top 10 by hours
  const chartData = features.slice(0, 10).map((f) => ({
    name: f.feature_name?.slice(0, 14),
    hours: parseFloat((f.total_minutes / 60).toFixed(1)),
    completion: f.completion_pct,
  }));

  return (
    <Box>
      <Stack direction="row" justifyContent="flex-end" mb={1}>
        <Tooltip title="Export features to Excel">
          <IconButton onClick={() => exportToExcel("Features", flattenFeatureRows(features), "admin_features_report")}>
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Chart */}
      <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Top 10 Features — Hours Logged
        </Typography>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 40, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10 }} unit="h" />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={110} />
            <RTooltip formatter={(v, n) => [n === "hours" ? `${v}h` : `${v}%`, n === "hours" ? "Hours" : "Completion"]} contentStyle={{ fontSize: 12 }} />
            <Bar dataKey="hours" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Feature</TableCell>
              <TableCell>Project</TableCell>
              <TableCell align="center">Stories</TableCell>
              <TableCell align="center">Done</TableCell>
              <TableCell align="center">IP</TableCell>
              <TableCell align="center">Blocked</TableCell>
              <TableCell align="center">Completion</TableCell>
              <TableCell align="center">SP Done</TableCell>
              <TableCell align="center">Hours</TableCell>
              <TableCell align="center">Users</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {features.map((f) => (
              <TableRow key={f.feature_id} hover>
                <TableCell>
                  <Typography variant="caption" fontWeight={500}>
                    {f.feature_name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {f.project_name}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="caption">{f.total_stories}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip label={f.completed} size="small" color="success" sx={{ fontSize: "0.6rem", height: 18 }} />
                </TableCell>
                <TableCell align="center">
                  <Chip label={f.in_progress} size="small" color="primary" sx={{ fontSize: "0.6rem", height: 18 }} />
                </TableCell>
                <TableCell align="center">{f.blocked > 0 ? <Chip label={f.blocked} size="small" color="error" sx={{ fontSize: "0.6rem", height: 18 }} /> : <Typography variant="caption">0</Typography>}</TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                    <LinearProgress variant="determinate" value={f.completion_pct} sx={{ width: 40, height: 4, borderRadius: 2 }} color={f.completion_pct >= 80 ? "success" : "primary"} />
                    <Typography variant="caption">{f.completion_pct}%</Typography>
                  </Stack>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="caption">
                    {f.story_points_done}/{f.story_points_total}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip label={fmtMinutes(f.total_minutes)} size="small" color="primary" variant="outlined" sx={{ fontSize: "0.6rem", height: 18 }} />
                </TableCell>
                <TableCell align="center">
                  <Typography variant="caption">{f.unique_users}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ─── Raw Work Logs Tab ────────────────────────────────────────────────────────

function WorkLogsTab({ params }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const queryParams = { ...params, page: page + 1, limit: rowsPerPage };
  const { data, isLoading, isError } = useAdminWorkLogs(queryParams);
  const rows = data?.data || [];
  const total = data?.meta?.total || 0;

  if (isLoading)
    return (
      <Box textAlign="center" py={6}>
        <CircularProgress />
      </Box>
    );
  if (isError) return <Alert severity="error">Failed to load work logs.</Alert>;

  const exportRows = rows.map((r) => ({
    User_ID: r.user_id,
    User_Name: r.user_name || "",
    Project: r.project_name,
    Department_ID: r.department_id,
    Feature: r.feature_name,
    Story: r.story_title,
    Story_Status: r.story_status,
    Story_Points: r.story_points,
    Sprint: r.sprint_name,
    Date: r.log_date,
    Start: r.start_time ? dayjs(r.start_time).format("HH:mm") : "",
    End: r.end_time ? dayjs(r.end_time).format("HH:mm") : "ongoing",
    Minutes: r.duration_minutes,
    Hours: (r.duration_minutes / 60).toFixed(2),
  }));

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="caption" color="text.secondary">
          {total} records found
        </Typography>
        <Tooltip title="Export current page to Excel">
          <IconButton onClick={() => exportToExcel("WorkLogs", exportRows, "admin_work_logs")}>
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </Stack>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Feature</TableCell>
              <TableCell>Story</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell>Sprint</TableCell>
              <TableCell align="center">Date</TableCell>
              <TableCell align="center">Time</TableCell>
              <TableCell align="center">Duration</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>
                  <Typography variant="caption">{r.user_name || r.user_id?.slice(0, 8) + "\u2026"}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption">{r.project_name}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {r.feature_name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" noWrap sx={{ maxWidth: 180, display: "block" }}>
                    {r.story_title}
                  </Typography>
                </TableCell>
                <TableCell align="center">{r.story_status && <Chip label={r.story_status.replace("_", " ")} size="small" sx={{ bgcolor: STATUS_COLOR[r.story_status] || "#64748b", color: "#fff", fontSize: "0.6rem", height: 16, textTransform: "capitalize" }} />}</TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {r.sprint_name || "—"}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="caption">{r.log_date}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="caption" sx={{ fontFamily: "monospace", fontSize: "0.65rem" }}>
                    {r.start_time ? dayjs(r.start_time).format("HH:mm") : "—"}–{r.end_time ? dayjs(r.end_time).format("HH:mm") : "ongoing"}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip label={fmtMinutes(r.duration_minutes)} size="small" color="primary" variant="outlined" sx={{ fontSize: "0.65rem", height: 18 }} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(Number(e.target.value));
          setPage(0);
        }}
        rowsPerPageOptions={[25, 50, 100, 200]}
      />
    </Box>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════

export default function AdminMonitor() {
  const isAdmin = useIsAdminOrOwner();
  const queryClient = useQueryClient();
  const { workspaces } = useWorkspace();

  const [tab, setTab] = useState(0);
  const [preset, setPreset] = useState(1); // default: last 30 days
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const params = useMemo(() => {
    if (customStart && customEnd) return { start_date: customStart, end_date: customEnd };
    const p = DATE_PRESETS[preset];
    return { start_date: daysAgo(p.days), end_date: today() };
  }, [preset, customStart, customEnd]);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["reports", "admin"] });
  }, [queryClient]);

  // Access guard
  if (!isAdmin) {
    return (
      <Box p={4}>
        <Alert severity="error" sx={{ maxWidth: 500, mx: "auto" }}>
          <Typography fontWeight={600}>Access Denied</Typography>
          You need <strong>owner</strong> or <strong>admin</strong> organization role to view this page.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Admin Monitor
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Full-visibility reporting — users, projects, departments &amp; features
          </Typography>
        </Box>

        {/* Filters */}
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField
            select
            size="small"
            label="Period"
            value={customStart ? "custom" : preset}
            onChange={(e) => {
              if (e.target.value !== "custom") {
                setPreset(Number(e.target.value));
                setCustomStart("");
                setCustomEnd("");
              }
            }}
            sx={{ minWidth: 140 }}
          >
            {DATE_PRESETS.map((p, i) => (
              <MenuItem key={i} value={i}>
                {p.label}
              </MenuItem>
            ))}
            <MenuItem value="custom">Custom range</MenuItem>
          </TextField>

          {/* Custom date pickers */}
          <TextField size="small" type="date" label="From" value={customStart} onChange={(e) => setCustomStart(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
          <TextField size="small" type="date" label="To" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />

          <Tooltip title="Refresh all data">
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: "divider", mb: 1 }}>
        <Tab icon={<TrendingUpIcon fontSize="small" />} iconPosition="start" label="Overview" />
        <Tab icon={<PeopleAltIcon fontSize="small" />} iconPosition="start" label="Users" />
        <Tab icon={<FolderOpenIcon fontSize="small" />} iconPosition="start" label="Projects" />
        <Tab icon={<BusinessIcon fontSize="small" />} iconPosition="start" label="Departments" />
        <Tab icon={<AutoStoriesIcon fontSize="small" />} iconPosition="start" label="Features" />
        <Tab icon={<TableChartIcon fontSize="small" />} iconPosition="start" label="Raw Logs" />
      </Tabs>

      <TabPanel value={tab} index={0}>
        <OverviewTab params={params} workspaces={workspaces} />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <UsersTab params={params} />
      </TabPanel>
      <TabPanel value={tab} index={2}>
        <ProjectsTab params={params} />
      </TabPanel>
      <TabPanel value={tab} index={3}>
        <DepartmentsTab params={params} workspaces={workspaces} />
      </TabPanel>
      <TabPanel value={tab} index={4}>
        <FeaturesTab params={params} />
      </TabPanel>
      <TabPanel value={tab} index={5}>
        <WorkLogsTab params={params} />
      </TabPanel>
    </Box>
  );
}
