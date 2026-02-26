
// Author: Gururaj 
// Created: 09 Sep 2025
// Description: all routes related to tasks of the project
// Version: 1.0.0

const express = require("express");
const {  name, uuid, description, enumValue, dateFuture, paramsEnum } = require("../../services/validation");
const validationMiddleware = require("../../middleware/validation.middleware");
const taskController = require("../../controllers/task/task.controller");

const router = express.Router();

// /{moduleCode}/project/task/...


/**
 * @swagger
 * /{moduleCode}/project/task/my-task/on_going_or_pending:
 *   get:
 *     tags:
 *       - Task
 *     summary: Get only user tasks that are ongoing or pending
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
 *         description: Ongoing or pending tasks for the user
 */
router.get('/my-task/on_going_or_pending', taskController.getOnlyUserTasksForStandup);


/**
 * @swagger
 * /{moduleCode}/project/task/my-task/{status}:
 *   get:
 *     tags:
 *       - Task
 *     summary: Get all user tasks filtered by status
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: ['in_progress', 'completed', 'approved', 'blocked', 'approve_pending', 'issue', 'checklist', 'help']
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 */
router.get('/my-task/:status', 
  [
    paramsEnum( "status", "params",  ['in_progress', 'completed', 'approved', 'blocked', "approve_pending", 'issue', 'checklist', 'help'] ),
  ], validationMiddleware("Task", "Get"), taskController.getOnlyUserTasks);


/**
 * @swagger
 * /{moduleCode}/project/task/{taskId}/assisted:
 *   get:
 *     tags:
 *       - Task
 *     summary: Get tasks assisted by members
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Assisted tasks retrieved successfully
 */
router.get('/:taskId/assisted',
  [
    uuid("taskId"),
  ], validationMiddleware("Task", "assign member"), taskController.getAssistedTasks);


/**
 * @swagger
 * /{moduleCode}/project/task/{projectMemberId}:
 *   post:
 *     tags:
 *       - Task
 *     summary: Create a new task
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: projectMemberId
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
 *         description: Task created successfully
 */
router.post('/:projectMemberId', [
  [
    uuid("projectMemberId"),
    name("title"),
    description().optional({ checkFalsy: true }),
    enumValue( "priority", ['low', 'medium', 'high', 'critical'] ).optional(),
    dateFuture("due_date" )
  ],
], validationMiddleware("Task", "Create"), taskController.createTask);


/**
 * @swagger
 * /{moduleCode}/project/task/{projectId}/my-task:
 *   get:
 *     tags:
 *       - Task
 *     summary: Get all tasks for a project
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User tasks for the project
 */
router.get('/:projectId/my-task', [
  uuid("projectId"),
], validationMiddleware("Task", "Get"), taskController.getOnlyUserTasks);


/**
 * @swagger
 * /{moduleCode}/project/task/{projectId}/{departmentId}/my-task:
 *   get:
 *     tags:
 *       - Task
 *     summary: Get user tasks by project and department
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User tasks by department
 */
router.get('/:projectId/:departmentId/my-task', [
  [
    uuid("projectId"),
    uuid("departmentId"),
  ],
], validationMiddleware("Task", "Get"), taskController.getOnlyUserTasksByDepartment);


/**
 * @swagger
 * /{moduleCode}/project/task/{taskId}:
 *   delete:
 *     tags:
 *       - Task
 *     summary: Delete a task by ID
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task deleted successfully
 */
router.delete('/:taskId', [
  [
    uuid("taskId"),
  ],
], validationMiddleware("Task", "Delete"), taskController.deleteTask);


/**
 * @swagger
 * /{moduleCode}/project/task/{projectId}:
 *   get:
 *     tags:
 *       - Task
 *     summary: Get all tasks for a project
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 */
router.get('/:projectId', [
  [
    uuid("projectId"),
  ],
], validationMiddleware("Task", "Get"), taskController.getTasks);


/**
 * @swagger
 * /{moduleCode}/project/task/{projectId}/{departmentId}:
 *   get:
 *     tags:
 *       - Task
 *     summary: Get tasks for a project and department
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 */
router.get('/:projectId/:departmentId', [
  [
    uuid("projectId"),
    uuid("departmentId"),
  ],
], validationMiddleware("Task", "Get"), taskController.getTasksByDepartment);


/**
 * @swagger
 * /{moduleCode}/project/task/{taskId}/{projectMemberId}:
 *   post:
 *     tags:
 *       - Task
 *     summary: Assign checklist task to a project member
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: projectMemberId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: due_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Task assigned successfully
 */
router.post('/:taskId/:projectMemberId', [
  [
    uuid("taskId"),
    uuid("projectMemberId"),
    dateFuture("due_date"),
  ],
], validationMiddleware("Task", "assign member"), taskController.assignChecklistTask);


/**
 * @swagger
 * /{moduleCode}/project/task/{taskId}:
 *   put:
 *     tags:
 *       - Task
 *     summary: Update task details
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: description
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: ['low', 'medium', 'high', 'critical']
 *     responses:
 *       200:
 *         description: Task updated successfully
 */
router.put('/:taskId', [
  [
    uuid("taskId"),
    description().optional(),
    enumValue( "priority", ['low', 'medium', 'high', 'critical']).optional(),
  ],
], validationMiddleware("Task", "assign member"), taskController.updateTask);


/**
 * @swagger
 * /{moduleCode}/project/task/{taskId}/complete:
 *   put:
 *     tags:
 *       - Task
 *     summary: Mark a task as complete
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task completed successfully
 */
router.put('/:taskId/complete',
  [
    uuid("taskId"),
  ], validationMiddleware("Task", "assign member"), taskController.completeTask);



module.exports = router;

