// Author: Copilot
// Description: Sprints list with start/end/board/add-stories actions
// Version: 2.0.0

import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Button, Paper, Alert, Chip, IconButton, Tooltip,
  List, ListItem, ListItemText, ListItemSecondaryAction, CircularProgress, Stack,
} from "@mui/material";
import { Add, PlayArrow, Stop, Dashboard, LibraryAdd } from "@mui/icons-material";
import { useSprints, useStartSprint, useEndSprint } from "../hooks/useSprints";
import CreateSprintModal from "./CreateSprintModal";
import AddStoriesToSprintModal from "./AddStoriesToSprintModal";
import { paths } from "../../../util/urls";
import { showToast } from "../../../util/feedback/ToastService";

const statusColor = { active: "success", completed: "default", planned: "primary" };

const SprintList = ({ projectId: propProjectId }) => {
  const params = useParams();
  const projectId = propProjectId || params.projectId;
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [addStoriesSprintId, setAddStoriesSprintId] = useState(null);

  const { data: sprintsData, isLoading, error } = useSprints(projectId);
  const startMutation = useStartSprint();
  const endMutation = useEndSprint();

  const sprintList = Array.isArray(sprintsData) ? sprintsData : sprintsData?.data || [];

  const handleStart = (sprint) => {
    if (!window.confirm(`Start sprint "${sprint.name}"?`)) return;
    startMutation.mutate(sprint.id, {
      onSuccess: () => showToast({ type: "success", message: "Sprint started!" }),
      onError: (err) => showToast({ type: "error", message: err?.message || "Failed to start sprint" }),
    });
  };

  const handleEnd = (sprint) => {
    if (!window.confirm(`End sprint "${sprint.name}"? Incomplete stories return to backlog.`)) return;
    endMutation.mutate(sprint.id, {
      onSuccess: () => showToast({ type: "success", message: "Sprint ended. Incomplete stories moved to backlog." }),
      onError: (err) => showToast({ type: "error", message: err?.message || "Failed to end sprint" }),
    });
  };

  if (isLoading) return <Box p={3} display="flex" alignItems="center" gap={1}><CircularProgress size={20} /><Typography>Loading sprints…</Typography></Box>;
  if (error) return <Alert severity="error" sx={{ m: 2 }}>Error loading sprints: {error.message}</Alert>;

  return (
    <Box sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold">Sprints</Typography>
        <Button startIcon={<Add />} variant="contained" size="small" onClick={() => setCreateOpen(true)}>
          Create Sprint
        </Button>
      </Box>

      {sprintList.length === 0 ? (
        <Alert severity="info">No sprints yet. Create one to start planning.</Alert>
      ) : (
        <List disablePadding>
          {sprintList.map((sprint) => (
            <Paper key={sprint.id} variant="outlined" sx={{ mb: 1.5, "&:hover": { boxShadow: 2 } }}>
              <ListItem>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle1" fontWeight={600}>{sprint.name}</Typography>
                      <Chip
                        label={sprint.status}
                        size="small"
                        color={statusColor[sprint.status] || "default"}
                      />
                    </Stack>
                  }
                  secondary={
                    <Box mt={0.5}>
                      {sprint.goal && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {sprint.goal}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {sprint.start_date
                          ? new Date(sprint.start_date).toLocaleDateString()
                          : "No start date"}{" "}
                        →{" "}
                        {sprint.end_date
                          ? new Date(sprint.end_date).toLocaleDateString()
                          : "No end date"}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Stack direction="row" spacing={0.5}>
                    {sprint.status !== "completed" && (
                      <Tooltip title="Add Stories to Sprint">
                        <IconButton size="small" color="primary" onClick={() => setAddStoriesSprintId(sprint.id)}>
                          <LibraryAdd fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                    {sprint.status === "active" && (
                      <>
                        <Tooltip title="View Board">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => navigate(paths.sprint_board(projectId, sprint.id).actualPath)}
                          >
                            <Dashboard fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="End Sprint">
                          <IconButton
                            size="small"
                            color="error"
                            disabled={endMutation.isPending}
                            onClick={() => handleEnd(sprint)}
                          >
                            <Stop fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}

                    {sprint.status === "planned" && (
                      <Tooltip title="Start Sprint">
                        <IconButton
                          size="small"
                          color="success"
                          disabled={startMutation.isPending}
                          onClick={() => handleStart(sprint)}
                        >
                          <PlayArrow fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </ListItemSecondaryAction>
              </ListItem>
            </Paper>
          ))}
        </List>
      )}

      <CreateSprintModal open={createOpen} onClose={() => setCreateOpen(false)} projectId={projectId} />
      {addStoriesSprintId && (
        <AddStoriesToSprintModal
          open={!!addStoriesSprintId}
          onClose={() => setAddStoriesSprintId(null)}
          projectId={projectId}
          sprintId={addStoriesSprintId}
        />
      )}
    </Box>
  );
};

export default SprintList;
