// Author: Copilot
// Created: 18th Mar 2026
// Description: Board wrapper — shows board only for the active sprint
// Version: 2.0.0

import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, CircularProgress, Alert } from "@mui/material";
import { useSprints } from "../hooks/useSprints";
import SprintBoard from "./SprintBoard";

const ProjectBoard = () => {
  const { projectId } = useParams();
  const { data: sprintsData, isLoading, isError } = useSprints(projectId);

  const sprints = useMemo(() => {
    if (Array.isArray(sprintsData)) return sprintsData;
    if (sprintsData?.data && Array.isArray(sprintsData.data)) return sprintsData.data;
    return [];
  }, [sprintsData]);

  const activeSprint = useMemo(() => sprints.find((s) => s.status === "active") || null, [sprints]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box p={3}>
        <Typography color="error">Error loading sprints</Typography>
      </Box>
    );
  }

  if (!activeSprint) {
    return (
      <Box p={3}>
        <Alert severity="info">No active sprint. Start a sprint from the Backlog to use the Board view.</Alert>
      </Box>
    );
  }

  return <SprintBoard overrideSprintId={activeSprint.id} />;
};

export default ProjectBoard;
