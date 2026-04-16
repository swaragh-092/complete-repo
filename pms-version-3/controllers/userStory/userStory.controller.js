// Author: Gururaj
// Created: 14th June 2025
// Description: User story controller - handles HTTP requests for user stories.
// Version: 2.0.0
// Modified:

const UserStoryService = require("../../services/userStory/userStory.service");
const ResponseService = require("../../services/Response");
const { fieldPicker, sendErrorResponse } = require("../../util/helper");

// Create a user story
exports.createUserStory = async (req, res) => {
  const thisAction = { usedFor: "User Story", action: "create" };
  try {
    const allowedFields = [
      "title",
      "description",
      "acceptance_criteria",
      "priority",
      "story_points",
      "due_date",
      "assigned_to",
      "status",
      "type", // Added for Jira
      { field: "featureId", as: "feature_id", source: "params" },
      {
        field: "parentUserStoryId",
        as: "parent_user_story_id",
        source: "body",
      },
      { field: "departmentId", as: "department_id", source: "body" },
      { field: "projectId", as: "project_id", source: "body" },
    ];
    const data = fieldPicker(req, allowedFields);
    const result = await UserStoryService.createUserStory(req, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// Get a single user story with sub-stories, tasks, issues
exports.getUserStory = async (req, res) => {
  const thisAction = { usedFor: "User Story", action: "getOne" };
  try {
    const result = await UserStoryService.getUserStory(
      req,
      req.params.userStoryId,
    );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// Update a user story
exports.updateUserStory = async (req, res) => {
  const thisAction = { usedFor: "User Story", action: "update" };
  try {
    const allowedFields = [
      "title",
      "description",
      "acceptance_criteria",
      "priority",
      "status",
      "story_points",
      "due_date",
      "sort_order",
      "assigned_to",
      "assignee",
      "approval_status", // Added for Jira workflow
      "total_work_time",
      "live_status",
      "taken_at",
      "completed_at",
      "approved_by",
    ];
    const data = fieldPicker(req, allowedFields);
    const result = await UserStoryService.updateUserStory(
      req,
      req.params.userStoryId,
      data,
    );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// Delete a user story
exports.deleteUserStory = async (req, res) => {
  const thisAction = { usedFor: "User Story", action: "delete" };
  try {
    const result = await UserStoryService.deleteUserStory(
      req,
      req.params.userStoryId,
    );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// Get all user stories for a feature
exports.getUserStoriesByFeature = async (req, res) => {
  const thisAction = { usedFor: "User Story", action: "get all" };
  try {
    const result = await UserStoryService.getUserStoriesByFeature(req, {
      feature_id: req.params.featureId,
      query: req.query,
    });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// Get all user stories for a project
exports.getUserStoriesByProject = async (req, res) => {
  const thisAction = { usedFor: "User Story", action: "get all" };
  try {
    const result = await UserStoryService.getUserStoriesByProject(req, {
      project_id: req.params.projectId,
      query: req.query,
    });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// Get user stories by project + department
exports.getUserStoriesByProjectDepartment = async (req, res) => {
  const thisAction = { usedFor: "User Story", action: "get all" };
  try {
    const result = await UserStoryService.getUserStoriesByProjectDepartment(
      req,
      {
        project_id: req.params.projectId,
        department_id: req.params.departmentId,
        query: req.query,
      },
    );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// Approve/Reject a user story
exports.approveUserStory = async (req, res) => {
  const thisAction = { usedFor: "User Story", action: "approve" };
  try {
    const { status, comments } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'approved' or 'rejected'.",
      });
    }
    const result = await UserStoryService.approveUserStory(
      req,
      req.params.userStoryId,
      { status, comments },
    );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// Get completion stats for a project/feature
exports.getCompletionStats = async (req, res) => {
  const thisAction = { usedFor: "User Story", action: "stats" };
  try {
    const result = await UserStoryService.getCompletionStats(req, {
      project_id: req.params.projectId,
      feature_id: req.query.feature_id || null,
    });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// Reorder user stories
exports.reorderUserStories = async (req, res) => {
  const thisAction = { usedFor: "User Story", action: "reorder" };
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates) || updates.length === 0) {
      return ResponseService.apiResponse({
        res,
        success: false,
        status: 400,
        message: "updates array is required",
        ...thisAction,
      });
    }
    const result = await UserStoryService.reorderUserStories(req, updates);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// Start timer on a user story
exports.startTimer = async (req, res) => {
  const thisAction = { usedFor: "User Story", action: "Start Timer" };
  try {
    const result = await UserStoryService.startTimer(
      req,
      req.params.userStoryId,
    );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// Stop timer on a user story
exports.stopTimer = async (req, res) => {
  const thisAction = { usedFor: "User Story", action: "Stop Timer" };
  try {
    const result = await UserStoryService.stopTimer(
      req,
      req.params.userStoryId,
    );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// Get current running timer for the user
exports.getCurrentTimer = async (req, res) => {
  const thisAction = { usedFor: "User Story", action: "Get Current Timer" };
  try {
    const result = await UserStoryService.getCurrentTimer(req);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// ─── Helper Stories ────────────────────────────────────────────────────────

exports.createHelperStory = async (req, res) => {
  const thisAction = { usedFor: "User Story", action: "Create Helper Story" };
  try {
    const result = await UserStoryService.createHelperStory(
      req,
      req.params.userStoryId,
      req.body,
    );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.acceptOrRejectHelperStory = async (req, res) => {
  const thisAction = {
    usedFor: "User Story",
    action: "Accept/Reject Helper Story",
  };
  try {
    const result = await UserStoryService.acceptOrRejectHelperStory(
      req,
      req.params.helperStoryId,
      req.params.action,
    );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.getHelpRequests = async (req, res) => {
  const thisAction = { usedFor: "User Story", action: "Get Help Requests" };
  try {
    const result = await UserStoryService.getHelpRequests(req);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.getHelperStoriesForStory = async (req, res) => {
  const thisAction = { usedFor: "User Story", action: "Get Helper Stories" };
  try {
    const result = await UserStoryService.getHelperStoriesForStory(
      req,
      req.params.userStoryId,
    );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.removeHelperStory = async (req, res) => {
  const thisAction = { usedFor: "User Story", action: "Remove Helper Story" };
  try {
    const result = await UserStoryService.removeHelperStory(
      req,
      req.params.helperStoryId,
    );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// ─── Story Dependencies ────────────────────────────────────────────────────

exports.addDependency = async (req, res) => {
  const thisAction = { usedFor: "User Story", action: "Add Dependency" };
  try {
    const result = await UserStoryService.addDependency(
      req,
      req.params.userStoryId,
      req.params.dependencyStoryId,
    );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.removeDependency = async (req, res) => {
  const thisAction = { usedFor: "User Story", action: "Remove Dependency" };
  try {
    const result = await UserStoryService.removeDependency(
      req,
      req.params.userStoryId,
      req.params.dependencyStoryId,
    );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.getDependencies = async (req, res) => {
  const thisAction = { usedFor: "User Story", action: "Get Dependencies" };
  try {
    const result = await UserStoryService.getDependencies(
      req,
      req.params.userStoryId,
    );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.getParentStories = async (req, res) => {
  const thisAction = { usedFor: "User Story", action: "Get Parent Stories" };
  try {
    const result = await UserStoryService.getParentStories(
      req,
      req.params.userStoryId,
    );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// ─── Advance Status ────────────────────────────────────────────────────────

exports.advanceStatus = async (req, res) => {
  const thisAction = { usedFor: "User Story", action: "Advance Status" };
  try {
    const result = await UserStoryService.advanceStatus(
      req,
      req.params.userStoryId,
    );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// ─── Revert Status ────────────────────────────────────────────────────────

exports.revertStatus = async (req, res) => {
  const thisAction = { usedFor: "User Story", action: "Revert Status" };
  try {
    const result = await UserStoryService.revertStatus(
      req,
      req.params.userStoryId,
    );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// ─── Change Requests ───────────────────────────────────────────────────────

exports.requestChange = async (req, res) => {
  const thisAction = { usedFor: "User Story", action: "Request Change" };
  try {
    const { request_type, requested_value, reason } = req.body;
    const result = await UserStoryService.requestChange(
      req,
      req.params.userStoryId,
      {
        request_type,
        requested_value,
        reason,
      },
    );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.reviewChangeRequest = async (req, res) => {
  const thisAction = { usedFor: "User Story", action: "Review Change Request" };
  try {
    const { action, comments } = req.body;
    const result = await UserStoryService.reviewChangeRequest(
      req,
      req.params.requestId,
      {
        action,
        comments,
      },
    );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.getChangeRequests = async (req, res) => {
  const thisAction = { usedFor: "User Story", action: "Get Change Requests" };
  try {
    const result = await UserStoryService.getChangeRequests(
      req,
      req.params.userStoryId,
    );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.getPendingChangeRequests = async (req, res) => {
  const thisAction = {
    usedFor: "User Story",
    action: "Get Pending Change Requests",
  };
  try {
    const result = await UserStoryService.getPendingChangeRequests(req);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};
