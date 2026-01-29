
// Author: Gururaj 
// Created: 09 Sep 2025
// Description: all routes related to dependency tasks of the project
// Version: 1.0.0

const express = require("express");
const {  name, uuid, description, enumValue, dateFuture } = require("../../services/validation");
const validationMiddleware = require("../../middleware/validation.middleware");
const dependencyTaskController = require("../../controllers/task/dependencyTask.controller");

const router = express.Router();

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


router.get('/:TaskId', [
  [
    uuid("TaskId"),
  ],
], validationMiddleware("Dependency Task", "Get"), dependencyTaskController.getDependencyTask);


router.get('/:TaskId/parent-task', [
  [
    uuid("TaskId"),
  ],
], validationMiddleware("Parent Task", "Get"), dependencyTaskController.getParentTasks);


router.post('/:dependencyTaskId/:parentTaskId', [
  [
    uuid("parentTaskId"),
    uuid("dependencyTaskId"),
  ],
], validationMiddleware("Dependency Task", "Add"), dependencyTaskController.addDependencyTask);

router.delete('/:dependencyTaskId/:parentTaskId', [
  [
    uuid("parentTaskId"),
    uuid("dependencyTaskId"),
  ],
], validationMiddleware("Dependency Task", "Add"), dependencyTaskController.removeDependencyTask);



module.exports = router;

