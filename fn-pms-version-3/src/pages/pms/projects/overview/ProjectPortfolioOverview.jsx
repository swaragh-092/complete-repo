// Author: Gururaj
// Created: 29th May 2025
// Description: Project portfolio overview with multi-project summary for admin/manager roles.
// Version: 1.0.0
// Modified:

import { Card, Grid, Typography, Box, Stack, Paper, Divider, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AssignmentIcon from "@mui/icons-material/Assignment";

import backendRequest from "../../../../util/request";
import BACKEND_ENDPOINT from "../../../../util/urls";
import { showToast } from "../../../../util/feedback/ToastService";
import { colorCodes } from "../../../../theme";

/* ===================== KPI ITEM (Original Horizontal Style) ===================== */
const KPI = ({ label, value, icon: Icon, color }) => (
  <Stack spacing={0.5} sx={{ p: 1 }}>
    <Stack direction="row" spacing={1} alignItems="center">
      {Icon && <Icon sx={{ fontSize: 16, color, opacity: 0.8 }} />}
      <Typography variant="caption" color="text.secondary" fontWeight={500}>
        {label}
      </Typography>
    </Stack>
    <Typography variant="h5" fontWeight={700}>
      {value || 0}
    </Typography>
  </Stack>
);

/* ===================== STAT CARD (Alerts) ===================== */
const StatCard = ({ title, value, subtitle, color, label }) => (
  <Paper sx={{ p: 2, borderRadius: 2, borderLeft: `4px solid ${color}`, bgcolor: "background.paper" }}>
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          {title}
        </Typography>
        <Typography variant="h4" fontWeight={700} sx={{ my: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>
      <Typography variant="caption" sx={{ bgcolor: `${color}22`, color: color, px: 1, py: 0.2, borderRadius: 1, fontWeight: 700, fontSize: "10px" }}>
        {label}
      </Typography>
    </Stack>
  </Paper>
);
/* ===================== MAIN COMPONENT ===================== */
const ProjectPortfolioOverview = ({ refresh }) => {
  const theme = useTheme();
  const _colors = colorCodes(theme.palette.mode);

  const [health, setHealth] = useState([]);
  const [status, setStatus] = useState([]);
  const [issues, setIssues] = useState({ critical: 0, high: 0 });
  const [tasks, setTasks] = useState({ overdue: 0, total: 0 });
  const [completionRate, setCompletionRate] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const response = await backendRequest({ endpoint: BACKEND_ENDPOINT.overview });

      if (response.success) {
        const data = response.data;

        // Health data
        const projectHealth = [
          { name: "On Track", value: data?.healthoverview?.counts?.safe || 0, color: "#66bb6a" },
          { name: "At Risk", value: data?.healthoverview?.counts?.at_risk || 0, color: "#ffa726" },
          { name: "Critical", value: data?.healthoverview?.counts?.critical || 0, color: "#ef5350" },
        ];

        // Status data
        const projectStatus = [
          { name: "Ongoing", value: data.ongoingProjects || 0 },
          { name: "Completed", value: data.completedProjects || 0 },
        ];

        // Calculate completion rate
        const total = (data.ongoingProjects || 0) + (data.completedProjects || 0);
        const completed = data.completedProjects || 0;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        setHealth(projectHealth);
        setStatus(projectStatus);
        setCompletionRate(rate);
        setIssues({
          critical: data?.summary?.critical_high_issues_count || 0,
          high: 0,
        });
        setTasks({
          overdue: data?.summary?.overdue_tasks_count || 0,
          total: 0,
        });
      } else {
        showToast({ type: "error", message: response.message || "Failed to fetch data." });
      }
    };

    fetchData();
  }, [refresh]);

  /* ===== DERIVED KPIs ===== */
  const totalProjects = status.reduce((sum, s) => sum + s.value, 0);
  const getStatus = (name) => status.find((s) => s.name === name)?.value || 0;
  const getHealth = (name) => health.find((h) => h.name === name)?.value || 0;

  const statusForChart = [
    { name: "Ongoing", value: getStatus("Ongoing") },
    { name: "Completed", value: getStatus("Completed") },
  ];

  return (
    <Box sx={{ width: "100%", mb: 4 }}>
      {/* 1. TOP KPI STRIP - Spans Full Width */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" fontWeight={700} mb={2} color="primary.main">
          PROJECT PORTFOLIO OVERVIEW
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={4} sm={2}>
            <KPI label="Total" value={totalProjects} icon={AssignmentIcon} color={theme.palette.primary.main} />
          </Grid>
          <Grid item xs={4} sm={2}>
            <KPI label="Ongoing" value={getStatus("Ongoing")} color="#2196F3" />
          </Grid>
          <Grid item xs={4} sm={2}>
            <KPI label="Completed" value={getStatus("Completed")} icon={CheckCircleIcon} color="#66bb6a" />
          </Grid>
          <Grid item xs={4} sm={2}>
            <KPI label="On Track" value={getHealth("On Track")} color="#66bb6a" />
          </Grid>
          <Grid item xs={4} sm={2}>
            <KPI label="At Risk" value={getHealth("At Risk")} icon={WarningIcon} color="#ffa726" />
          </Grid>
          <Grid item xs={4} sm={2}>
            <KPI label="Critical" value={getHealth("Critical")} icon={WarningIcon} color="#ef5350" />
          </Grid>
        </Grid>
      </Card>

      {/* 2. MAIN CHARTS ROW - Perfectly Balanced 3-Column Layout */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, height: 350 }}>
            <Typography variant="subtitle2" fontWeight={700} mb={1}>
              Health Distribution
            </Typography>
            <ResponsiveContainer width="100%" height="70%">
              <PieChart>
                <Pie data={health} dataKey="value" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  {health.map((h, i) => (
                    <Cell key={i} fill={h.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <Stack direction="row" justifyContent="center" spacing={2} mt={1}>
              {health.map((h, i) => (
                <Stack key={i} direction="row" spacing={0.5} alignItems="center">
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: h.color }} />
                  <Typography variant="caption">
                    {h.name}: {h.value}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, height: 350 }}>
            <Typography variant="subtitle2" fontWeight={700} mb={1}>
              Project Status
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={statusForChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "transparent" }} />
                <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, height: 350, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ alignSelf: "flex-start", mb: 4 }}>
              Completion Rate
            </Typography>
            <Box sx={{ position: "relative", width: 180, height: 180, borderRadius: "50%", background: `conic-gradient(#66bb6a 0deg ${completionRate * 3.6}deg, ${theme.palette.divider} 0deg)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Box sx={{ width: 150, height: 150, borderRadius: "50%", bgcolor: "background.paper", display: "flex", flexDir: "column", alignItems: "center", justifyContent: "center" }}>
                <Typography variant="h3" fontWeight={800}>
                  {completionRate}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  COMPLETED
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* 3. ALERTS ROW - Full Width Row */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Critical Issues" value={issues.critical} subtitle="Across projects" color="#ef5350" label="ACTION REQUIRED" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Overdue Stories" value={tasks.overdue} subtitle="Need attention" color="#ffa726" label="URGENT" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="At Risk Projects" value={getHealth("At Risk")} subtitle="Monitor closely" color="#ff9800" label="MONITORING" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Critical Projects" value={getHealth("Critical")} subtitle="Immediate action" color="#d32f2f" label="CRITICAL" />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectPortfolioOverview;
