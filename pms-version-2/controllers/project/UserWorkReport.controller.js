// Author: Gururaj
// Created: 1st Jan 2026
// Description: User Work Report controller with HTTP handlers for work-log overview, daily, project, and department reports.
// Version: 1.0.0
// Modified:

// Description: User Work Report Controller
// Version: 1.0.0

const UserWorkReportService = require("../../services/project/UserWorkReport.service");
const ResponseService = require("../../services/Response");
const { sendErrorResponse } = require("../../util/helper");

/**
 * GET /report/work-logs/overview
 * Query: start_date, end_date, user_id (optional)
 */
exports.overview = async (req, res) => {
  const thisAction = { usedFor: "WorkLog", action: "Overview" };
  try {
    const { start_date, end_date, user_id } = req.query;
    const result = await UserWorkReportService.getOverview(req, {
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
 * GET /report/work-logs/daily
 * Query: start_date (required), end_date (required), user_id (optional)
 */
exports.daily = async (req, res) => {
  const thisAction = { usedFor: "WorkLog", action: "Daily Report" };
  try {
    const { start_date, end_date, user_id } = req.query;
    const result = await UserWorkReportService.getDailyReport(req, {
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
 * GET /report/work-logs/project/:projectId
 * Query: start_date, end_date, user_id (optional)
 */
exports.projectReport = async (req, res) => {
  const thisAction = { usedFor: "WorkLog", action: "Project Report" };
  try {
    const { projectId } = req.params;
    const { start_date, end_date, user_id } = req.query;
    const result = await UserWorkReportService.getProjectReport(
      req,
      projectId,
      { start_date, end_date, user_id },
    );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

/**
 * GET /report/work-logs/department/:departmentId
 * Query: start_date, end_date, user_id (optional)
 */
exports.departmentReport = async (req, res) => {
  const thisAction = { usedFor: "WorkLog", action: "Department Report" };
  try {
    const { departmentId } = req.params;
    const { start_date, end_date, user_id } = req.query;
    const result = await UserWorkReportService.getDepartmentReport(
      req,
      departmentId,
      { start_date, end_date, user_id },
    );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};
