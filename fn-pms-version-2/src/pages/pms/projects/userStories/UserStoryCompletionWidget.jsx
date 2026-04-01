// Author: Gururaj
// Created: 14th Oct 2025
// Description: User Story Completion widget showing a progress bar and percentages for project stories.
// Version: 1.0.0
// Modified:

import { useEffect, useState } from "react";
import { Box, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import backendRequest from "../../../../util/request";
import BACKEND_ENDPOINT from "../../../../util/urls";

async function fetchCompletion(projectId, setStats, setLoading) {
  setLoading(true);
  try {
    const res = await backendRequest(BACKEND_ENDPOINT.user_story_completion(projectId));
    if (res?.data) setStats(res.data);
  } catch {
    // ignore
  } finally {
    setLoading(false);
  }
}

export default function UserStoryCompletionWidget({ projectId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    fetchCompletion(projectId, setStats, setLoading);
  }, [projectId]);

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} mb={2}>
        User Story Progress
      </Typography>

      {loading && <LinearProgress />}

      {!loading && stats && (
        <Stack spacing={2}>
          <Box>
            <Stack direction="row" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2" color="text.secondary">
                Completion
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {stats.completion_percentage ?? 0}%
              </Typography>
            </Stack>
            <LinearProgress variant="determinate" value={stats.completion_percentage ?? 0} sx={{ height: 8, borderRadius: 4 }} />
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip label={`Total: ${stats.total ?? 0}`} size="small" />
            <Chip label={`Completed: ${stats.completed ?? 0}`} size="small" color="success" />
            {(stats.status_breakdown ?? []).map((item) => (
              <Chip key={item.status} label={`${item.status}: ${item.count}`} size="small" variant="outlined" />
            ))}
          </Stack>
        </Stack>
      )}

      {!loading && !stats && (
        <Typography variant="body2" color="text.secondary">
          No user story data available.
        </Typography>
      )}
    </Box>
  );
}
