// Author: Gururaj 
// Created: 14th oct 2025
// Description: Controller for task related routs related routes.
// Version: 1.0.0

const ResponseService = require("../../services/Response");
const { fieldPicker, sendErrorResponse } = require("../../util/helper");
const TaskService = require('../../services/task/task.service');


exports.createTask = async (req, res,) => {
  const thisAction = { usedFor: "Task", action: "Create" };
  try {
    const allowedFileds = [
        { field: "projectMemberId", as: "project_member_id", source: "params" },
        "title",
        "description",
        "priority",
        "due_date"
    ];
    const data = fieldPicker(req, allowedFileds);
    const result = await TaskService.createTask(req, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    
    return sendErrorResponse(thisAction, err, res);
  }
};


exports.deleteTask = async (req, res,) => {
  const thisAction = { usedFor: "Task", action: "Create" };
  try {
    const taskId = req.params.taskId;
    const result = await TaskService.deleteTask(req, taskId);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    
    return sendErrorResponse(thisAction, err, res);
  }
};


exports.getTasks = async (req, res, ) => {
  const thisAction = { usedFor: "Task", action: "Get" };
  try {
    const projectId = req.params.projectId;
    
    const result = await TaskService.getTasks(req, {project_id : projectId}, { query: req.query });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.getOnlyUserTasks = async (req, res, ) => {
  const thisAction = { usedFor: "Task", action: "Get" };
  try {
    const projectId = req.params.projectId;
    const statusFilter = req.params.status;
    
    const result = await TaskService.getTasks(req, {project_id : projectId, onlyUser : true, statusFilter}, { query: req.query });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.getOnlyUserTasksForStandup = async (req, res, ) => {
  const thisAction = { usedFor: "Task", action: "Get" };
  try {    
    const result = await TaskService.getTasksForDailyLog(req, {query: req.query });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.getOnlyUserTasksByDepartment = async (req, res, ) => {
  const thisAction = { usedFor: "Task", action: "Get" };
  try {
    const [project_id, department_id ] = [req.params.projectId, req.params.departmentId]; 
    
    const result = await TaskService.getTasks(req, {project_id, department_id, onlyUser : true}, { query: req.query });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.getTasksByDepartment = async (req, res, ) => {
  const thisAction = { usedFor: "Task", action: "Get" };
  try {
    const [project_id, department_id ] = [req.params.projectId, req.params.departmentId]; 
    
    const result = await TaskService.getTasks(req, {project_id, department_id}, { query: req.query });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    
    return sendErrorResponse(thisAction, err, res);
  }
};


exports.assignChecklistTask = async (req, res, ) => {
  const thisAction = { usedFor: "Task", action: "assign member" };
  try {
    const allowedFileds = [
        { field: "projectMemberId", as: "project_member_id", source: "params" },
        { field: "taskId", as: "task_id", source: "params" },
        "due_date",
    ];
    const data = fieldPicker(req, allowedFileds);
    const result = await TaskService.assignChecklistTask(req, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
   
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.updateTask = async (req, res, ) => {
  const thisAction = { usedFor: "Task", action: "Update" };
  try {
    const allowedFileds = [
        { field: "taskId", as: "task_id", source: "params" },
        "description",
        "priority",
    ];
    const data = fieldPicker(req, allowedFileds);
    const result = await TaskService.updateTask(req, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.updateTask = async (req, res, ) => {
  const thisAction = { usedFor: "Task", action: "Update" };
  try {
    const allowedFileds = [
        { field: "taskId", as: "task_id", source: "params" },
        "description",
        "priority",
    ];
    const data = fieldPicker(req, allowedFileds);
    const result = await TaskService.updateTask(req, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    
    return sendErrorResponse(thisAction, err, res);
  }
};


exports.completeTask = async (req, res, ) => {
  const thisAction = { usedFor: "Task", action: "Update" };
  try {
    const allowedFileds = [
        { field: "taskId", as: "task_id", source: "params" },
    ];
    const data = fieldPicker(req, allowedFileds);
    data.completed_at = new Date();
    data.status = "completed";
    const result = await TaskService.updateTask(req, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.getAssistedTasks = async (req, res, ) => {
  const thisAction = { usedFor: "Assisted Task", action: "Get" };
  try {
    const result = await TaskService.getAssistedTasks(req, req.params.taskId);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    
    return sendErrorResponse(thisAction, err, res);
  }
};

