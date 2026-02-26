// Author: Gururaj 
// Created: 09 Sep 2025
// Description: all routes related to workflow (stand up and wrapup) of the project
// Version: 1.0.0

const express = require("express");
const { uuid } = require("../../services/validation");
const validationMiddleware = require("../../middleware/validation.middleware");
const taskWorkflowController = require("../../controllers/task/taskWorkflow.controller");

const router = express.Router();

/**
 * @swagger
 * /{moduleCode}/work/{taskId}/start:
 *   post:
 *     tags:
 *       - Task
 *     summary: Start a task workflow
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN   # <-- default value
 *         description: Module code from config
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the task to start
 *     responses:
 *       200:
 *         description: Task started successfully
 *       400:
 *         description: Validation error
 */
router.post('/:taskId/start', [
  [
    uuid("taskId"),
  ],
], validationMiddleware("Task", "Start"), taskWorkflowController.startTask);


/**
 * @swagger
 * /{moduleCode}/work/end:
 *   delete:
 *     tags:
 *       - Task
 *     summary: End all tasks
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN   # <-- default value
 *         description: Module code from config
 *     responses:
 *       200:
 *         description: Tasks ended successfully
 */
router.delete('/end', taskWorkflowController.endTasks);


/**
 * @swagger
 * /{moduleCode}/work/current:
 *   get:
 *     tags:
 *       - Task
 *     summary: Get the current working task
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN   # <-- default value
 *         description: Module code from config
 *     responses:
 *       200:
 *         description: Returns the current working task
 *       404:
 *         description: No current task found
 */
router.get('/current', taskWorkflowController.getCurrentWrokingTask);

module.exports = router;