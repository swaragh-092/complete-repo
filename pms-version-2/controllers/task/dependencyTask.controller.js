// Author: Gururaj 
// Created: 14th oct 2025
// Description: Controller for dependency task related routs related routes.
// Version: 1.0.0

const ResponseService = require("../../services/Response");
const { fieldPicker, sendErrorResponse } = require("../../util/helper");
const TaskService = require('../../services/task/task.service');


exports.createDependencyTaskTask = async (req, res) => {

  const thisAction = { usedFor: "Dependency Task", action: "Create" };
  try {
    const allowedFileds = [
        { field: "dependencyTaskId", as: "depencency_task_id", source: "params" },
        { field: "projectMemberId", as: "project_member_id", },
        "title",
        "description",
        "priority",
        "due_date",
    ];
    const data = fieldPicker(req, allowedFileds);
    const result = await TaskService.createTask(req, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    
    return sendErrorResponse(thisAction, err, res);
  }
};



exports.addDependencyTask = async (req, res) => {
  const thisAction = { usedFor: "Dependency Task", action: "Add" };
  try {
    const allowedFileds = [
        { field: "dependencyTaskId", as: "dependency_task_id", source: "params" },
        { field: "parentTaskId", as: "parent_task_id", source: "params" },
    ];
    const data = fieldPicker(req, allowedFileds);
    const result = await TaskService.addTaskDependency(req, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    
    return sendErrorResponse(thisAction, err, res);
  }
};


exports.removeDependencyTask = async (req, res) => {
  const thisAction = { usedFor: "Dependency Task", action: "Add" };
  try {
    const allowedFileds = [
        { field: "dependencyTaskId", as: "dependency_task_id", source: "params" },
        { field: "parentTaskId", as: "parent_task_id", source: "params" },
    ];
    const data = fieldPicker(req, allowedFileds);
    const result = await TaskService.removeTaskDependency(req, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    
    return sendErrorResponse(thisAction, err, res);
  }
};


exports.getDependencyTask = async (req, res) => {
  const thisAction = { usedFor: "Dependency Task", action: "Get" };
  try {
    const allowedFileds = [
        { field: "TaskId", as: "task_id", source: "params" },
    ];
    const data = fieldPicker(req, allowedFileds);
    const result = await TaskService.getDependencyTask(req, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    
    return sendErrorResponse(thisAction, err, res);
  }
};
 
exports.getParentTasks = async (req, res) => {
  const thisAction = { usedFor: "Parent Task", action: "Get" };
  try {
    const allowedFileds = [
        { field: "TaskId", as: "task_id", source: "params" },
    ];
    const data = fieldPicker(req, allowedFileds);
    const result = await TaskService.getParentTasks(req, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    
    return sendErrorResponse(thisAction, err, res);
  }
};
 