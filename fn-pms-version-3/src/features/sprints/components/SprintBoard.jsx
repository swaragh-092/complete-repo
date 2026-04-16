// Author: Copilot
// Description: Kanban Board for a Sprint — User Stories as work items
// Version: 2.0.0

import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Chip, CircularProgress, IconButton, Stack, Tooltip,
} from "@mui/material";
import { ArrowBack, BugReport } from "@mui/icons-material";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useWorkflow } from "../../issues/hooks/useIssues";
import { useSprintStories } from "../hooks/useSprints";
import { useMoveStoryOnBoard } from "../../backlog/hooks/useBacklog";
import { showToast } from "../../../util/feedback/ToastService";

const priorityColors = { critical: "#d32f2f", high: "#f57c00", medium: "#1976d2", low: "#388e3c" };

const StoryCard = ({ story, index }) => {
  const navigate = useNavigate();
  return (
    <Draggable draggableId={story.id} index={index}>
      {(provided, snapshot) => (
        <Paper
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          variant="outlined"
          sx={{
            p: 1.5, mb: 1.5,
            bgcolor: snapshot.isDragging ? "action.selected" : "background.paper",
            "&:hover": { boxShadow: 3, cursor: "grab" },
            borderLeft: `3px solid ${priorityColors[story.priority] || "#9e9e9e"}`,
            ...provided.draggableProps.style,
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 0.5, fontSize: "0.7rem" }}
          >
            {story.feature?.name && `${story.feature.name} • `}
            {story.type} • {story.story_points ? `${story.story_points} pts` : "—"}
          </Typography>
          <Typography
            variant="subtitle2"
            sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
            onClick={() => navigate(`/user-story/${story.id}`)}
          >
            {story.title}
          </Typography>
          <Stack direction="row" spacing={0.5} mt={1} justifyContent="space-between" alignItems="center">
            <Chip
              label={story.priority}
              size="small"
              sx={{ fontSize: "0.65rem", height: 18, bgcolor: priorityColors[story.priority] || undefined, color: "white" }}
            />
            {story.issues?.length > 0 && (
              <Tooltip title={`${story.issues.length} linked issue(s)`}>
                <Chip icon={<BugReport sx={{ fontSize: "0.75rem !important" }} />} label={story.issues.length} size="small" variant="outlined" />
              </Tooltip>
            )}
          </Stack>
        </Paper>
      )}
    </Draggable>
  );
};

const SprintBoard = ({ overrideSprintId } = {}) => {
  const { projectId, sprintId: paramSprintId } = useParams();
  const sprintId = overrideSprintId || paramSprintId;
  const navigate = useNavigate();

  const { data: storiesData, isLoading: storiesLoading } = useSprintStories(sprintId);
  const { data: workflowData, isLoading: workflowLoading } = useWorkflow(projectId);
  const moveStoryMutation = useMoveStoryOnBoard();

  const { sprint, stories } = useMemo(() => {
    const d = storiesData?.data;
    if (!d) return { sprint: null, stories: [] };
    if (d.sprint && Array.isArray(d.stories)) return { sprint: d.sprint, stories: d.stories };
    // Fallback: flat list
    return { sprint: null, stories: Array.isArray(d) ? d : [] };
  }, [storiesData]);

  const statuses = useMemo(() => {
    if (!workflowData) return [];
    if (workflowData?.data?.statuses) return workflowData.data.statuses;
    if (Array.isArray(workflowData?.data)) return workflowData.data;
    return [];
  }, [workflowData]);

  // Group stories by status_id
  const columns = useMemo(() => {
    const cols = {};
    statuses.forEach((s) => { cols[s.id] = { ...s, stories: [] }; });
    stories.forEach((story) => {
      if (story.status_id && cols[story.status_id]) {
        cols[story.status_id].stories.push(story);
      } else {
        // Put statusless stories in first column
        const first = statuses[0];
        if (first) {
          cols[first.id] = cols[first.id] || { ...first, stories: [] };
          cols[first.id].stories.push(story);
        }
      }
    });
    return cols;
  }, [stories, statuses]);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    moveStoryMutation.mutate(
      { story_id: draggableId, to_status_id: destination.droppableId },
      {
        onError: (err) => showToast({ type: "error", message: err?.message || "Failed to move story" }),
      },
    );
  };

  if (storiesLoading || workflowLoading) {
    return <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 2, display: "flex", alignItems: "center", borderBottom: 1, borderColor: "divider" }}>
        {!overrideSprintId && (
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
        )}
        <Box>
          <Typography variant="h6" fontWeight="bold">
            {sprint?.name || "Sprint Board"}
          </Typography>
          {sprint?.goal && (
            <Typography variant="caption" color="text.secondary">{sprint.goal}</Typography>
          )}
        </Box>
        <Chip
          label={`${stories.length} stories`}
          size="small"
          variant="outlined"
          sx={{ ml: "auto" }}
        />
      </Box>

      <Box sx={{ flexGrow: 1, overflowX: "auto", p: 2 }}>
        {statuses.length === 0 ? (
          <Typography color="text.secondary" p={2}>
            No workflow statuses configured for this project. Add statuses in project settings.
          </Typography>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Box sx={{ display: "flex", gap: 2, minWidth: "fit-content", height: "calc(100vh - 200px)" }}>
              {statuses.map((status) => {
                const columnStories = columns[status.id]?.stories || [];
                const headerColor = status.category === "done" ? "success.main"
                  : status.category === "in_progress" ? "primary.main"
                  : "text.secondary";

                return (
                  <Droppable key={status.id} droppableId={String(status.id)}>
                    {(provided, snapshot) => (
                      <Paper
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        variant="outlined"
                        sx={{
                          width: 280, minWidth: 280,
                          bgcolor: snapshot.isDraggingOver ? "action.hover" : "background.default",
                          p: 1.5,
                          display: "flex", flexDirection: "column",
                          maxHeight: "100%",
                        }}
                      >
                        <Box sx={{ mb: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography variant="subtitle2" fontWeight="bold" color={headerColor}>
                            {status.name}
                          </Typography>
                          <Chip label={columnStories.length} size="small" />
                        </Box>

                        <Box sx={{ flexGrow: 1, overflowY: "auto", minHeight: 80 }}>
                          {columnStories.map((story, index) => (
                            <StoryCard key={story.id} story={story} index={index} />
                          ))}
                          {provided.placeholder}
                        </Box>
                      </Paper>
                    )}
                  </Droppable>
                );
              })}
            </Box>
          </DragDropContext>
        )}
      </Box>
    </Box>
  );
};

export default SprintBoard;
