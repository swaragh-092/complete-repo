// Author: Copilot
// Description: API service functions for Site project type — Pages, Sections, Components
// Version: 1.0.0

import api from "../../../api/axios";

// ── Pages ─────────────────────────────────────────────────────────────────

export const getPagesByDepartment = (moduleCode, departmentId) =>
  api.get(`/page/module/${moduleCode}/department/${departmentId}`);

export const createPage = (moduleCode, departmentId, data) =>
  api.post(`/page/module/${moduleCode}/department/${departmentId}`, data);

export const getPage = (id) => api.get(`/page/${id}`);

export const updatePage = (id, data) => api.put(`/page/${id}`, data);

export const deletePage = (id) => api.delete(`/page/${id}`);

// ── Sections ──────────────────────────────────────────────────────────────

export const getSectionsByPage = (pageId) => api.get(`/section/page/${pageId}`);

export const createSection = (pageId, data) => api.post(`/section/page/${pageId}`, data);

export const getSection = (id) => api.get(`/section/${id}`);

export const updateSection = (id, data) => api.put(`/section/${id}`, data);

export const deleteSection = (id) => api.delete(`/section/${id}`);

// ── Components ────────────────────────────────────────────────────────────

export const getComponentsBySection = (sectionId) => api.get(`/component/section/${sectionId}`);

export const createComponent = (sectionId, data) => api.post(`/component/section/${sectionId}`, data);

export const getComponent = (id) => api.get(`/component/${id}`);

export const updateComponent = (id, data) => api.put(`/component/${id}`, data);

export const deleteComponent = (id) => api.delete(`/component/${id}`);

export const startComponentTimer = (id) => api.post(`/component/${id}/timer/start`);

export const stopComponentTimer = (id) => api.post(`/component/${id}/timer/stop`);

export const createHelperComponent = (id, data) => api.post(`/component/${id}/helper`, data);

export const getComponentDependencies = (id) => api.get(`/component/${id}/dependencies`);

export const addComponentDependency = (id, data) => api.post(`/component/${id}/dependency`, data);

export const removeComponentDependency = (id, depId) =>
  api.delete(`/component/${id}/dependency/${depId}`);

// ── Component Backlog ─────────────────────────────────────────────────────

export const getComponentBacklog = (projectId) =>
  api.get(`/backlog/project/${projectId}/components`);

export const prioritizeComponent = (data) => api.put(`/backlog/component/prioritize`, data);

export const moveComponentToSprint = (data) => api.put(`/backlog/component/move-to-sprint`, data);
