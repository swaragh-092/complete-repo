
// Author: Gururaj 
// Created: 09 Sep 2025
// Description: all routes related to helper tasks of the project
// Version: 1.0.0

const express = require("express");
const {  name, uuid, description, enumValue, dateFuture, paramsEnum } = require("../../services/validation");
const validationMiddleware = require("../../middleware/validation.middleware");
const helperTaskController = require("../../controllers/task/helperTask.controller");

const router = express.Router();

router.post('/:parentTaskId', [
  [
    uuid("projectMemberId", "body"),
    uuid("parentTaskId"),
    name("title"),
    description().optional({ checkFalsy: true }),
    enumValue( "priority", ['low', 'medium', 'high', 'critical'] ).optional(),
    dateFuture("due_date" )

  ],
], validationMiddleware("Helper Task", "Create"), helperTaskController.createHelperTask);


router.post('/accept/:taskId/:status', [
  [
    uuid("taskId"),
    paramsEnum( "status", "params",['accept', "reject"] )
  ],
], validationMiddleware("Helper", "Accept or Reject"), helperTaskController.helperAcceptOrReject);


router.get('/accept', helperTaskController.getAcceptableTask);


router.put('/:helperTaskId/:parentTaskId', [
  [
    uuid("parentTaskId"),
    uuid("helperTaskId"),
  ],
], validationMiddleware("Helper Task", "Add"), helperTaskController.addHelperTask);


router.delete('/:helperTaskId/:parentTaskId', [
  [
    uuid("parentTaskId"),
    uuid("helperTaskId"),
  ],
], validationMiddleware("Helper Task", "Add"), helperTaskController.removeHelperTask);


module.exports = router;

