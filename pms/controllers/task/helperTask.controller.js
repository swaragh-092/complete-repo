// Author: Gururaj 
// Created: 14th oct 2025
// Description: Controller for helper task related routs related routes.
// Version: 1.0.0


const ResponseService = require("../../services/Response");
const { fieldPicker, sendErrorResponse } = require("../../util/helper");
const TaskService = require('../../services/task/task.service');

// create helper task 
exports.createHelperTask = async (req, res, ) => {
  const thisAction = { usedFor: "Helper Task", action: "Create" };
  try {
    const allowedFileds = [
        { field: "parentTaskId", as: "parent_task_id", source: "params" },
        { field: "projectMemberId", as: "project_member_id", },
        "title",
        "description",
        "priority",
        "due_date",
    ];
    const data = fieldPicker(req, allowedFileds);
    data.create_helper_task = true;
    const result = await TaskService.createTask(req, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// add already created task as helper task.
exports.addHelperTask = async (req, res, ) => {
  const thisAction = { usedFor: "Helper Task", action: "Add" };
  try {
    const allowedFileds = [
        { field: "helperTaskId", as: "helper_task_id", source: "params" },
        { field: "parentTaskId", as: "task_id", source: "params" },
    ];
    const data = fieldPicker(req, allowedFileds);
    const result = await TaskService.addTaskHelper(req, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// remove task from helper task.
exports.removeHelperTask = async (req, res, ) => {
  const thisAction = { usedFor: "Helper Task", action: "Remove" };
  try {
    const allowedFileds = [
        { field: "helperTaskId", as: "helper_task_id", source: "params" },
        { field: "parentTaskId", as: "parent_task_id", source: "params" },
    ];
    const data = fieldPicker(req, allowedFileds);
    const result = await TaskService.removeTaskHelper(req, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    
    return sendErrorResponse(thisAction, err, res);
  }
};

// get all helper task of the task.
exports.getAcceptableTask = async (req, res, ) => {
  const thisAction = { usedFor: "Helper Tasks", action: "Get" };
  try {
    
    const result = await TaskService.getAcceptableTask(req);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    
    return sendErrorResponse(thisAction, err, res);
  }
};

// get all helper task of the task.
exports.helperAcceptOrReject = async (req, res, ) => {
  const thisAction = { usedFor: "Helper Tasks", action: "Get" };
  try {
    
    const result = await TaskService.helperAcceptOrReject(req, {status : req.params.status, taskId : req.params.taskId},);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    
    return sendErrorResponse(thisAction, err, res);
  }
};