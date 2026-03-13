// Author: Gururaj
// Created: 19th June 2025
// Description: To manage all the feature and department relation controller.
// Version: 1.0.0
// Modified:

const FeatureService = require('../../services/feature/feature.service');
const ResponseService = require('../../services/Response');
const { fieldPicker } = require('../../util/helper');


// Create Feature
exports.createFeature = async (req, res) => {
  const thisAction = { usedFor: "Feature", action: "create" };
  try {
    const allowedFileds = [
      "name",
      "description",
      {field : "departmentId", as : "department_id", source : "params"},
    ];
    const data = fieldPicker(req, allowedFileds);

    const result = await FeatureService.createFeature(req, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error creating feature:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

// Get All Features of department where not belongs to given project
exports.getAllFeaturesOfDepartmentProjectFilter = async (req, res) => {
  const thisAction = { usedFor: "Feature", action: "get all" };
  try {
    const result = await FeatureService.getAllFeaturesOfDepartment(req, { department_id : req.params.departmentId , query : req.query, project_id : req.params.projectId });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error fetching features:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};  
// Get All Features
exports.getAllFeaturesOfDepartment = async (req, res) => {
  const thisAction = { usedFor: "Feature", action: "get all" };
  try {
    const result = await FeatureService.getAllFeaturesOfDepartment(req, { department_id : req.params.departmentId ,req, query : req.query });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error fetching features:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};  

// Get Feature by ID
exports.getFeatureById = async (req, res) => {
  const thisAction = { usedFor: "Feature", action: "getOne" };
  try {
    const { featureId } = req.params;
    const result = await FeatureService.getFeature(req, featureId);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error fetching feature:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

// Update Feature
exports.updateFeature = async (req, res) => {
  const thisAction = { usedFor: "Feature", action: "update" };
  try {
    const allowedFileds = [
      "name",
      "description",
      "status"
    ];
    const data = fieldPicker(req, allowedFileds);
    const result = await FeatureService.updateFeature(req, req.params.featureId, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error updating feature:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

// Delete Feature
exports.deleteFeature = async (req, res) => {
  const thisAction = { usedFor: "Feature", action: "delete" };
  try {
    const { featureId } = req.params;
    const result = await FeatureService.deleteFeature(req, featureId);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error deleting feature:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};


// add Feature To Project
exports.addFeatureToProject = async (req, res) => {
  const thisAction = { usedFor: "Feature", action: "Add to Project" };
  try {
    const data = (({ featureId, projectId }) => ({ featureId, projectId }))(req.params);

    console.log(data);
    const result = await FeatureService.addFeatureToProject( req, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error deleting feature:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};


// Get all features of project
exports.getAllFeaturesOfProject = async (req, res) => {
  const thisAction = { usedFor: "Feature", action: "Get" };
  try {
    const result = await FeatureService.getAllFeaturesOfProject(req,  {project_id : req.params.projectId, query : req.query });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error Get feature:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};
 