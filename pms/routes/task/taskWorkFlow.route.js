
// Author: Gururaj 
// Created: 09 Sep 2025
// Description: all routes related to workflow (stand up and wrapup) of the project
// Version: 1.0.0

const express = require("express");
const {  uuid,} = require("../../services/validation");
const validationMiddleware = require("../../middleware/validation.middleware");
const taskWorkflowController = require("../../controllers/task/taskWorkflow.controller");

const router = express.Router();

router.post('/:taskId/start', [
  [
    uuid("taskId"),
  ],
], validationMiddleware("Task", "Start"), taskWorkflowController.startTask);

router.delete('/end',  taskWorkflowController.endTasks);

router.get('/current',  taskWorkflowController.getCurrentWrokingTask);


module.exports = router;

