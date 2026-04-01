// Author: Copilot
// Created: 18th Mar 2026
// Description: board related routes
// Version: 1.0.0

const express = require("express");
const router = express.Router();
const BoardController = require("../../controllers/project/Board.controller");
const { body, param } = require("express-validator");
const validationMiddleware = require("../../middleware/validation.middleware");

// Get Board by Project ID
router.get(
  "/:projectId",
  [param("projectId", "Project ID must be a UUID").isUUID()],
  validationMiddleware("Board", "Get Board"),
  BoardController.getBoard,
);

// Move Issue (legacy — bug tracker)
router.post(
  "/move-issue",
  [
    body("issue_id", "Issue ID is required").isUUID(),
    body().custom((value, { req }) => {
      if (!req.body.to_column_id && !req.body.to_status_id) {
        throw new Error("Either to_column_id or to_status_id is required");
      }
      return true;
    }),
  ],
  validationMiddleware("Board", "Move Issue"),
  BoardController.moveIssue,
);

// Move User Story (drag between columns)
router.post(
  "/move-story",
  [
    body("story_id", "story_id must be a UUID").isUUID(),
    body().custom((value, { req }) => {
      if (!req.body.to_column_id && !req.body.to_status_id) {
        throw new Error("Either to_column_id or to_status_id is required");
      }
      return true;
    }),
  ],
  validationMiddleware("Board", "Move Story"),
  BoardController.moveStory,
);

module.exports = router;
