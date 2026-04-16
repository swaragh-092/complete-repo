// Author: Copilot
// Created: 18th Mar 2026
// Description: Report Controller
// Version: 1.0.0

const ReportService = require("../../services/project/Report.service");
const ResponseService = require("../../services/Response");
const { sendErrorResponse } = require("../../util/helper");
const { validationResult } = require("express-validator");

class ReportController {
  // Issue Distribution by Status
  static async issueDistribution(req, res) {
    const thisAction = { usedFor: "Reports", action: "Issue Distribution" };
    try {
      const projectId = req.params.projectId;
      const result = await ReportService.getIssueDistribution(req, projectId);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Velocity Chart
  static async velocity(req, res) {
    const thisAction = { usedFor: "Reports", action: "Velocity Chart" };
    try {
      const projectId = req.params.projectId;
      const limit = req.query.limit ? parseInt(req.query.limit) : 5;
      const result = await ReportService.getVelocity(req, projectId, limit);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Issue Completion Rate
  static async completionRate(req, res) {
    const thisAction = { usedFor: "Reports", action: "Completion Rate" };
    try {
      const projectId = req.params.projectId;
      const result = await ReportService.getCompletionRate(req, projectId);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Sprint Burndown
  static async sprintBurndown(req, res) {
    const thisAction = { usedFor: "Reports", action: "Sprint Burndown" };
    try {
      const sprintId = req.params.sprintId;
      const result = await ReportService.getSprintBurndown(req, sprintId);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }
}

module.exports = ReportController;
