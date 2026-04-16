// Author: Copilot
// Created: 18th Mar 2026
// Description: Issue Service Module
// Version: 1.1.0

import api from "../../../api/axios";

// --- Issues ---

export const getIssues = async (projectId, params) => {
  const response = await api.get(`/issue/project/${projectId}`, { params });
  return response;
};

export const getIssueById = async (id) => {
  const response = await api.get(`/issue/${id}`);
  return response;
};

export const createIssue = async (projectId, data) => {
  const response = await api.post(`/issue/project/${projectId}`, data);
  return response;
};

export const updateIssue = async (id, data) => {
  const response = await api.put(`/issue/${id}`, data);
  return response;
};

export const deleteIssue = async (id) => {
  const response = await api.delete(`/issue/${id}`);
  return response;
};

export const changeIssueStatus = async (id, statusId) => {
  const response = await api.put(`/issue/${id}/status`, { status_id: statusId });
  return response;
};

export const assignIssue = async (id, assigneeId) => {
  const response = await api.put(`/issue/${id}/assign`, { assignee_id: assigneeId });
  return response;
};

// --- Hierarchy ---

export const getIssueTree = async (id) => {
  const response = await api.get(`/issue/${id}/tree`);
  return response;
};

// --- Comments ---

export const getComments = async (issueId) => {
  const response = await api.get(`/issue/${issueId}/comments`);
  return response;
};

export const addComment = async (issueId, content) => {
  const response = await api.post(`/issue/${issueId}/comments`, { content });
  return response;
};

export const updateComment = async (issueId, commentId, content) => {
  const response = await api.put(`/issue/${issueId}/comments/${commentId}`, { content });
  return response;
};

export const deleteComment = async (issueId, commentId) => {
  const response = await api.delete(`/issue/${issueId}/comments/${commentId}`);
  return response;
};

// --- Meta / Config ---

export const getWorkflow = async (projectId) => {
  const response = await api.get(`/issue/project/${projectId}/workflow`);
  return response;
};

export const getIssueTypes = async () => {
  const response = await api.get("/issue/types");
  return response;
};

export const createIssueType = async (data) => {
  const response = await api.post("/issue/type/create", data);
  return response;
};

export const getProjectMembers = async (projectId) => {
  const response = await api.get(`/project/member/${projectId}`);
  return response;
};

export const uploadAttachment = async (issueId, formData) => {
  const response = await api.post(`/issue/${issueId}/attachments`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response;
};

// --- Attachments ---

export const getAttachments = async (issueId) => {
  const response = await api.get(`/issue/${issueId}/attachments`);
  return response;
};

export const deleteAttachment = async (issueId, attachmentId) => {
  const response = await api.delete(`/issue/${issueId}/attachments/${attachmentId}`);
  return response;
};

// --- User Story linkage ---

export const linkIssueToUserStory = async (issueId, userStoryId) => {
  const response = await api.put(`/issue/${issueId}/user-story`, { user_story_id: userStoryId ?? null });
  return response;
};

export const getProjectUserStories = async (projectId) => {
  const response = await api.get(`/user-story/project/${projectId}`);
  return response;
};

// --- Hierarchy (parent linking) ---

export const linkParent = async (issueId, parentId) => {
  const response = await api.put(`/issue/${issueId}/parent`, { parent_id: parentId ?? null });
  return response;
};

// --- Attachment download (returns Blob) ---

export const downloadAttachment = async (attachmentId) => {
  const response = await api.get(`/issue/attachments/${attachmentId}/download`, {
    responseType: "blob",
  });
  return response;
};
