import { Card, Grid, Typography, Box, Stack, Divider } from "@mui/material";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";
import backendRequest from "../../../../util/request";
import BACKEND_ENDPOINT from "../../../../util/urls";
import { showToast } from "../../../../util/feedback/ToastService";

/* ===================== KPI ITEM ===================== */
const KPI = ({ label, value, onClick }) => (
  <Stack
    spacing={0.5}
    sx={{
      cursor: "pointer",
      "&:hover": { opacity: 0.8 },
    }}
    onClick={onClick}
  >
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h6" fontWeight={700}>
      {value}
    </Typography>
  </Stack>
);

let PROJECT_PORTFOLIO_DATA = {
    health: [
      { name: "On Track", value: 0, color: "#66bb6a" },
      { name: "At Risk", value: 0, color: "#ffa726" },
      { name: "Critical", value: 0, color: "#ef5350" },
    ],
    status: [
      { name: "Ongoing", value: 0 },
      { name: "Completed", value: 0 },
    ],
  };

/* ===================== MAIN COMPONENT ===================== */
const ProjectPortfolioOverview = () => {
  const [health, setHealth] = useState(PROJECT_PORTFOLIO_DATA.health);
  const [status, setStatus] = useState(PROJECT_PORTFOLIO_DATA.status);

  useEffect(() => {

    const fetchData = async () => {
      const response = await backendRequest({endpoint: BACKEND_ENDPOINT.overview});
      console.log("Project Portfolio Overview Data:", response.data);
      if (response.success) {
        const projectHealth = [
          { name: "On Track", value: response.data?.healthoverview?.counts?.safe, color: "#66bb6a" },
          { name: "At Risk", value: response.data?.healthoverview?.counts?.at_risk, color: "#ffa726" },
          { name: "Critical", value: response.data?.healthoverview?.counts?.critical, color: "#ef5350" },
        ];
        const projectStatus = [
          { name: "Ongoing", value: response.data.ongoingProjects },
          { name: "Completed", value: response.data.completedProjects },
        ];

        setHealth(projectHealth);
        setStatus(projectStatus);
      } else {
        showToast({type: "error", message: response.message || "Failed to fetch project portfolio data."});
      }
    }

    fetchData();
  }, []); // Placeholder for data fetching logic

  /* ===== DERIVED KPIs ===== */
  const totalProjects = status.reduce((sum, s) => sum + s.value, 0);

  const getStatus = (name) => status.find((s) => s.name === name)?.value || 0;
  const getHealth = (name) => health.find((h) => h.name === name)?.value || 0;

  return (
    <Card sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" fontWeight={600} mb={2}>
        Project Portfolio Overview
      </Typography>

      {/* ================= KPI STRIP ================= */}
      <Grid container spacing={4} mb={2}>
        <Grid item xs={6} md={2}>
          <KPI label="Total" value={totalProjects} onClick={() => console.log("KPI_CLICK → ALL PROJECTS")} />
        </Grid>
        <Grid item xs={6} md={2}>
          <KPI label="Ongoing" value={getStatus("Ongoing")} onClick={() => console.log("KPI_CLICK → STATUS: ONGOING")} />
        </Grid>
        <Grid item xs={6} md={2}>
          <KPI label="Completed" value={getStatus("Completed")} onClick={() => console.log("KPI_CLICK → STATUS: COMPLETED")} />
        </Grid>

        <Grid item xs={6} md={2}>
          <KPI label="At Risk" value={getHealth("At Risk")} onClick={() => console.log("KPI_CLICK → HEALTH: AT RISK")} />
        </Grid>
        <Grid item xs={6} md={2}>
          <KPI label="Critical" value={getHealth("Critical")} onClick={() => console.log("KPI_CLICK → HEALTH: CRITICAL")} />
        </Grid>
        <Grid item xs={6} md={2}>
          <KPI label="On Track" value={getHealth("On Track")} onClick={() => console.log("KPI_CLICK → HEALTH: ON TRACK")} />
        </Grid>
      </Grid>

      {/* ================= VISUAL SUMMARY ================= */}
      <Box sx={{ position: "relative", width: 240, height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={health} dataKey="value" innerRadius={70} outerRadius={100} paddingAngle={4}>
              {health.map((h, i) => (
                <Cell key={i} fill={h.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        {/* Center heading */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            Health Status
          </Typography>
          <Typography variant="caption">{/* Optional value */}</Typography>
        </Box>
      </Box>
    </Card>
  );
};

export default ProjectPortfolioOverview;

/* ===================== DUMMY DATA ===================== */

