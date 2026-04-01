// Author: Gururaj
// Created: 18th Mar 2026
// Description: Report API service with wrappers for distribution, velocity, burndown, and work-log endpoints.
// Version: 1.0.0
// Modified:

import api from "../../../api/axios";

const unwrap = (response) => response.data;

// ─── Existing project chart reports ─────────────────────────────────────────
export const getIssueDistribution = (projectId) => api.get(`/report/distribution/${projectId}`).then(unwrap);
export const getVelocityReport = (projectId) => api.get(`/report/velocity/${projectId}`).then(unwrap);
export const getSprintBurndown = (sprintId) => api.get(`/report/sprint-burndown/${sprintId}`).then(unwrap);

// ─── Work-log reports ────────────────────────────────────────────────────────

/**
 * Overview: totals by project, department and daily buckets.
 * @param {object} params – { start_date?, end_date?, user_id? }
 */
export const getWorkLogOverview = (params = {}) => api.get("/report/work-logs/overview", { params }).then(unwrap);

/**
 * Daily breakdown: each day → list of sessions worked.
 * @param {object} params – { start_date, end_date, user_id? }
 */
export const getDailyWorkLog = (params = {}) => api.get("/report/work-logs/daily", { params }).then(unwrap);

/**
 * Project-wise breakdown: feature → user story → sessions.
 * @param {string} projectId
 * @param {object} params – { start_date?, end_date?, user_id? }
 */
export const getProjectWorkLog = (projectId, params = {}) => api.get(`/report/work-logs/project/${projectId}`, { params }).then(unwrap);

/**
 * Department-wise breakdown: project → feature → user story → sessions.
 * @param {string} departmentId
 * @param {object} params – { start_date?, end_date?, user_id? }
 */
export const getDepartmentWorkLog = (departmentId, params = {}) => api.get(`/report/work-logs/department/${departmentId}`, { params }).then(unwrap);

// ─── Admin Monitor reports (owner / admin only) ──────────────────────────────

export const getAdminSummary = (params = {}) => api.get("/report/admin/summary", { params });
export const getAdminUsers = (params = {}) => api.get("/report/admin/users", { params });
export const getAdminProjects = (params = {}) => api.get("/report/admin/projects", { params });
export const getAdminDepartments = (params = {}) => api.get("/report/admin/departments", { params });
export const getAdminFeatures = (params = {}) => api.get("/report/admin/features", { params });
export const getAdminWorkLogs = (params = {}) => api.get("/report/admin/work-logs", { params });
