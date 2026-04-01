// Author: Copilot
// Created: 18th Mar 2026
// Description: Issue Distribution Chart
// Version: 1.0.0

import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Box, Typography, Paper, CircularProgress } from "@mui/material";
import { useIssueDistribution } from "../hooks/useReports";

ChartJS.register(ArcElement, Tooltip, Legend);

const IssueDistributionChart = ({ projectId }) => {
  const { data, isLoading } = useIssueDistribution(projectId);

  if (isLoading) return <CircularProgress />;

  const distribution = data || [];

  if (!distribution.length) return <Typography>No data available</Typography>;

  const chartData = {
    labels: distribution.map((d) => d.status_name),
    datasets: [
      {
        data: distribution.map((d) => parseInt(d.count, 10)),
        backgroundColor: ["rgba(255, 99, 132, 0.2)", "rgba(54, 162, 235, 0.2)", "rgba(255, 206, 86, 0.2)", "rgba(75, 192, 192, 0.2)", "rgba(153, 102, 255, 0.2)"],
        borderColor: ["rgba(255, 99, 132, 1)", "rgba(54, 162, 235, 1)", "rgba(255, 206, 86, 1)", "rgba(75, 192, 192, 1)", "rgba(153, 102, 255, 1)"],
        borderWidth: 1,
      },
    ],
  };

  return (
    <Paper sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Typography variant="h6" gutterBottom>
        Issue Distribution
      </Typography>
      <Box sx={{ position: "relative", height: 250, width: 250 }}>
        <Doughnut data={chartData} options={{ maintainAspectRatio: false }} />
      </Box>
    </Paper>
  );
};

export default IssueDistributionChart;
