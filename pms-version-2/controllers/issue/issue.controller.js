// Author: Gururaj
// Created: 14th oct 2025
// Description: all issue related functionality controller.
// Version: 2.0.0
// Modified: Enhanced for Jira-like features

const IssueService = require("../../services/issue/issue.service");
const ResponseService = require("../../services/Response");
const { fieldPicker, sendErrorResponse } = require("../../util/helper");

class IssueController {
  // Create new issue
  static async create(req, res) {
    const thisAction = { usedFor: "Issue", action: "create" };
    try {
      const allowedFields = [
        "project_id",
        "from_department_id",
        "to_department_id",
        "issue_type_id",
        "user_story_id",
        "title",
        "description",
        "priority",
        "status_id",
        "labels",
        "parent_id",
      ];
      // Also allow project_id from params if needed, but usually body is cleaner for complex creation
      const data = fieldPicker(req, allowedFields);
      if (req.params.projectId) data.project_id = req.params.projectId;

      const result = await IssueService.createIssue(req, data);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Update issue details
  static async update(req, res) {
    const thisAction = { usedFor: "Issue", action: "update" };
    try {
      const allowedFields = [
        "title",
        "description",
        "priority",
        "issue_type_id",
        "to_department_id",
      ];
      const data = fieldPicker(req, allowedFields);
      const result = await IssueService.updateIssue(req, req.params.id, data);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Change Status
  static async changeStatus(req, res) {
    const thisAction = { usedFor: "Issue", action: "Change Status" };
    try {
      const { status_id } = req.body;
      if (!status_id) throw new Error("status_id is required");
      const result = await IssueService.changeStatus(
        req,
        req.params.id,
        status_id,
      );
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Assign Issue
  static async assign(req, res) {
    const thisAction = { usedFor: "Issue", action: "Assign" };
    try {
      const { assignee_id } = req.body; // Can be null to unassign
      const result = await IssueService.assignIssue(
        req,
        req.params.id,
        assignee_id,
      );
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Update Labels
  static async updateLabels(req, res) {
    const thisAction = { usedFor: "Issue", action: "Update Labels" };
    try {
      const { labels } = req.body; // Array of label IDs
      if (!Array.isArray(labels)) throw new Error("labels must be an array");
      const result = await IssueService.updateLabels(
        req,
        req.params.id,
        labels,
      );
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Delete Issue
  static async delete(req, res) {
    const thisAction = { usedFor: "Issue", action: "Delete" };
    try {
      const result = await IssueService.deleteIssue(req, req.params.id);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // List Issues by Project
  static async listByProject(req, res) {
    const thisAction = { usedFor: "Issues", action: "List" };
    try {
      // Need projectId
      if (!req.params.projectId) throw new Error("Project ID required");
      const result = await IssueService.listIssues(
        req,
        req.params.projectId,
        req.query,
      );
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Get Single Issue
  static async get(req, res) {
    const thisAction = { usedFor: "Issue", action: "Get details" };
    try {
      const result = await IssueService.getIssue(req, req.params.id);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Get History
  static async getHistory(req, res) {
    const thisAction = { usedFor: "Issue", action: "Get history" };
    try {
      const result = await IssueService.getIssueHistory(req, req.params.id);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Link Parent / Hierarchy
  static async linkParent(req, res) {
    const thisAction = { usedFor: "Issue", action: "Link Parent" };
    try {
      // parent_id can be null to unlink
      const { parent_id } = req.body;
      const result = await IssueService.linkParent(
        req,
        req.params.id,
        parent_id,
      );
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Get Issue Tree (Hierarchy)
  static async getTree(req, res) {
    const thisAction = { usedFor: "Issue", action: "Get Tree" };
    try {
      const result = await IssueService.getIssueTree(req, req.params.id);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Get Issue Types
  static async getIssueTypes(req, res) {
    const thisAction = { usedFor: "Issue Type", action: "Get All" };
    try {
      const result = await IssueService.getIssueTypes(req);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Create Issue Type
  static async createIssueType(req, res) {
    const thisAction = { usedFor: "Issue Type", action: "Create" };
    try {
      const result = await IssueService.createIssueType(req, req.body);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }
  // Link Issue to User Story (team lead only)
  static async linkUserStory(req, res) {
    const thisAction = { usedFor: "Issue", action: "Link User Story" };
    try {
      const { user_story_id } = req.body; // Can be null to unlink
      const result = await IssueService.linkUserStory(
        req,
        req.params.id,
        user_story_id ?? null,
      );
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }
}

module.exports = IssueController;
