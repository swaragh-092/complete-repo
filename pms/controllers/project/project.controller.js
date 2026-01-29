/*   
Author: Homshree 
Created: 29th May 2025
Description: Controller for project-related routes, delegating logic to ProjectService.
Version: 1.0.2
Modified: Gururaj, modified completely based on new requirement (after includeing multi tenant) 
*/

const ProjectService = require("../../services/project/project.service");
const ResponseService = require("../../services/Response");
const { fieldPicker, sendErrorResponse } = require("../../util/helper");

// created new project
exports.postCreateProject = async (req, res) => {
  const thisAction = { usedFor: "Project", action: "register" };
  try {
    const allowedFileds = [
      "name",
      "code",
      "description",
      { field: "estimatedStartDate", as: "estimated_start_date" },
      { field: "estimatedEndDate", as: "estimated_end_date" },
    ];
    const data = fieldPicker(req, allowedFileds);
    const result = await ProjectService.createProject(req, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.getProject = async (req, res) => {
  const thisAction = { usedFor: "Project", action: "fetch" };
  try {
    const { id } = req.params;
    const result = await ProjectService.getProject(req, id);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// get project with all its features
exports.getProjectWithFeatures = async (req, res) => {
  const thisAction = { usedFor: "Project", action: "fetch" };
  try {
    const { id } = req.params;
    const result = await ProjectService.getProject(req, id, {include_features: true});
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// update project
exports.updateProject = async (req, res) => {
  const thisAction = { usedFor: "Project", action: "update" };
  try {
    const { id } = req.params;
    const allowedFileds = [
      "name",
      "code",
      "description",
      { field: "estimatedStartDate", as: "estimated_start_date" },
      { field: "estimatedEndDate", as: "estimated_end_date" },
    ];
    const data = fieldPicker(req, allowedFileds);
    const result = await ProjectService.updateProject(req, id, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.deleteProject = async (req, res) => {
  const thisAction = { usedFor: "Project", action: "delete" };
  try {
    const { id } = req.params;
    const result = await ProjectService.deleteProject(req, id);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// get all projects of organization.
exports.getAllProjects = async (req, res) => {
  const thisAction = { usedFor: "Project", action: "fetchAll" };
  try {
    const extrafilter = req.params.status;
    const result = await ProjectService.getAllProjects({ req, query : req.query, extrafilter });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.getAllUsersOngoingProjects = async (req, res) => {
  const thisAction = { usedFor: "Project", action: "fetchAll" };
  try {
    const result = await ProjectService.getAllUserOngoingProjects(req, {departmentId: req.params.departmentId });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.getOverviewData = async (req, res) => {
  
  const thisAction = { usedFor: "Overview", action: "fetch" };
  try {
    const result = await ProjectService.getOverviewData(req);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    
    return sendErrorResponse(thisAction, err, res);
  }
};
