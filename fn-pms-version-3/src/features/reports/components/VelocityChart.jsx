// Author: Copilot
// Created: 18th Mar 2026
// Description: Velocity Chart
// Version: 1.0.0

import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Box, Typography, Paper, CircularProgress } from "@mui/material";
import { useVelocityReport } from "../hooks/useReports";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const VelocityChart = ({ projectId }) => {
  const { data, isLoading } = useVelocityReport(projectId);

  if (isLoading) return <CircularProgress />;

  const velocity = data || [];

  if (!velocity.length) return <Typography>No velocity data yet.</Typography>;

  const chartData = {
    labels: velocity.map((v) => v.sprint_name),
    datasets: [
      {
        label: "Commitment",
        data: velocity.map((v) => v.commitment),
        backgroundColor: "rgba(54, 162, 235, 0.5)",
      },
      {
        label: "Completed",
        data: velocity.map((v) => v.completed),
        backgroundColor: "rgba(75, 192, 192, 0.5)",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Sprint Velocity",
      },
    },
    scales: {
      y: {
        title: { display: true, text: "Story Points" },
      },
    },
  };

  return (
    <Paper sx={{ p: 2, height: "100%" }}>
      <Bar options={options} data={chartData} />
    </Paper>
  );
};

export default VelocityChart;
