// Author: Copilot
// Created: 18th Mar 2026
// Description: Sprint routes
// Version: 1.0.0

const express = require("express");
const router = express.Router();
const SprintController = require("../../controllers/project/Sprint.controller");
const { body, param } = require("express-validator");
const validationMiddleware = require("../../middleware/validation.middleware");

const ENTITY = "Sprint";
const ACTIONS = {
  CREATE: "Create",
  READ: "Read",
  UPDATE: "Update",
  DELETE: "Delete",
};

// Create Sprint
router.post(
  "/project/:projectId/create",
  [
    param("projectId", "Project ID must be a UUID").isUUID(),
    body("name", "Name is required").notEmpty(),
  ],
  // start_date, end_date optional
  validationMiddleware(ENTITY, ACTIONS.CREATE),
  SprintController.create,
);

// List Sprints
router.get(
  "/project/:projectId/list",
  [param("projectId", "Project ID must be a UUID").isUUID()],
  validationMiddleware(ENTITY, ACTIONS.READ),
  SprintController.listByProject,
);

// Start Sprint
router.post(
  "/:sprintId/start",
  [param("sprintId", "Sprint ID must be a UUID").isUUID()],
  validationMiddleware(ENTITY, ACTIONS.UPDATE),
  SprintController.start,
);

// End Sprint
router.post(
  "/:sprintId/end",
  [param("sprintId", "Sprint ID must be a UUID").isUUID()],
  validationMiddleware(ENTITY, ACTIONS.UPDATE),
  SprintController.end,
);

// Add Issues to Sprint
router.post(
  "/:sprintId/issues",
  [
    param("sprintId", "Sprint ID must be a UUID").isUUID(),
    body("issue_ids", "issue_ids must be an array").isArray(),
  ],
  validationMiddleware(ENTITY, ACTIONS.UPDATE),
  SprintController.addIssues,
);

// Get Sprint Backlog (Issues in Sprint)
router.get(
  "/:sprintId/backlog",
  [param("sprintId", "Sprint ID must be a UUID").isUUID()],
  validationMiddleware(ENTITY, ACTIONS.READ),
  SprintController.getBacklog,
);

// Add User Stories to Sprint
router.post(
  "/:sprintId/stories",
  [
    param("sprintId", "Sprint ID must be a UUID").isUUID(),
    body("story_ids", "story_ids must be an array").isArray(),
  ],
  validationMiddleware(ENTITY, ACTIONS.UPDATE),
  SprintController.addStories,
);

// Get User Stories in Sprint
router.get(
  "/:sprintId/stories",
  [param("sprintId", "Sprint ID must be a UUID").isUUID()],
  validationMiddleware(ENTITY, ACTIONS.READ),
  SprintController.getStories,
);

module.exports = router;
