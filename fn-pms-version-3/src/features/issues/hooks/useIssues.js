// Author: Copilot
// Created: 18th Mar 2026
// Description: React Query hooks for Issues
// Version: 1.5.0

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as issueService from "../api/issue.service";

// --- Query Keys ---
export const issueKeys = {
  all: ["issues"],
  list: (projectId, filters = {}) => [...issueKeys.all, "list", projectId, filters],
  detail: (id) => [...issueKeys.all, "detail", id],
  comments: (issueId) => [...issueKeys.detail(issueId), "comments"],
  tree: (issueId) => [...issueKeys.detail(issueId), "tree"],
  attachments: (issueId) => [...issueKeys.detail(issueId), "attachments"],
};

// --- Queries ---

export const useIssues = (projectId, filters) => {
  return useQuery({
    queryKey: issueKeys.list(projectId, filters),
    queryFn: () => issueService.getIssues(projectId, filters),
    enabled: !!projectId,
  });
};

export const useIssue = (id) => {
  return useQuery({
    queryKey: issueKeys.detail(id),
    queryFn: () => issueService.getIssueById(id),
    enabled: !!id,
  });
};

export const useIssueTree = (id) => {
  return useQuery({
    queryKey: issueKeys.tree(id),
    queryFn: () => issueService.getIssueTree(id),
    enabled: !!id,
  });
};

export const useComments = (issueId) => {
  return useQuery({
    queryKey: issueKeys.comments(issueId),
    queryFn: () => issueService.getComments(issueId),
    enabled: !!issueId,
  });
};

export const useAttachments = (issueId) => {
  return useQuery({
    queryKey: issueKeys.attachments(issueId),
    queryFn: () => issueService.getAttachments(issueId),
    enabled: !!issueId,
  });
};

export const useWorkflow = (projectId) => {
  return useQuery({
    queryKey: ["workflow", projectId],
    queryFn: () => issueService.getWorkflow(projectId),
    enabled: !!projectId,
  });
};

export const useIssueTypes = () => {
  return useQuery({
    queryKey: ["issueTypes"],
    queryFn: () => issueService.getIssueTypes(),
    staleTime: Infinity,
  });
};

export const useCreateIssueType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => issueService.createIssueType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issueTypes"] });
    },
  });
};

export const useProjectMembers = (projectId) => {
  return useQuery({
    queryKey: ["projectMembers", projectId],
    queryFn: () => issueService.getProjectMembers(projectId),
    enabled: !!projectId,
  });
};

export const useProjectUserStories = (projectId) => {
  return useQuery({
    queryKey: ["projectUserStories", projectId],
    queryFn: () => issueService.getProjectUserStories(projectId),
    enabled: !!projectId,
  });
};

// --- Mutations ---

export const useCreateIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, ...data }) => issueService.createIssue(projectId, data),
    onSuccess: (newItem, variables) => {
      queryClient.invalidateQueries({
        queryKey: issueKeys.list(variables.projectId),
      });
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
};

export const useUpdateIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => issueService.updateIssue(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: issueKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
};

export const useChangeStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statusId }) => issueService.changeIssueStatus(id, statusId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: issueKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
};

export const useAssignIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assigneeId }) => issueService.assignIssue(id, assigneeId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: issueKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
};

export const useDeleteIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: issueService.deleteIssue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, content }) => issueService.addComment(issueId, content),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: issueKeys.comments(variables.issueId),
      });
    },
  });
};

export const useUpdateComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, commentId, content }) => issueService.updateComment(issueId, commentId, content),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: issueKeys.comments(variables.issueId),
      });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, commentId }) => issueService.deleteComment(issueId, commentId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: issueKeys.comments(variables.issueId),
      });
    },
  });
};

export const useUploadAttachment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, formData }) => issueService.uploadAttachment(issueId, formData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: issueKeys.attachments(variables.issueId),
      });
    },
  });
};

export const useDeleteAttachment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, attachmentId }) => issueService.deleteAttachment(issueId, attachmentId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: issueKeys.attachments(variables.issueId),
      });
    },
  });
};

export const useLinkIssueToUserStory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, userStoryId }) => issueService.linkIssueToUserStory(issueId, userStoryId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(variables.issueId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
};

export const useLinkParent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, parentId }) => issueService.linkParent(issueId, parentId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(variables.issueId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.tree(variables.issueId) });
    },
  });
};
