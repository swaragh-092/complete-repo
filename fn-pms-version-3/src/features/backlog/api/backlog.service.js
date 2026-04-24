// Author: Copilot
// Description: Services for Backlog
// Version: 2.0.0

import api from "../../../api/axios";

// ─── Issue Backlog (legacy bug-tracker items) ─────────────────────────────────
export const getBacklogIssues = (projectId) => api.get(`/backlog/project/${projectId}/list`);
export const reorderBacklogIssue = (data) => api.patch(`/backlog/prioritize`, data);
export const moveIssueToSprint = (data) => api.post(`/backlog/move-to-sprint`, data);

// ─── Story Backlog (User Stories as sprint work items) ──────────────────────
export const getBacklogStories = (projectId) => api.get(`/backlog/project/${projectId}/stories`);
export const reorderBacklogStory = (data) => api.patch(`/backlog/story/prioritize`, data);
export const moveStoryToSprint = (data) => api.post(`/backlog/story/move-to-sprint`, data);

// ─── Board Story move ────────────────────────────────────────────────
export const moveStoryOnBoard = (data) => api.post(`/board/move-story`, data);

// ─── Component Backlog (Site project type) ───────────────────────────────────
export const getComponentBacklog = (projectId) => api.get(`/backlog/project/${projectId}/components`);
export const prioritizeComponent = (data) => api.put(`/backlog/component/prioritize`, data);
export const moveComponentToSprint = (data) => api.put(`/backlog/component/move-to-sprint`, data);
