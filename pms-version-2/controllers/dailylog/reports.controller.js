// Author: Gururaj
// Created: 26th Feb 2026
// Description: Controller for DailyLog Reports (Analytics)
// Version: 1.0.0

const ResponseService = require("../../services/Response");
const ReportsService = require("../../services/dailylog/reports.service");
const ReportsExportService = require("../../services/dailylog/reports-export.service");

exports.userProjectReport = async (req, res) => {
  const thisAction = { usedFor: "User Project Report", action: "Get" };
  try {
    const result = await ReportsService.userProjectReport(req);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error in userProjectReport:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

exports.dailyLogReport = async (req, res) => {
  const thisAction = { usedFor: "Daily Log Report", action: "Get" };
  try {
    const result = await ReportsService.dailyLogReport(req);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error in dailyLogReport:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

exports.productivitySummary = async (req, res) => {
  const thisAction = { usedFor: "Productivity Summary", action: "Get" };
  try {
    const result = await ReportsService.productivitySummary(req);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error in productivitySummary:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

exports.statusDistribution = async (req, res) => {
  const thisAction = { usedFor: "Status Distribution", action: "Get" };
  try {
    const result = await ReportsService.statusDistribution(req);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error in statusDistribution:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

exports.projectSummary = async (req, res) => {
  const thisAction = { usedFor: "Project Summary", action: "Get" };
  try {
    const { project_id } = req.params;
    const result = await ReportsService.projectSummary(req, project_id);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error in projectSummary:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

exports.exportToExcel = async (req, res) => {
  const thisAction = { usedFor: "Daily Logs Excel Export", action: "Export" };
  try {
    const result = await ReportsExportService.generateExcel(req);

    if (!result.success) {
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    }

    // Set response headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.data.filename}"`,
    );

    // Send the file buffer
    return res.send(result.data.buffer);
  } catch (err) {
    console.error("Error in exportToExcel:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      message: "Error exporting to Excel",
      ...thisAction,
    });
  }
};
