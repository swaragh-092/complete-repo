// Author: Gururaj
// Created: 29th Sept 2025
// Description: routs on dialy logs ( standup and wrapup )
// Version: 1.0.0
// Modified:

const express = require("express");

const controller = require("../../controllers/dailylog/dailylog.controller");
const validationMiddleware = require("../../middleware/validation.middleware");
const { uuid, description, duration, pastOrCurrentDate } = require("../../services/validation");

const router = express.Router();

// Create Checklist for a Feature
router.post(
  "/task/create",
  [
    uuid("task_id", "body"),
    description("notes").optional(),
    duration("expected_duration")    
  ],
  validationMiddleware("Stand Up", "Create"), controller.createStandup
);


router.get(
  "/",
  [
    pastOrCurrentDate("date").optional(),
  ],
  validationMiddleware("Daily log", "Get"), controller.getUserDailyLogs
);
router.get(
  "/non-stnadup-tasks", controller.getNonStandupTasks
);
router.get(
  "/:taskId",
  [
    uuid("taskId"),
  ],
  validationMiddleware("Task log", "Get"), controller.getTaskLog
);
router.get(
  "/:projectId/project",
  [
    uuid("projectId"),
  ],
  validationMiddleware("Project Task log", "Get"), controller.getProjectLog
);

router.put(
  "/:logId",
  [
    uuid("logId"),
    description("notes"),
  ],
  validationMiddleware("log", "Update"), controller.updateLogNote
);


module.exports = router;
