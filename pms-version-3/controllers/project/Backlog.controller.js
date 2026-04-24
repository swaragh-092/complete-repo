// Author: Copilot
// Created: 18th Mar 2026
// Description: Backlog/Sprint Controller
// Version: 1.0.0

const {
  BacklogService,
  StoryBacklogService,
  ComponentBacklogService,
} = require("../../services/project/Backlog.service");
const ResponseService = require("../../services/Response");
const { sendErrorResponse } = require("../../util/helper");
const { validationResult } = require("express-validator");

class BacklogController {
  // List Backlog Issues
  static async list(req, res) {
    const thisAction = { usedFor: "Backlog", action: "List Issues" };
    try {
      const projectId = req.params.projectId;
      // Optionally pass sprint_id=null explicit call or implicit
      const result = await BacklogService.getBacklog(req, projectId);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Prioritize (Reorder)
  static async prioritize(req, res) {
    const thisAction = { usedFor: "Backlog", action: "Prioritize" };
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendErrorResponse(
          thisAction,
          { message: errors.array()[0].msg },
          res,
        );
      }

      const { issue_id, board_order } = req.body; // New order value (float)

      // Typically we would update the `board_order` value
      // The frontend provides the new sorting value
      const result = await BacklogService.prioritizeIssue(
        req,
        issue_id,
        board_order,
      );
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Move Issue to Sprint
  static async moveToSprint(req, res) {
    const thisAction = { usedFor: "Backlog", action: "Move to Sprint" };
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendErrorResponse(
          thisAction,
          { message: errors.array()[0].msg },
          res,
        );
      }

      const { issue_id, sprint_id } = req.body; // sprint_id can be null (backlog) or UUID

      const result = await BacklogService.moveIssueToSprint(
        req,
        issue_id,
        sprint_id,
      );
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // ── Story Backlog ────────────────────────────────────────────────────────────

  static async listStories(req, res) {
    const thisAction = { usedFor: "Backlog", action: "List Stories" };
    try {
      const projectId = req.params.projectId;
      const result = await StoryBacklogService.getStoryBacklog(req, projectId);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  static async prioritizeStory(req, res) {
    const thisAction = { usedFor: "Backlog", action: "Prioritize Story" };
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return sendErrorResponse(
          thisAction,
          { message: errors.array()[0].msg },
          res,
        );

      const { story_id, backlog_order } = req.body;
      const result = await StoryBacklogService.prioritizeStory(
        req,
        story_id,
        backlog_order,
      );
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  static async moveStoryToSprint(req, res) {
    const thisAction = { usedFor: "Backlog", action: "Move Story to Sprint" };
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return sendErrorResponse(
          thisAction,
          { message: errors.array()[0].msg },
          res,
        );

      const { story_id, sprint_id } = req.body;
      const result = await StoryBacklogService.moveStoryToSprint(
        req,
        story_id,
        sprint_id ?? null,
      );
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // ── Component Backlog (Site-type projects) ───────────────────────────────────

  static async listComponents(req, res) {
    const thisAction = { usedFor: "Backlog", action: "List Components" };
    try {
      const projectId = req.params.projectId;
      const result = await ComponentBacklogService.getComponentBacklog(req, projectId);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  static async prioritizeComponent(req, res) {
    const thisAction = { usedFor: "Backlog", action: "Prioritize Component" };
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return sendErrorResponse(thisAction, { message: errors.array()[0].msg }, res);

      const { component_id, board_order } = req.body;
      const result = await ComponentBacklogService.prioritizeComponent(req, component_id, board_order);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  static async moveComponentToSprint(req, res) {
    const thisAction = { usedFor: "Backlog", action: "Move Component to Sprint" };
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return sendErrorResponse(thisAction, { message: errors.array()[0].msg }, res);

      const { component_id, sprint_id } = req.body;
      const result = await ComponentBacklogService.moveComponentToSprint(
        req,
        component_id,
        sprint_id ?? null,
      );
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }
}

module.exports = BacklogController;
