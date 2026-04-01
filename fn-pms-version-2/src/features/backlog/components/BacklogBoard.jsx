// Author: Copilot
// Description: Backlog Management Board — User Stories as sprint work items
// Version: 2.0.0

import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Paper, Accordion, AccordionSummary, AccordionDetails, Chip, Alert, IconButton, Tooltip, Button, Stack, LinearProgress } from "@mui/material";
import { ExpandMore, Add, DragIndicator, PlayArrow, Stop } from "@mui/icons-material";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useSprints, useSprintStories, useStartSprint, useEndSprint } from "../../sprints/hooks/useSprints";
import { useBacklogStories, useMoveStoryToSprint } from "../hooks/useBacklog";
import CreateSprintModal from "../../sprints/components/CreateSprintModal";
import AddStoriesToSprintModal from "../../sprints/components/AddStoriesToSprintModal";
import { showToast } from "../../../util/feedback/ToastService";

const priorityColors = { critical: "error", high: "warning", medium: "info", low: "default" };

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
            p: 1.5,
            mb: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: snapshot.isDragging ? "action.selected" : "background.paper",
            cursor: "grab",
            "&:hover": { bgcolor: "action.hover" },
            ...provided.draggableProps.style,
          }}
        >
          <Box display="flex" alignItems="center" gap={1} minWidth={0}>
            <DragIndicator color="action" fontSize="small" sx={{ flexShrink: 0 }} />
            <Box minWidth={0} sx={{ cursor: "pointer" }} onClick={() => navigate(`/user-story/${story.id}`)}>
              <Typography variant="body2" noWrap fontWeight={500}>
                {story.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {story.feature?.name && `${story.feature.name} • `}
                {story.type} • {story.story_points ? `${story.story_points} pts` : "—"}
              </Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={0.5} flexShrink={0} ml={1}>
            <Chip label={story.priority} size="small" color={priorityColors[story.priority] || "default"} variant="outlined" />
            {story.issueStatus && <Chip label={story.issueStatus.name} size="small" variant="outlined" />}
          </Stack>
        </Paper>
      )}
    </Draggable>
  );
};

const SprintSection = ({ sprint, onStart, onEnd, onAddStories, navigate, projectId }) => {
  const { data: sprintStoriesData } = useSprintStories(sprint.id);
  const sprintStories = React.useMemo(() => {
    // API returns { data: { sprint, stories: [...] } }
    return sprintStoriesData?.data?.stories || sprintStoriesData?.data?.data || [];
  }, [sprintStoriesData]);

  return (
    <Accordion key={sprint.id} defaultExpanded={sprint.status === "active"} sx={{ mb: 1 }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box display="flex" alignItems="center" gap={1.5} width="100%">
          <Typography variant="subtitle1" fontWeight="bold">
            {sprint.name}
          </Typography>
          <Chip label={sprint.status} size="small" color={sprint.status === "active" ? "success" : sprint.status === "completed" ? "default" : "primary"} />
          {sprint.goal && (
            <Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1 }}>
              {sprint.goal}
            </Typography>
          )}
          <Chip label={`${sprintStories.length} stories`} size="small" variant="outlined" />
          <Box display="flex" gap={0.5} ml="auto" onClick={(e) => e.stopPropagation()}>
            {sprint.status === "planned" && (
              <Tooltip title="Start Sprint">
                <IconButton size="small" color="success" onClick={() => onStart(sprint)}>
                  <PlayArrow fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {sprint.status === "active" && (
              <>
                <Tooltip title="View Board">
                  <Button size="small" variant="outlined" onClick={() => navigate(`/projects/${projectId}/sprint/${sprint.id}/board`)}>
                    Board
                  </Button>
                </Tooltip>
                <Tooltip title="End Sprint">
                  <IconButton size="small" color="error" onClick={() => onEnd(sprint)}>
                    <Stop fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
            <Tooltip title="Add Stories">
              <Button size="small" variant="text" startIcon={<Add />} onClick={() => onAddStories(sprint.id)}>
                Add
              </Button>
            </Tooltip>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ bgcolor: "action.hover", pt: 1 }}>
        <Droppable droppableId={sprint.id} isDropDisabled={sprint.status === "completed"}>
          {(provided, snapshot) => (
            <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ minHeight: 60, bgcolor: snapshot.isDraggingOver ? "action.selected" : "transparent", borderRadius: 1, p: 0.5 }}>
              {sprintStories.map((story, index) => (
                <StoryCard key={story.id} story={story} index={index} />
              ))}
              {sprintStories.length === 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  Drag stories here to plan this sprint
                </Typography>
              )}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </AccordionDetails>
    </Accordion>
  );
};

const BacklogBoard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [createSprintOpen, setCreateSprintOpen] = useState(false);
  const [addStoriesSprintId, setAddStoriesSprintId] = useState(null);

  const { data: sprintsData } = useSprints(projectId);
  const { data: backlogData, isLoading } = useBacklogStories(projectId);
  const moveStoryMutation = useMoveStoryToSprint();
  const startSprintMutation = useStartSprint();
  const endSprintMutation = useEndSprint();

  const sprints = useMemo(() => {
    if (Array.isArray(sprintsData)) return sprintsData;
    return sprintsData?.data || [];
  }, [sprintsData]);

  const backlogStories = useMemo(() => {
    if (Array.isArray(backlogData?.data)) return backlogData.data;
    return backlogData?.data?.data || [];
  }, [backlogData]);

  // Map sprintId → stories for sprint sections (comes from backlog stories with sprint_id set)
  // Sprint stories come from useSprintStories but here we just show the backlog.
  // For the sprint accordion we show stories already assigned to each sprint.
  // We need all project stories to group them — use a combined query here.
  // For simplicity: the backlog endpoint returns only sprint_id=null stories.
  // Sprint story counts come from SprintDetail. Accordions redirect to SprintBoard.

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const destId = destination.droppableId;
    const sprintId = destId === "backlog" ? null : destId;

    moveStoryMutation.mutate(
      { story_id: draggableId, sprint_id: sprintId },
      {
        onSuccess: () => showToast({ type: "success", message: sprintId ? "Moved to sprint" : "Moved to backlog" }),
        onError: (err) => showToast({ type: "error", message: err?.message || "Failed to move story" }),
      },
    );
  };

  const handleStartSprint = (sprint) => {
    if (!window.confirm(`Start sprint "${sprint.name}"?`)) return;
    startSprintMutation.mutate(sprint.id, {
      onSuccess: () => showToast({ type: "success", message: "Sprint started!" }),
      onError: (err) => showToast({ type: "error", message: err?.message || "Failed to start sprint" }),
    });
  };

  const handleEndSprint = (sprint) => {
    if (!window.confirm(`End sprint "${sprint.name}"? Incomplete stories will return to backlog.`)) return;
    endSprintMutation.mutate(sprint.id, {
      onSuccess: () => showToast({ type: "success", message: "Sprint ended — incomplete stories moved to backlog." }),
      onError: (err) => showToast({ type: "error", message: err?.message || "Failed to end sprint" }),
    });
  };

  if (isLoading) return <LinearProgress />;

  return (
    <Box sx={{ p: 2, height: "100%", overflowY: "auto" }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold">
          Backlog
        </Typography>
        <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setCreateSprintOpen(true)}>
          Create Sprint
        </Button>
      </Box>

      <DragDropContext onDragEnd={onDragEnd}>
        {/* Sprint Sections */}
        {sprints.length > 0 && (
          <Box mb={3}>
            {sprints.map((sprint) => (
              <SprintSection key={sprint.id} sprint={sprint} onStart={handleStartSprint} onEnd={handleEndSprint} onAddStories={setAddStoriesSprintId} navigate={navigate} projectId={projectId} />
            ))}
          </Box>
        )}

        {/* Backlog Section */}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Backlog ({backlogStories.length})
          </Typography>
          <Droppable droppableId="backlog">
            {(provided) => (
              <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ minHeight: 80 }}>
                {backlogStories.map((story, index) => (
                  <StoryCard key={story.id} story={story} index={index} projectId={projectId} />
                ))}
                {provided.placeholder}
                {backlogStories.length === 0 && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    No items in backlog. Create User Stories under Features to populate the backlog.
                  </Alert>
                )}
              </Box>
            )}
          </Droppable>
        </Paper>
      </DragDropContext>

      <CreateSprintModal open={createSprintOpen} onClose={() => setCreateSprintOpen(false)} projectId={projectId} />
      {addStoriesSprintId && <AddStoriesToSprintModal open={!!addStoriesSprintId} onClose={() => setAddStoriesSprintId(null)} projectId={projectId} sprintId={addStoriesSprintId} />}
    </Box>
  );
};

// Need navigate in StoryCard — passed as prop from BacklogBoard
export default BacklogBoard;
