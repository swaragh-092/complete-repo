// Author: Copilot
// Created: 18th Mar 2026
// Description: Burndown Chart
// Version: 1.0.0

import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { Box, Typography, Paper, CircularProgress, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { useSprintBurndown } from "../hooks/useReports";
import { useSprints } from "../../sprints/hooks/useSprints";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const BurndownChart = ({ projectId }) => {
  const { data: sprintsData } = useSprints(projectId);
  const [selectedSprint, setSelectedSprint] = React.useState("");

  const sprints = sprintsData?.data || [];

  // Set default sprint to latest
  React.useEffect(() => {
    if (!selectedSprint && sprints.length > 0) {
      const active = sprints.find((s) => s.status === "active");
      setSelectedSprint(active ? active.id : sprints[0].id);
    }
  }, [sprints, selectedSprint]);

  const { data: burndownData, isLoading } = useSprintBurndown(selectedSprint);

  const chartData = useMemo(() => {
    if (!burndownData || !Array.isArray(burndownData) || burndownData.length === 0) return null;

    const labels = burndownData.map((d) => d.date);
    const ideal = burndownData.map((d) => d.ideal);
    const remaining = burndownData.map((d) => d.remaining);

    return {
      labels,
      datasets: [
        {
          label: "Ideal Burn",
          data: ideal,
          borderColor: "rgb(200, 200, 200)",
          backgroundColor: "rgba(200, 200, 200, 0.5)",
          borderDash: [5, 5],
        },
        {
          label: "Actual Remaining",
          data: remaining,
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgba(255, 99, 132, 0.5)",
        },
      ],
    };
  }, [burndownData]);

  if (!sprints.length) return <Typography>No sprints found.</Typography>;

  return (
    <Paper sx={{ p: 2, height: "100%" }}>
      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Burndown Chart</Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Sprint</InputLabel>
          <Select value={selectedSprint} label="Sprint" onChange={(e) => setSelectedSprint(e.target.value)}>
            {sprints.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {isLoading ? <CircularProgress /> : chartData ? <Line options={{ responsive: true }} data={chartData} /> : <Typography>No Data</Typography>}
    </Paper>
  );
};

export default BurndownChart;
