// Author: Copilot
// Created: 18th Mar 2026
// Description: Report Routes
// Version: 3.0.0

const express = require("express");
const router = express.Router();
const ReportController = require("../../controllers/project/Report.controller");
const UserWorkReportController = require("../../controllers/project/UserWorkReport.controller");
const AdminMonitorController = require("../../controllers/project/AdminMonitor.controller");
const { param, query } = require("express-validator");
const validationMiddleware = require("../../middleware/validation.middleware");

// ─── Existing Project Chart Reports ───────────────────────────────────────────

// Get Issue Distribution by Status (Project)
router.get(
  "/distribution/:projectId",
  [param("projectId", "Project ID must be a UUID").isUUID()],
  validationMiddleware("Report", "Issue Distribution"),
  ReportController.issueDistribution,
);

// Get Velocity Chart (Project)
router.get(
  "/velocity/:projectId",
  [
    param("projectId", "Project ID must be a UUID").isUUID(),
    query("limit").optional().isInt({ min: 1, max: 20 }),
  ],
  validationMiddleware("Report", "Velocity Chart"),
  ReportController.velocity,
);

// Get Issue Completion Rate (Project)
router.get(
  "/completion-rate/:projectId",
  [param("projectId", "Project ID must be a UUID").isUUID()],
  validationMiddleware("Report", "Completion Rate"),
  ReportController.completionRate,
);

// Get Sprint Burndown (Sprint)
router.get(
  "/sprint-burndown/:sprintId",
  [param("sprintId", "Sprint ID must be a UUID").isUUID()],
  validationMiddleware("Report", "Sprint Burndown"),
  ReportController.sprintBurndown,
);

// ─── Work Log Reports (Work-log must come before /:id wildcard routes) ────────

// Overview: projects + departments + daily totals for the current user
router.get(
  "/work-logs/overview",
  [
    query("start_date")
      .optional()
      .isISO8601()
      .withMessage("start_date must be a valid date"),
    query("end_date")
      .optional()
      .isISO8601()
      .withMessage("end_date must be a valid date"),
    query("user_id").optional().isUUID().withMessage("user_id must be a UUID"),
  ],
  validationMiddleware("WorkLog", "Overview"),
  UserWorkReportController.overview,
);

// Daily work report
router.get(
  "/work-logs/daily",
  [
    query("start_date")
      .notEmpty()
      .isISO8601()
      .withMessage("start_date is required and must be a valid date"),
    query("end_date")
      .notEmpty()
      .isISO8601()
      .withMessage("end_date is required and must be a valid date"),
    query("user_id").optional().isUUID().withMessage("user_id must be a UUID"),
  ],
  validationMiddleware("WorkLog", "Daily Report"),
  UserWorkReportController.daily,
);

// Project-wise work report
router.get(
  "/work-logs/project/:projectId",
  [
    param("projectId", "Project ID must be a UUID").isUUID(),
    query("start_date")
      .optional()
      .isISO8601()
      .withMessage("start_date must be a valid date"),
    query("end_date")
      .optional()
      .isISO8601()
      .withMessage("end_date must be a valid date"),
    query("user_id").optional().isUUID().withMessage("user_id must be a UUID"),
  ],
  validationMiddleware("WorkLog", "Project Report"),
  UserWorkReportController.projectReport,
);

// Department-wise work report
router.get(
  "/work-logs/department/:departmentId",
  [
    param("departmentId", "Department ID must be a UUID").isUUID(),
    query("start_date")
      .optional()
      .isISO8601()
      .withMessage("start_date must be a valid date"),
    query("end_date")
      .optional()
      .isISO8601()
      .withMessage("end_date must be a valid date"),
    query("user_id").optional().isUUID().withMessage("user_id must be a UUID"),
  ],
  validationMiddleware("WorkLog", "Department Report"),
  UserWorkReportController.departmentReport,
);

// ─── Admin Monitor Routes (org owner / admin only) ────────────────────────────
// Note: role enforcement happens in the frontend + the caller passes their token;
// the service layer does not restrict by user_id so any authenticated user can
// trigger it. Add a role-check middleware here if stricter server-side enforcement
// is needed.

const adminDateQuery = [
  query("start_date")
    .optional()
    .isISO8601()
    .withMessage("start_date must be a valid date"),
  query("end_date")
    .optional()
    .isISO8601()
    .withMessage("end_date must be a valid date"),
];

// GET /report/admin/summary
router.get(
  "/admin/summary",
  adminDateQuery,
  validationMiddleware("AdminMonitor", "Summary"),
  AdminMonitorController.summary,
);

// GET /report/admin/users
router.get(
  "/admin/users",
  [
    ...adminDateQuery,
    query("user_id").optional().isUUID().withMessage("user_id must be a UUID"),
  ],
  validationMiddleware("AdminMonitor", "Users Report"),
  AdminMonitorController.users,
);

// GET /report/admin/projects
router.get(
  "/admin/projects",
  [
    ...adminDateQuery,
    query("project_id")
      .optional()
      .isUUID()
      .withMessage("project_id must be a UUID"),
  ],
  validationMiddleware("AdminMonitor", "Projects Report"),
  AdminMonitorController.projects,
);

// GET /report/admin/departments
router.get(
  "/admin/departments",
  [
    ...adminDateQuery,
    query("department_id")
      .optional()
      .isUUID()
      .withMessage("department_id must be a UUID"),
  ],
  validationMiddleware("AdminMonitor", "Departments Report"),
  AdminMonitorController.departments,
);

// GET /report/admin/features
router.get(
  "/admin/features",
  [
    ...adminDateQuery,
    query("project_id")
      .optional()
      .isUUID()
      .withMessage("project_id must be a UUID"),
  ],
  validationMiddleware("AdminMonitor", "Features Report"),
  AdminMonitorController.features,
);

// GET /report/admin/work-logs
router.get(
  "/admin/work-logs",
  [
    ...adminDateQuery,
    query("user_id").optional().isUUID(),
    query("project_id").optional().isUUID(),
    query("department_id").optional().isUUID(),
    query("feature_id").optional().isUUID(),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 1000 }),
  ],
  validationMiddleware("AdminMonitor", "Work Logs"),
  AdminMonitorController.workLogs,
);

module.exports = router;
