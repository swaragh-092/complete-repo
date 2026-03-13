// Author: Gururaj 
// Created: 14th oct 2025
// Description: Controller for task workflow related routs related routes.
// Version: 1.0.0

const ResponseService = require("../../services/Response");
const { sendErrorResponse } = require("../../util/helper");
const TaskWorkFlowService = require('../../services/task/taskWorkFlow.service');


exports.startTask = async (req, res,) => {
  const thisAction = { usedFor: "Task", action: "Start" };
  try {
    
    const result = await TaskWorkFlowService.takeTask(req, req.params.taskId);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    
    return sendErrorResponse(thisAction, err, res);
  }
};


exports.endTasks = async (req, res, ) => {
  const thisAction = { usedFor: "Tasks", action: "End" };
  try {
    const result = await TaskWorkFlowService.endTasks(req);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.getCurrentWrokingTask = async (req, res, ) => {
  const thisAction = { usedFor: "Tasks", action: "Get" };
  try {
    const result = await TaskWorkFlowService.getCurrentWrokingTask(req);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    
    return sendErrorResponse(thisAction, err, res);
  }
};

