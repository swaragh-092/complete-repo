// Author: Copilot
// Created: 18th Mar 2026
// Description: React Query hooks for Sprints
// Version: 1.0.0

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as sprintService from "../api/sprint.service";

export const sprintKeys = {
  all: ["sprints"],
  project: (projectId) => [...sprintKeys.all, "project", projectId],
  detail: (sprintId) => [...sprintKeys.all, "detail", sprintId],
  issues: (sprintId) => [...sprintKeys.detail(sprintId), "issues"],
};

export const useSprints = (projectId) => {
  return useQuery({
    queryKey: sprintKeys.project(projectId),
    queryFn: () => sprintService.getSprints(projectId),
    enabled: !!projectId,
  });
};

export const useSprintIssues = (sprintId) => {
  return useQuery({
    queryKey: sprintKeys.issues(sprintId),
    queryFn: () => sprintService.getSprintIssues(sprintId),
    enabled: !!sprintId,
  });
};

export const useCreateSprint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, ...data }) => sprintService.createSprint(projectId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.project(variables.projectId) });
    },
  });
};

export const useStartSprint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sprintId) => sprintService.startSprint(sprintId),
    onSuccess: (data, sprintId) => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.detail(sprintId) });
      queryClient.invalidateQueries({ queryKey: sprintKeys.all }); // To refresh sprint list statuses
    },
  });
};

export const useEndSprint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sprintId) => sprintService.endSprint(sprintId),
    onSuccess: (data, sprintId) => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.detail(sprintId) });
      queryClient.invalidateQueries({ queryKey: sprintKeys.all });
    },
  });
};

export const useAddIssuesToSprint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sprintId, issueIds }) => sprintService.addIssuesToSprint(sprintId, issueIds),
    onSuccess: (data, { sprintId }) => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.issues(sprintId) });
    },
  });
};

// ─── User Story Sprint hooks ────────────────────────────────────────────────

export const sprintStoryKeys = {
  stories: (sprintId) => [...sprintKeys.detail(sprintId), "stories"],
};

export const useSprintStories = (sprintId) => {
  return useQuery({
    queryKey: sprintStoryKeys.stories(sprintId),
    queryFn: () => sprintService.getSprintStories(sprintId),
    enabled: !!sprintId,
  });
};

export const useAddStoriesToSprint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sprintId, storyIds }) => sprintService.addStoriesToSprint(sprintId, storyIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintStoryKeys.stories });
      queryClient.invalidateQueries({ queryKey: ["backlog"] });
    },
  });
};
