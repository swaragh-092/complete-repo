// Author: Copilot
// Created: 18th Mar 2026
// Description: Kanban Board Component for Issues
// Version: 1.0.0

import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Paper, Chip, Avatar, CircularProgress } from "@mui/material";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"; // Using hello-pangea/dnd for better React 18+ support
import { useIssues, useWorkflow, useChangeStatus } from "../hooks/useIssues";
import { paths } from "../../../util/urls";

const KanbanBoard = ({ projectId: propProjectId }) => {
  const params = useParams();
  const projectId = propProjectId || params.projectId;
  const navigate = useNavigate();

  // Queries
  const { data: issuesData, isLoading: issuesLoading } = useIssues(projectId);
  const { data: workflowData, isLoading: workflowLoading } = useWorkflow(projectId);

  // Mutations
  const changeStatusMutation = useChangeStatus();

  // Process Data
  const issues = useMemo(() => {
    if (issuesData?.data?.data) return issuesData.data.data;
    if (Array.isArray(issuesData?.data)) return issuesData.data;
    if (Array.isArray(issuesData)) return issuesData;
    return [];
  }, [issuesData]);

  const statuses = useMemo(() => {
    if (!workflowData) return [];
    if (Array.isArray(workflowData)) return workflowData;
    if (workflowData.data) {
      if (Array.isArray(workflowData.data)) return workflowData.data;
      if (workflowData.data.statuses) return workflowData.data.statuses;
    }
    if (workflowData.statuses) return workflowData.statuses;
    return [];
  }, [workflowData]);

  // Group issues by status
  const columns = useMemo(() => {
    if (!statuses.length) return {};

    const cols = {};
    statuses.forEach((status) => {
      cols[status.id] = {
        ...status,
        issues: [],
      };
    });

    issues.forEach((issue) => {
      if (issue.status_id && cols[issue.status_id]) {
        cols[issue.status_id].issues.push(issue);
      } else if (statuses.length > 0) {
        // Fallback or unassigned status handling?
        // cols[statuses[0].id].issues.push(issue);
      }
    });

    return cols;
  }, [issues, statuses]);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const newStatusId = destination.droppableId;

    // Optimistic update could happen here, but we'll rely on React Query invalidation for now
    changeStatusMutation.mutate({
      id: draggableId,
      statusId: newStatusId,
    });
  };

  if (issuesLoading || workflowLoading) {
    return (
      <Box display="flex" justifyContent="center" p={5}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", overflowX: "auto", p: 2 }}>
      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: "flex", gap: 2, minWidth: "fit-content" }}>
          {statuses.map((status) => {
            const columnIssues = columns[status.id]?.issues || [];

            return (
              <Droppable key={status.id} droppableId={String(status.id)}>
                {(provided, snapshot) => (
                  <Paper
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    sx={{
                      width: 280,
                      minWidth: 280,
                      bgcolor: snapshot.isDraggingOver ? "action.hover" : "background.default",
                      p: 2,
                      display: "flex",
                      flexDirection: "column",
                      maxHeight: "80vh",
                    }}
                  >
                    <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {status.name}
                      </Typography>
                      <Chip label={columnIssues.length} size="small" />
                    </Box>

                    <Box sx={{ flexGrow: 1, overflowY: "auto", minHeight: 100 }}>
                      {columnIssues.map((issue, index) => (
                        <Draggable key={issue.id} draggableId={String(issue.id)} index={index}>
                          {(provided) => (
                            <Paper
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => navigate(paths.issue_detail(projectId, issue.id).actualPath)}
                              sx={{
                                p: 2,
                                mb: 2,
                                cursor: "pointer",
                                bgcolor: "background.paper",
                                "&:hover": { boxShadow: 3 },
                                ...provided.draggableProps.style,
                              }}
                            >
                              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: "0.75rem" }}>
                                {issue.issueType?.name || "Issue"} • {issue.priority}
                              </Typography>
                              <Typography variant="subtitle2" gutterBottom>
                                {issue.title}
                              </Typography>
                              <Box display="flex" justifyContent="flex-end" mt={1}>
                                {issue.assignee?.user?.username && (
                                  <Avatar sx={{ width: 24, height: 24, fontSize: 12 }} alt={issue.assignee.user.username}>
                                    {issue.assignee.user.username[0].toUpperCase()}
                                  </Avatar>
                                )}
                              </Box>
                            </Paper>
                          )}
                        </Draggable>
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
    </Box>
  );
};

export default KanbanBoard;
