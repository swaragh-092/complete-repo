
// Author: Gururaj 
// Created: 09 Sep 2025
// Description: all routes related to helper tasks of the project
// Version: 1.0.0

const express = require("express");
const {  name, uuid, description, enumValue, dateFuture, paramsEnum } = require("../../services/validation");
const validationMiddleware = require("../../middleware/validation.middleware");
const helperTaskController = require("../../controllers/task/helperTask.controller");

const router = express.Router();

// /{moduleCode}/project/helper-task/...

/**
 * @swagger
 * /{moduleCode}/project/helper-task/{parentTaskId}:
 *   post:
 *     tags:
 *       - Task
 *     summary: Create a helper task
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: parentTaskId
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
 *         description: Helper task created successfully
 */
router.post('/:parentTaskId', [
  [
    uuid("projectMemberId", "body"),
    uuid("parentTaskId"),
    name("title"),
    description().optional({ checkFalsy: true }),
    enumValue("priority", ['low', 'medium', 'high', 'critical']).optional(),
    dateFuture("due_date")
  ],
], validationMiddleware("Helper Task", "Create"), helperTaskController.createHelperTask);


/**
 * @swagger
 * /{moduleCode}/project/helper-task/accept/{taskId}/{status}:
 *   post:
 *     tags:
 *       - Task
 *     summary: Accept or reject a helper task
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
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: ['accept', 'reject']
 *     responses:
 *       200:
 *         description: Helper task accepted or rejected successfully
 */
router.post('/accept/:taskId/:status', [
  [
    uuid("taskId"),
    paramsEnum("status", "params", ['accept', "reject"])
  ],
], validationMiddleware("Helper", "Accept or Reject"), helperTaskController.helperAcceptOrReject);


/**
 * @swagger
 * /{moduleCode}/project/helper-task/accept:
 *   get:
 *     tags:
 *       - Task
 *     summary: Get all tasks that can be accepted
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *     responses:
 *       200:
 *         description: List of acceptable helper tasks
 */
router.get('/accept', helperTaskController.getAcceptableTask);


/**
 * @swagger
 * /{moduleCode}/project/helper-task/{helperTaskId}/{parentTaskId}:
 *   put:
 *     tags:
 *       - Task
 *     summary: Add a helper task to a parent task
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: helperTaskId
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
 *         description: Helper task added successfully
 */
router.put('/:helperTaskId/:parentTaskId', [
  [
    uuid("parentTaskId"),
    uuid("helperTaskId"),
  ],
], validationMiddleware("Helper Task", "Add"), helperTaskController.addHelperTask);


/**
 * @swagger
 * /{moduleCode}/project/helper-task/{helperTaskId}/{parentTaskId}:
 *   delete:
 *     tags:
 *       - Task
 *     summary: Remove a helper task from a parent task
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: helperTaskId
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
 *         description: Helper task removed successfully
 */
router.delete('/:helperTaskId/:parentTaskId', [
  [
    uuid("parentTaskId"),
    uuid("helperTaskId"),
  ],
], validationMiddleware("Helper Task", "Add"), helperTaskController.removeHelperTask);


module.exports = router;

