// Author: Copilot
// Description: Backlog board for Site-type projects — Components as sprint work items.
// Version: 1.0.0

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Chip, Paper, Stack, Typography, LinearProgress } from "@mui/material";
import { Add } from "@mui/icons-material";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useSprints, useSprintStories, useStartSprint, useEndSprint } from "../../sprints/hooks/useSprints";
import { useComponentBacklog, useMoveComponentToSprint } from "../hooks/useBacklog";
import CreateSprintModal from "../../sprints/components/CreateSprintModal";
import AddStoriesToSprintModal from "../../sprints/components/AddStoriesToSprintModal";
import { showToast } from "../../../util/feedback/ToastService";
import { paths } from "../../../util/urls";
import { Accordion, AccordionDetails, AccordionSummary, IconButton, Tooltip } from "@mui/material";
import { ExpandMore, PlayArrow, Stop } from "@mui/icons-material";

const priorityColors = { critical: "error", high: "warning", medium: "info", low: "default" };

const ComponentCard = ({ component, index }) => {
  const navigate = useNavigate();
  return (
    <Draggable draggableId={component.id} index={index}>
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
          <Box minWidth={0} sx={{ cursor: "pointer" }} onClick={() => navigate(paths.component_detail(component.id).actualPath)}>
            <Typography variant="body2" noWrap fontWeight={500}>
              {component.title}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {component.section?.title && `${component.section.title} • `}
              {component.story_points ? `${component.story_points} pts` : "—"}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.5} flexShrink={0} ml={1}>
            <Chip label={component.priority} size="small" color={priorityColors[component.priority] || "default"} variant="outlined" />
          </Stack>
        </Paper>
      )}
    </Draggable>
  );
};

const SprintSection = ({ sprint, onStart, onEnd, onAddStories, navigate, projectId }) => {
  const { data: sprintStoriesData } = useSprintStories(sprint.id);
  const sprintStories = useMemo(() => {
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
          <Chip label={`${sprintStories.length} components`} size="small" variant="outlined" />
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
            <Tooltip title="Add Components to Sprint">
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
              {sprintStories.map((component, index) => (
                <ComponentCard key={component.id} component={component} index={index} />
              ))}
              {sprintStories.length === 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  Drag components here to plan this sprint
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

const ComponentBacklogBoard = ({ projectId }) => {
  const navigate = useNavigate();
  const [createSprintOpen, setCreateSprintOpen] = useState(false);
  const [addStoriesSprintId, setAddStoriesSprintId] = useState(null);

  const { data: sprintsData } = useSprints(projectId);
  const { data: backlogData, isLoading } = useComponentBacklog(projectId);
  const moveComponentMutation = useMoveComponentToSprint();
  const startSprintMutation = useStartSprint();
  const endSprintMutation = useEndSprint();

  const sprints = useMemo(() => {
    if (Array.isArray(sprintsData)) return sprintsData;
    return sprintsData?.data || [];
  }, [sprintsData]);

  const backlogComponents = useMemo(() => {
    if (Array.isArray(backlogData?.data)) return backlogData.data;
    return backlogData?.data?.data || [];
  }, [backlogData]);

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const destId = destination.droppableId;
    const sprintId = destId === "backlog" ? null : destId;

    moveComponentMutation.mutate(
      { component_id: draggableId, sprint_id: sprintId },
      {
        onSuccess: () => showToast({ type: "success", message: sprintId ? "Moved to sprint" : "Moved to backlog" }),
        onError: (err) => showToast({ type: "error", message: err?.message || "Failed to move component" }),
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
    if (!window.confirm(`End sprint "${sprint.name}"? Incomplete components will return to backlog.`)) return;
    endSprintMutation.mutate(sprint.id, {
      onSuccess: () => showToast({ type: "success", message: "Sprint ended — incomplete components moved to backlog." }),
      onError: (err) => showToast({ type: "error", message: err?.message || "Failed to end sprint" }),
    });
  };

  if (isLoading) return <LinearProgress />;

  return (
    <Box sx={{ p: 2, height: "100%", overflowY: "auto" }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold">
          Component Backlog
        </Typography>
        <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setCreateSprintOpen(true)}>
          Create Sprint
        </Button>
      </Box>

      <DragDropContext onDragEnd={onDragEnd}>
        {sprints.length > 0 && (
          <Box mb={3}>
            {sprints.map((sprint) => (
              <SprintSection
                key={sprint.id}
                sprint={sprint}
                onStart={handleStartSprint}
                onEnd={handleEndSprint}
                onAddStories={setAddStoriesSprintId}
                navigate={navigate}
                projectId={projectId}
              />
            ))}
          </Box>
        )}

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Backlog ({backlogComponents.length})
          </Typography>
          <Droppable droppableId="backlog">
            {(provided) => (
              <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ minHeight: 80 }}>
                {backlogComponents.map((component, index) => (
                  <ComponentCard key={component.id} component={component} index={index} />
                ))}
                {provided.placeholder}
                {backlogComponents.length === 0 && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    No components in backlog. Create Components under Sections to populate the backlog.
                  </Alert>
                )}
              </Box>
            )}
          </Droppable>
        </Paper>
      </DragDropContext>

      <CreateSprintModal open={createSprintOpen} onClose={() => setCreateSprintOpen(false)} projectId={projectId} />
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

export default ComponentBacklogBoard;
