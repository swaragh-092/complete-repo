
// Author: Gururaj 
// Created: 09 Sep 2025
// Description: all routes related to dependency tasks of the project
// Version: 1.0.0

const express = require("express");
const {  name, uuid, description, enumValue, dateFuture } = require("../../services/validation");
const validationMiddleware = require("../../middleware/validation.middleware");
const dependencyTaskController = require("../../controllers/task/dependencyTask.controller");

const router = express.Router();

// /{moduleCode}/project/dependency-task...
/**
 * @swagger
 * /{moduleCode}/project/dependency-task/{dependencyTaskId}:
 *   post:
 *     tags:
 *       - Task
 *     summary: Create a dependency task
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: dependencyTaskId
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
 *               projectMemberId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: ['low', 'medium', 'high', 'critical']
 *               due_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Dependency task created successfully
 */
router.post('/:dependencyTaskId', [
  [
    uuid("projectMemberId", "body"),
    uuid("dependencyTaskId"),
    name("title"),
    description().optional({ checkFalsy: true }),
    enumValue( "priority", ['low', 'medium', 'high', 'critical'] ).optional(),
    dateFuture("due_date" )
  ],
], validationMiddleware("Dependency Task", "Create"), dependencyTaskController.createDependencyTaskTask);


/**
 * @swagger
 * /{moduleCode}/project/dependency-task/{TaskId}:
 *   get:
 *     tags:
 *       - Task
 *     summary: Get a dependency task by ID
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: TaskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dependency task retrieved successfully
 */
router.get('/:TaskId', [
  [
    uuid("TaskId"),
  ],
], validationMiddleware("Dependency Task", "Get"), dependencyTaskController.getDependencyTask);


/**
 * @swagger
 * /{moduleCode}/project/dependency-task/{TaskId}/parent-task:
 *   get:
 *     tags:
 *       - Task
 *     summary: Get parent tasks of a dependency task
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: TaskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Parent tasks retrieved successfully
 */
router.get('/:TaskId/parent-task', [
  [
    uuid("TaskId"),
  ],
], validationMiddleware("Parent Task", "Get"), dependencyTaskController.getParentTasks);


/**
 * @swagger
 * /{moduleCode}/project/dependency-task/{dependencyTaskId}/{parentTaskId}:
 *   post:
 *     tags:
 *       - Task
 *     summary: Add a dependency to a parent task
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: dependencyTaskId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: parentTaskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dependency task added successfully
 */
router.post('/:dependencyTaskId/:parentTaskId', [
  [
    uuid("parentTaskId"),
    uuid("dependencyTaskId"),
  ],
], validationMiddleware("Dependency Task", "Add"), dependencyTaskController.addDependencyTask);


/**
 * @swagger
 * /{moduleCode}/project/dependency-task/{dependencyTaskId}/{parentTaskId}:
 *   delete:
 *     tags:
 *       - Task
 *     summary: Remove a dependency from a parent task
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: dependencyTaskId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: parentTaskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dependency task removed successfully
 */
router.delete('/:dependencyTaskId/:parentTaskId', [
  [
    uuid("parentTaskId"),
    uuid("dependencyTaskId"),
  ],
], validationMiddleware("Dependency Task", "Add"), dependencyTaskController.removeDependencyTask);


module.exports = router;

