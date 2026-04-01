// Author: Copilot
// Created: 18th Mar 2026
// Description: Sprint Controller
// Version: 1.0.0

const SprintService = require("../../services/project/Sprint.service");
const ResponseService = require("../../services/Response");
const { sendErrorResponse } = require("../../util/helper");
const { validationResult } = require("express-validator");

class SprintController {
  // Create Sprint
  static async create(req, res) {
    const thisAction = { usedFor: "Sprint", action: "Create Sprint" };
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendErrorResponse(
          thisAction,
          { message: errors.array()[0].msg },
          res,
        );
      }

      const projectId = req.params.projectId;
      const { name, start_date, end_date, goal } = req.body;

      const result = await SprintService.createSprint(req, {
        project_id: projectId,
        name,
        start_date,
        end_date,
        goal,
      });
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Start Sprint
  static async start(req, res) {
    const thisAction = { usedFor: "Sprint", action: "Start Sprint" };
    try {
      const sprintId = req.params.sprintId;
      const result = await SprintService.startSprint(req, sprintId);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // End Sprint
  static async end(req, res) {
    const thisAction = { usedFor: "Sprint", action: "End Sprint" };
    try {
      const sprintId = req.params.sprintId;
      const result = await SprintService.endSprint(req, sprintId);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Add Issues to Sprint
  static async addIssues(req, res) {
    const thisAction = { usedFor: "Sprint", action: "Add Issues" };
    try {
      const sprintId = req.params.sprintId;
      const { issue_ids } = req.body; // Array of UUIDs

      if (!Array.isArray(issue_ids)) {
        return sendErrorResponse(
          thisAction,
          { message: "issue_ids must be an array" },
          res,
          400,
        );
      }

      const result = await SprintService.addIssues(req, {
        sprint_id: sprintId,
        issue_ids,
      });
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Get Sprint Backlog
  static async getBacklog(req, res) {
    const thisAction = { usedFor: "Sprint", action: "Get Backlog" };
    try {
      const sprintId = req.params.sprintId;
      const result = await SprintService.getSprintBacklog(req, sprintId);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // List Sprints by Project
  static async listByProject(req, res) {
    const thisAction = { usedFor: "Sprint", action: "List Sprints" };
    try {
      const projectId = req.params.projectId;
      const status = req.query.status;

      const result = await SprintService.listSprints(req, projectId, status);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Add User Stories to Sprint
  static async addStories(req, res) {
    const thisAction = { usedFor: "Sprint", action: "Add Stories" };
    try {
      const sprintId = req.params.sprintId;
      const { story_ids } = req.body;
      if (!Array.isArray(story_ids)) {
        return sendErrorResponse(
          thisAction,
          { message: "story_ids must be an array" },
          res,
          400,
        );
      }
      const result = await SprintService.addStories(req, {
        sprint_id: sprintId,
        story_ids,
      });
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Get User Stories in Sprint
  static async getStories(req, res) {
    const thisAction = { usedFor: "Sprint", action: "Get Stories" };
    try {
      const sprintId = req.params.sprintId;
      const result = await SprintService.getSprintStories(req, sprintId);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }
}

module.exports = SprintController;
