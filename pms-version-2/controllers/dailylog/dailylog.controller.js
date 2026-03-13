// Author: Gururaj
// Created: 29th Sept 2025
// Description: controller for daily log functionality ( standup and wrapup )
// Version: 1.0.0
// Modified:

const ResponseService = require('../../services/Response');
const { fieldPicker } = require('../../util/helper');
const DailyLogService = require('../../services/dailylog/dailylog.service');

exports.createStandup = async (req, res) => {
  const thisAction = { usedFor: "Stand Up Task", action: "create" };
  try {
    const allowedFields = [
      "notes",
      "expected_duration",
      "task_id",
    ];

    const data = fieldPicker(req, allowedFields);

    const result = await DailyLogService.createStandUp( req, data );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error creating checklist:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

exports.getUserDailyLogs = async (req, res) => {
  const thisAction = { usedFor: "Daily Log", action: "Get" };
  try {
    const allowedFields = ["date"];
    const data = fieldPicker(req, allowedFields);    
    const result = await DailyLogService.getUserDailyLogs(req, data );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error creating checklist:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

exports.getNonStandupTasks = async (req, res) => {
  const thisAction = { usedFor: "Daily Log", action: "Get" };
  try {  
    const result = await DailyLogService.getNonStandupTasks(req);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error creating checklist:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

exports.getTaskLog = async (req, res) => {
  const thisAction = { usedFor: "Task Log", action: "Get" };
  try {
    const result = await DailyLogService.getTaskLogs(  req, req.params.taskId );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error creating checklist:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

exports.getProjectLog = async (req, res) => {
  const thisAction = { usedFor: "Project Task Log", action: "Get" };
  try {
    const result = await DailyLogService.getProjectLogs( req, req.params.projectId, );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error creating checklist:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

exports.updateLogNote = async (req, res) => {
  const thisAction = { usedFor: "Daily Log", action: "Update" };
  try {
    const allowedFields = [
      "notes",
      { field: "logId", as: "log_id", source: "params" },
    ];

    const data = fieldPicker(req, allowedFields);
    const result = await DailyLogService.updateLogNote( req, data, );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error creating checklist:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

