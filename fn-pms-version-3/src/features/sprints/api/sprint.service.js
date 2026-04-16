// Author: Gururaj
// Created: 18th Mar 2026
// Description: Sprint API service for CRUD, start/end, and issue-management sprint endpoint calls.
// Version: 1.0.0
// Modified:

import api from "../../../api/axios";

export const getSprints = (projectId) => api.get(`/sprint/project/${projectId}/list`);

export const createSprint = (projectId, data) => api.post(`/sprint/project/${projectId}/create`, data);

export const startSprint = (id) => api.post(`/sprint/${id}/start`);

export const endSprint = (id) => api.post(`/sprint/${id}/end`);

export const addIssuesToSprint = (sprintId, issueIds) => api.post(`/sprint/${sprintId}/issues`, { issue_ids: issueIds });

export const getSprintIssues = (id) => api.get(`/sprint/${id}/backlog`);

// ─── User Story sprint functions ─────────────────────────────────────────────

export const addStoriesToSprint = (sprintId, storyIds) => api.post(`/sprint/${sprintId}/stories`, { story_ids: storyIds });

export const getSprintStories = (sprintId) => api.get(`/sprint/${sprintId}/stories`);
