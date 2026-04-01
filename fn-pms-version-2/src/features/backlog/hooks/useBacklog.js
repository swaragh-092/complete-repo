// Author: Copilot
// Description: React Query hooks for Backlog (stories + issues)
// Version: 2.0.0

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as backlogService from "../api/backlog.service";
import { sprintKeys, sprintStoryKeys } from "../../sprints/hooks/useSprints";

export const backlogKeys = {
  all: ["backlog"],
  list: (projectId) => [...backlogKeys.all, "list", projectId],
  stories: (projectId) => [...backlogKeys.all, "stories", projectId],
};

export const useBacklogIssues = (projectId) => {
  return useQuery({
    queryKey: backlogKeys.list(projectId),
    queryFn: () => backlogService.getBacklogIssues(projectId),
    enabled: !!projectId,
  });
};

export const useBacklogStories = (projectId) => {
  return useQuery({
    queryKey: backlogKeys.stories(projectId),
    queryFn: () => backlogService.getBacklogStories(projectId),
    enabled: !!projectId,
  });
};

export const useReorderBacklogIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issue_id, board_order }) => backlogService.reorderBacklogIssue({ issue_id, board_order }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backlogKeys.all });
    },
  });
};

export const useReorderBacklogStory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ story_id, backlog_order }) => backlogService.reorderBacklogStory({ story_id, backlog_order }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backlogKeys.all });
    },
  });
};

export const useMoveIssueToSprint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issue_id, sprint_id }) => backlogService.moveIssueToSprint({ issue_id, sprint_id }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: backlogKeys.all });
      if (variables.sprint_id) {
        queryClient.invalidateQueries({ queryKey: sprintKeys.detail(variables.sprint_id) });
      }
    },
  });
};

export const useMoveStoryToSprint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ story_id, sprint_id }) => backlogService.moveStoryToSprint({ story_id, sprint_id }),
    onSuccess: () => {
      // Invalidate both backlog and ALL sprint story queries (source sprint unknown)
      queryClient.invalidateQueries({ queryKey: backlogKeys.all });
      queryClient.invalidateQueries({ queryKey: sprintStoryKeys.stories });
    },
  });
};

export const useMoveStoryOnBoard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => backlogService.moveStoryOnBoard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backlogKeys.all });
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
    },
    onError: () => {
      // Refetch sprint stories to reset the card to its original column
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
    },
  });
};
