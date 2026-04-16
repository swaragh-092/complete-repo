// Author: Gururaj
// Created: 1st Jan 2026
// Description: Admin Monitor controller with HTTP handlers for organisation-wide KPI summaries and user/project breakdown reports.
// Version: 1.0.0
// Modified:

// Description: Admin Monitor Controller
// Version: 1.0.0

const AdminMonitorService = require("../../services/project/AdminMonitor.service");
const ResponseService = require("../../services/Response");
const { sendErrorResponse } = require("../../util/helper");

/**
 * GET /report/admin/summary
 * Admin KPI overview across all users
 */
exports.summary = async (req, res) => {
  const thisAction = { usedFor: "AdminMonitor", action: "Summary" };
  try {
    const { start_date, end_date } = req.query;
    const result = await AdminMonitorService.getAdminSummary(req, {
      start_date,
      end_date,
    });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

/**
 * GET /report/admin/users
 * All-user work log breakdown (optionally filter by user_id)
 */
exports.users = async (req, res) => {
  const thisAction = { usedFor: "AdminMonitor", action: "Users Report" };
  try {
    const { start_date, end_date, user_id } = req.query;
    const result = await AdminMonitorService.getUsersReport(req, {
      start_date,
      end_date,
      user_id,
    });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

/**
 * GET /report/admin/projects
 * All-project breakdown with completion stats (optionally filter by project_id)
 */
exports.projects = async (req, res) => {
  const thisAction = { usedFor: "AdminMonitor", action: "Projects Report" };
  try {
    const { start_date, end_date, project_id } = req.query;
    const result = await AdminMonitorService.getProjectsReport(req, {
      start_date,
      end_date,
      project_id,
    });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

/**
 * GET /report/admin/departments
 * All-department breakdown (optionally filter by department_id)
 */
exports.departments = async (req, res) => {
  const thisAction = { usedFor: "AdminMonitor", action: "Departments Report" };
  try {
    const { start_date, end_date, department_id } = req.query;
    const result = await AdminMonitorService.getDepartmentsReport(req, {
      start_date,
      end_date,
      department_id,
    });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

/**
 * GET /report/admin/features
 * All-feature health report (optionally filter by project_id)
 */
exports.features = async (req, res) => {
  const thisAction = { usedFor: "AdminMonitor", action: "Features Report" };
  try {
    const { start_date, end_date, project_id } = req.query;
    const result = await AdminMonitorService.getFeaturesReport(req, {
      start_date,
      end_date,
      project_id,
    });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

/**
 * GET /report/admin/work-logs
 * Raw paginated work log (all users, all filters)
 */
exports.workLogs = async (req, res) => {
  const thisAction = { usedFor: "AdminMonitor", action: "Work Logs" };
  try {
    const {
      start_date,
      end_date,
      user_id,
      project_id,
      department_id,
      feature_id,
      page,
      limit,
    } = req.query;
    const result = await AdminMonitorService.getRawWorkLog(req, {
      start_date,
      end_date,
      user_id,
      project_id,
      department_id,
      feature_id,
      page,
      limit,
    });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};
