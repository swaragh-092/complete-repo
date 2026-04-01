// Author: Copilot
// Created: 18th Mar 2026
// Description: Backlog routes
// Version: 1.0.0

const express = require("express");
const router = express.Router();
const BacklogController = require("../../controllers/project/Backlog.controller");
const { body, param } = require("express-validator");
const validationMiddleware = require("../../middleware/validation.middleware");

// List Backlog Issues (Issues with no Sprint)
router.get(
  "/project/:projectId/list",
  [param("projectId", "Project ID must be a UUID").isUUID()],
  validationMiddleware("Backlog", "List Issues"),
  BacklogController.list,
);

// Prioritize (Reorder)
router.patch(
  "/prioritize",
  [
    body("issue_id", "Issue ID is required").isUUID(),
    body("board_order", "Board Order must be a number").isFloat(),
  ],
  validationMiddleware("Backlog", "Prioritize"),
  BacklogController.prioritize,
);

// Move Issue to Sprint (or Backlog)
router.post(
  "/move-to-sprint",
  [
    body("issue_id", "Issue ID is required").isUUID(),
    // sprint_id can be null or UUID.
    body("sprint_id").optional().isUUID(),
  ],
  validationMiddleware("Backlog", "Move to Sprint"),
  BacklogController.moveToSprint,
);

// ── Story Backlog endpoints ──────────────────────────────────────────────────

// List Backlog User Stories
router.get(
  "/project/:projectId/stories",
  [param("projectId", "Project ID must be a UUID").isUUID()],
  validationMiddleware("Backlog", "List Stories"),
  BacklogController.listStories,
);

// Reorder Story in Backlog
router.patch(
  "/story/prioritize",
  [
    body("story_id", "story_id must be a UUID").isUUID(),
    body("backlog_order", "backlog_order must be a number").isFloat(),
  ],
  validationMiddleware("Backlog", "Prioritize Story"),
  BacklogController.prioritizeStory,
);

// Move Story to Sprint (or back to Backlog)
router.post(
  "/story/move-to-sprint",
  [
    body("story_id", "story_id must be a UUID").isUUID(),
    body("sprint_id").optional({ nullable: true }).isUUID(),
  ],
  validationMiddleware("Backlog", "Move Story to Sprint"),
  BacklogController.moveStoryToSprint,
);

module.exports = router;
