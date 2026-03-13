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

/**
 * @swagger
 * /{moduleCode}/dailylog/task/create:
 *   post:
 *     tags:
 *       - Log
 *     summary: Create standup log for a task
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *         description: Module code from config
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               task_id:
 *                 type: string
 *               notes:
 *                 type: string
 *               expected_duration:
 *                 type: string
 *     responses:
 *       200:
 *         description: Checklist created successfully
 */
router.post(
  "/task/create",
  [
    uuid("task_id", "body"),
    description("notes").optional(),
    duration("expected_duration")    
  ],
  validationMiddleware("Stand Up", "Create"), controller.createStandup
);


/**
 * @swagger
 * /{moduleCode}/dailylog:
 *   get:
 *     tags:
 *       - Log
 *     summary: Get user daily logs
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *         description: Module code from config
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Optional date filter
 *     responses:
 *       200:
 *         description: Returns user daily logs
 */
router.get(
  "/",
  [
    pastOrCurrentDate("date").optional(),
  ],
  validationMiddleware("Daily log", "Get"), controller.getUserDailyLogs
);


/**
 * @swagger
 * /{moduleCode}/dailylog/non-standup-tasks:
 *   get:
 *     tags:
 *       - Log
 *     summary: Get non-standup tasks
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *         description: Module code from config
 *     responses:
 *       200:
 *         description: Returns non-standup tasks
 */
router.get(
  "/non-stnadup-tasks", controller.getNonStandupTasks
);


/**
 * @swagger
 * /{moduleCode}/dailylog/{taskId}:
 *   get:
 *     tags:
 *       - Log
 *     summary: Get Task Log
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *         description: Module code from config
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns task log
 */
router.get(
  "/:taskId",
  [
    uuid("taskId"),
  ],
  validationMiddleware("Task log", "Get"), controller.getTaskLog
);


/**
 * @swagger
 * /{moduleCode}/dailylog/{projectId}/project:
 *   get:
 *     tags:
 *       - Log
 *     summary: Get Project Task Log
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *         description: Module code from config
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns project task log
 */
router.get(
  "/:projectId/project",
  [
    uuid("projectId"),
  ],
  validationMiddleware("Project Task log", "Get"), controller.getProjectLog
);


/**
 * @swagger
 * /{moduleCode}/dailylog/{logId}:
 *   put:
 *     tags:
 *       - Log
 *     summary: Update Log Notes
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *         description: Module code from config
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Log note updated successfully
 */
router.put(
  "/:logId",
  [
    uuid("logId"),
    description("notes"),
  ],
  validationMiddleware("log", "Update"), controller.updateLogNote
);

module.exports = router;
