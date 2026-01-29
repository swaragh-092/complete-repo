// Author : Gururaj
// Created: 30th July 2025
// Description: controller for project.
// Version: 1.0.0
// Modified: 

const projectSercvice = require("../../services/project/project.service");
const projectVersionService = require("../../services/project/projectVersion.service");
const ResponseService = require("../../services/Response");
const { fieldPicker } = require("../../util/helper");


exports.create = async (req, res) => {
  const thisAction = { usedFor: 'Project', action: 'Create' };
  try {
    const allowedFields = ["name", "short_name", "sub_domain"];
    const data = fieldPicker(req, allowedFields);
    const result = await projectSercvice.create({ req, data });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error creating Project:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.update = async (req, res) => {
  const thisAction = { usedFor: 'Project', action: 'Create' };
  try {
    const allowedFields = ["name", "short_name", "sub_domain", "is_active"];
    const id = req.params.id;
    const data = fieldPicker(req, allowedFields);
    const result = await projectSercvice.update({id, req, data });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error creating Project:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.getAllProjects = async (req, res) => {
  const thisAction = { usedFor: 'Project', action: 'Get' };
  try {
    const result = await projectSercvice.getAll(req.query);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error getting Project:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.getProjectById = async (req, res) => {
  const thisAction = { usedFor: 'Project', action: 'Get' };
  try {
    const id = req.params.id;
    const result = await projectSercvice.getProjectById(id);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error getting Project:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.getProjectWtihVersion = async (req, res) => {
  const thisAction = { usedFor: 'Project', action: 'Get' };
  try {
    const id = req.params.id;
    const version_id = req.params.versionId;
    const result = await projectSercvice.getProjectWithVersion(id, version_id);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error getting Project:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};


// addes modules to Project with latest and skips if plan already exists, if verison of that is already used then will create new snapshot
exports.addModulesToProject = async (req, res) => {
  const thisAction = { usedFor: 'Project', action: 'Update' };
  try {
    const data = { module_version_ids: req.body.module_version_ids, project_id: req.params.projectId };
    const result = await projectVersionService.addModulesToProject({ req, data });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err){
    console.error("Error Updating project modules:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

// remove modules to project with latest snapshot and skips if plan already exists, if verison of that is already used then will create new snapshot
exports.removeModulesToProject = async (req, res) => {
  const thisAction = { usedFor: 'Project', action: 'Update' };
  try {
    const data = { module_version_ids: req.body.module_version_ids, project_id: req.params.projectId };
    const result = await projectVersionService.removeModulesFromProject({ req, data });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err){
    console.error("Error Updating project modules:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

// add features for project modules for perticular version, skips if already exists
exports.addFeaturesToProject = async (req, res) => {
  const thisAction = { usedFor: "Project Feature", action: "Add" };
  try {
    const data = {
      project_id: req.params.projectId,
      module_version_id: req.params.moduleVersionId,
      feature_ids: req.body.feature_ids,
    };

    const result = await projectVersionService.addFeaturesToModelOfProject({ req, data });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error adding plan features:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

// removes features for project modules for perticular version, skips if already not there
exports.removeFeaturesFromProject = async (req, res) => {
  const thisAction = { usedFor: "Project Feature", action: "Remove" };
  try {
    const data = {
      project_id: req.params.projectId,
      module_version_id: req.params.moduleVersionId,
      feature_ids: req.body.feature_ids,
    };

    const result = await projectVersionService.removeFeaturesFromModelOfProject({ req, data });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error removing plan features:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};
