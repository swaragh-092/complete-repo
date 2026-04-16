// Author: Copilot
// Created: 18th Mar 2026
// Description: React Query hooks for Reports
// Version: 3.0.0

import { useQuery } from "@tanstack/react-query";
import * as reportService from "../api/report.service";

export const reportKeys = {
  distribution: (projectId) => ["reports", "distribution", projectId],
  velocity: (projectId) => ["reports", "velocity", projectId],
  burndown: (sprintId) => ["reports", "burndown", sprintId],
  workLogOverview: (params) => ["reports", "wl-overview", params],
  workLogDaily: (params) => ["reports", "wl-daily", params],
  workLogProject: (projectId, params) => ["reports", "wl-project", projectId, params],
  workLogDepartment: (departmentId, params) => ["reports", "wl-department", departmentId, params],
  // admin
  adminSummary: (params) => ["reports", "admin-summary", params],
  adminUsers: (params) => ["reports", "admin-users", params],
  adminProjects: (params) => ["reports", "admin-projects", params],
  adminDepartments: (params) => ["reports", "admin-departments", params],
  adminFeatures: (params) => ["reports", "admin-features", params],
  adminWorkLogs: (params) => ["reports", "admin-work-logs", params],
};

export const useIssueDistribution = (projectId) => {
  return useQuery({
    queryKey: reportKeys.distribution(projectId),
    queryFn: () => reportService.getIssueDistribution(projectId),
    enabled: !!projectId,
  });
};

export const useVelocityReport = (projectId) => {
  return useQuery({
    queryKey: reportKeys.velocity(projectId),
    queryFn: () => reportService.getVelocityReport(projectId),
    enabled: !!projectId,
  });
};

export const useSprintBurndown = (sprintId) => {
  return useQuery({
    queryKey: reportKeys.burndown(sprintId),
    queryFn: () => reportService.getSprintBurndown(sprintId),
    enabled: !!sprintId,
  });
};

export const useWorkLogOverview = (params = {}) => {
  return useQuery({
    queryKey: reportKeys.workLogOverview(params),
    queryFn: () => reportService.getWorkLogOverview(params),
    enabled: true,
  });
};

export const useDailyWorkLog = (params = {}) => {
  return useQuery({
    queryKey: reportKeys.workLogDaily(params),
    queryFn: () => reportService.getDailyWorkLog(params),
    enabled: !!(params.start_date && params.end_date),
  });
};

export const useProjectWorkLog = (projectId, params = {}) => {
  return useQuery({
    queryKey: reportKeys.workLogProject(projectId, params),
    queryFn: () => reportService.getProjectWorkLog(projectId, params),
    enabled: !!projectId,
  });
};

export const useDepartmentWorkLog = (departmentId, params = {}) => {
  return useQuery({
    queryKey: reportKeys.workLogDepartment(departmentId, params),
    queryFn: () => reportService.getDepartmentWorkLog(departmentId, params),
    enabled: !!departmentId,
  });
};

// ─── Admin Monitor hooks ──────────────────────────────────────────────────────

export const useAdminSummary = (params = {}) =>
  useQuery({
    queryKey: reportKeys.adminSummary(params),
    queryFn: () => reportService.getAdminSummary(params),
    enabled: true,
  });

export const useAdminUsers = (params = {}) =>
  useQuery({
    queryKey: reportKeys.adminUsers(params),
    queryFn: () => reportService.getAdminUsers(params),
    enabled: true,
  });

export const useAdminProjects = (params = {}) =>
  useQuery({
    queryKey: reportKeys.adminProjects(params),
    queryFn: () => reportService.getAdminProjects(params),
    enabled: true,
  });

export const useAdminDepartments = (params = {}) =>
  useQuery({
    queryKey: reportKeys.adminDepartments(params),
    queryFn: () => reportService.getAdminDepartments(params),
    enabled: true,
  });

export const useAdminFeatures = (params = {}) =>
  useQuery({
    queryKey: reportKeys.adminFeatures(params),
    queryFn: () => reportService.getAdminFeatures(params),
    enabled: true,
  });

export const useAdminWorkLogs = (params = {}) =>
  useQuery({
    queryKey: reportKeys.adminWorkLogs(params),
    queryFn: () => reportService.getAdminWorkLogs(params),
    enabled: true,
  });
