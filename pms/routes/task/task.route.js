
// Author: Gururaj 
// Created: 09 Sep 2025
// Description: all routes related to tasks of the project
// Version: 1.0.0

const express = require("express");
const {  name, uuid, description, enumValue, dateFuture, paramsEnum } = require("../../services/validation");
const validationMiddleware = require("../../middleware/validation.middleware");
const taskController = require("../../controllers/task/task.controller");

const router = express.Router();

router.get('/my-task/on_going_or_pending', taskController.getOnlyUserTasksForStandup);


// get all my task
router.get('/my-task/:status', 
  [
    paramsEnum( "status", "params",  ['in_progress', 'completed', 'approved', 'blocked', "approve_pending", 'issue', 'checklist', 'help'] ),
  ], validationMiddleware("Task", "Get"), taskController.getOnlyUserTasks);


router.get('/:taskId/assisted',
  [
    uuid("taskId"),
  ], validationMiddleware("Task", "assign member"), taskController.getAssistedTasks);


router.post('/:projectMemberId', [
  [
    uuid("projectMemberId"),
    name("title"),
    description().optional({ checkFalsy: true }),
    enumValue( "priority", ['low', 'medium', 'high', 'critical'] ).optional(),
    dateFuture("due_date" )
  ],
], validationMiddleware("Task", "Create"), taskController.createTask);

router.get('/:projectId/my-task', [
  uuid("projectId"),
], validationMiddleware("Task", "Get"), taskController.getOnlyUserTasks);


router.get('/:projectId/:departmentId/my-task', [
  [
    uuid("projectId"),
    uuid("departmentId"),
  ],
], validationMiddleware("Task", "Get"), taskController.getOnlyUserTasksByDepartment);


router.delete('/:taskId', [
  [
    uuid("taskId"),
  ],
], validationMiddleware("Task", "Delete"), taskController.deleteTask);

router.get('/:projectId', [
  [
    uuid("projectId"),
  ],
], validationMiddleware("Task", "Get"), taskController.getTasks);

router.get('/:projectId/:departmentId', [
  [
    uuid("projectId"),
    uuid("departmentId"),
  ],
], validationMiddleware("Task", "Get"), taskController.getTasksByDepartment);

router.post('/:taskId/:projectMemberId', [
  [
    uuid("taskId"),
    uuid("projectMemberId"),
    dateFuture("due_date"),
  ],
], validationMiddleware("Task", "assign member"), taskController.assignChecklistTask);

router.put('/:taskId', [
  [
    uuid("taskId"),
    description().optional(),
    enumValue( "priority", ['low', 'medium', 'high', 'critical']).optional(),
  ],
], validationMiddleware("Task", "assign member"), taskController.updateTask);

router.put('/:taskId/complete',
  [
    uuid("taskId"),
  ], validationMiddleware("Task", "assign member"), taskController.completeTask);




module.exports = router;

