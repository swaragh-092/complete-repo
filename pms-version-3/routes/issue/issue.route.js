// Author: Gururaj
// Created: 14th oct 2025
// Description: issue related routes
// Version: 2.0.0
// Modified: Enhanced for Jira-like features

const express = require("express");
const IssueController = require("../../controllers/issue/issue.controller");
const CommentController = require("../../controllers/issue/Comment.controller");
const WorkflowController = require("../../controllers/issue/workflow.controller");
const AttachmentController = require("../../controllers/issue/Attachment.controller");
const upload = require("../../middleware/upload.middleware");
const { body, param } = require("express-validator");
const validationMiddleware = require("../../middleware/validation.middleware");
const {
  uuid,
  name,
  enumValue,
  description,
  dateFuture,
} = require("../../services/validation");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Issue
 *   description: Issue management
 */

// List issues by project
router.get(
  "/project/:projectId",
  [param("projectId", "Project ID must be a UUID").isUUID()],
  validationMiddleware("Issue", "List Issues"),
  IssueController.listByProject,
);

// Create Issue
router.post(
  "/project/:projectId",
  [
    param("projectId", "Project ID must be a UUID").isUUID(),
    body("title", "Title is required").notEmpty(),
    body("issue_type_id", "Issue Type ID required").isUUID(),
  ],
  validationMiddleware("Issue", "Create Issue"),
  IssueController.create,
);

// Get Issue Types
router.get("/types", IssueController.getIssueTypes);

// Create Issue Type
router.post(
  "/type/create",
  [body("name", "Name is required").notEmpty().trim()],
  validationMiddleware("Issue Type", "Create"),
  IssueController.createIssueType,
);

// Get Issue Details
router.get(
  "/:id",
  [param("id", "Issue ID must be a UUID").isUUID()],
  validationMiddleware("Issue", "Get Issue"),
  IssueController.get,
);

// Update Issue (General)
router.put(
  "/:id",
  [param("id", "Issue ID must be a UUID").isUUID()],
  validationMiddleware("Issue", "Update Issue"),
  IssueController.update,
);

// Delete Issue
router.delete(
  "/:id",
  [param("id", "Issue ID must be a UUID").isUUID()],
  validationMiddleware("Issue", "Delete Issue"),
  IssueController.delete,
);

// Change Status
router.put(
  "/:id/status",
  [
    param("id", "Issue ID must be a UUID").isUUID(),
    body("status_id", "Status ID required").isUUID(),
  ],
  validationMiddleware("Issue", "Change Status"),
  IssueController.changeStatus,
);

// Assign Issue
router.put(
  "/:id/assign",
  [param("id", "Issue ID must be a UUID").isUUID()],
  validationMiddleware("Issue", "Assign Issue"),
  IssueController.assign,
);

// Link Issue to User Story (team lead only)
router.put(
  "/:id/user-story",
  [
    param("id", "Issue ID must be a UUID").isUUID(),
    body("user_story_id", "User Story ID must be a valid UUID or null")
      .optional({ nullable: true })
      .isUUID(),
  ],
  validationMiddleware("Issue", "Link User Story"),
  IssueController.linkUserStory,
);

// Update Labels
router.put(
  "/:id/labels",
  [param("id", "Issue ID must be a UUID").isUUID()],
  validationMiddleware("Issue", "Update Labels"),
  IssueController.updateLabels,
);

// Get History
router.get(
  "/:id/history",
  [param("id", "Issue ID must be a UUID").isUUID()],
  validationMiddleware("Issue", "Get History"),
  IssueController.getHistory,
);

// Link Parent (Hierarchy)
router.put(
  "/:id/parent",
  [
    param("id", "Issue ID must be a UUID").isUUID(),
    body("parent_id", "Parent ID must be a UUID or null")
      .optional({ nullable: true })
      .isUUID(),
  ],
  validationMiddleware("Issue", "Link Parent"),
  IssueController.linkParent,
);

// Get Issue Tree
router.get(
  "/:id/tree",
  [param("id", "Issue ID must be a UUID").isUUID()],
  validationMiddleware("Issue", "Get Issue Tree"),
  IssueController.getTree,
);

// --- WORKFLOW APIs ---

// 1. Get Workflow Config (Statuses & Transitions)
router.get(
  "/project/:projectId/workflow",
  [param("projectId", "Project ID required").isUUID()],
  validationMiddleware("Workflow", "Get Workflow"),
  WorkflowController.getWorkflow,
);

// 2. Create Custom Status
router.post(
  "/project/:projectId/workflow/status",
  [
    param("projectId", "Project ID required").isUUID(),
    body("name", "Status Name required").notEmpty(),
    body("category", "Category must be todo, in_progress, or done").isIn([
      "todo",
      "in_progress",
      "done",
    ]),
  ],
  validationMiddleware("Workflow", "Create Status"),
  WorkflowController.createStatus,
);

// 3. Add Valid Transition
router.post(
  "/project/:projectId/workflow/transition",
  [
    param("projectId", "Project ID required").isUUID(),
    body("from_status_id", "From Status ID required").isUUID(),
    body("to_status_id", "To Status ID required").isUUID(),
  ],
  validationMiddleware("Workflow", "Add Transition"),
  WorkflowController.addTransition,
);

// --- Issue Comments ---

// Add Comment
router.post(
  "/:id/comments",
  [
    param("id", "Issue ID must be a UUID").isUUID(),
    body("content", "Content is required").notEmpty(),
  ],
  validationMiddleware("Comment", "Add Comment"),
  CommentController.addComment,
);

// Get Comments
router.get(
  "/:id/comments",
  [param("id", "Issue ID must be a UUID").isUUID()],
  validationMiddleware("Comment", "Get Comments"),
  CommentController.getComments,
);

// Update Comment
router.put(
  "/:id/comments/:commentId",
  [
    param("id", "Issue ID must be a UUID").isUUID(),
    param("commentId", "Comment ID must be a UUID").isUUID(),
    body("content", "Content is required").notEmpty(),
  ],
  validationMiddleware("Comment", "Update Comment"),
  CommentController.updateComment,
);

// Delete Comment
router.delete(
  "/:id/comments/:commentId",
  [
    param("id", "Issue ID must be a UUID").isUUID(),
    param("commentId", "Comment ID must be a UUID").isUUID(),
  ],
  validationMiddleware("Comment", "Delete Comment"),
  CommentController.deleteComment,
);
// --- Issue Attachments ---

// List Attachments
router.get(
  "/:id/attachments",
  [param("id", "Issue ID must be a UUID").isUUID()],
  validationMiddleware("Attachment", "List Attachments"),
  AttachmentController.listAttachments,
);

// Upload Attachment
router.post(
  "/:id/attachments",
  [param("id", "Issue ID must be a UUID").isUUID(), upload.single("file")],
  validationMiddleware("Attachment", "Upload Attachment"),
  AttachmentController.addAttachment,
);

// Download Attachment
router.get(
  "/attachments/:attachmentId/download",
  [param("attachmentId", "Attachment ID must be a UUID").isUUID()],
  validationMiddleware("Attachment", "Download Attachment"),
  AttachmentController.downloadAttachment,
);

// Delete Attachment
router.delete(
  "/:id/attachments/:attachmentId",
  [
    param("id", "Issue ID must be a UUID").isUUID(),
    param("attachmentId", "Attachment ID must be a UUID").isUUID(),
  ],
  validationMiddleware("Attachment", "Delete Attachment"),
  AttachmentController.deleteAttachment,
);
module.exports = router;
